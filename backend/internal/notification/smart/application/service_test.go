package application

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/notification/smart/domain"

	notifdomain "github.com/chawais/deenquest/backend/internal/notification/domain"
	"github.com/chawais/deenquest/backend/internal/platform/push"
)

// ── fakes ─────────────────────────────────────────────────────────────────────

type fakeFetcher struct {
	users []domain.UserContext

	pages       int
	seenCursors []string
	activeHours domain.HourSet
}

// FetchUserPage serves `users` in keyset pages, mimicking the Mongo adapter:
// a full page returns a cursor, a short page ends the scan.
func (f *fakeFetcher) FetchUserPage(
	_ context.Context,
	afterID string,
	limit int,
	activeHours domain.HourSet,
	_ time.Time,
) ([]domain.UserContext, string, error) {
	f.pages++
	f.seenCursors = append(f.seenCursors, afterID)
	f.activeHours = activeHours

	start := 0
	if afterID != "" {
		for i := range f.users {
			if f.users[i].UserID == afterID {
				start = i + 1
				break
			}
		}
	}

	end := start + limit
	if end > len(f.users) {
		end = len(f.users)
	}
	page := f.users[start:end]

	next := ""
	if len(page) == limit && end < len(f.users) {
		next = page[len(page)-1].UserID
	}
	return page, next, nil
}

type fakeLogRepo struct {
	last  []domain.LastNotification
	saved []*domain.NotificationLog

	batchCalls int
	batchSizes []int
}

func (r *fakeLogRepo) SaveLog(_ context.Context, log *domain.NotificationLog) error {
	r.saved = append(r.saved, log)
	return nil
}

func (r *fakeLogRepo) GetLastNotificationTimes(_ context.Context, userIDs []string) ([]domain.LastNotification, error) {
	r.batchCalls++
	r.batchSizes = append(r.batchSizes, len(userIDs))

	wanted := make(map[string]bool, len(userIDs))
	for _, id := range userIDs {
		wanted[id] = true
	}
	out := make([]domain.LastNotification, 0)
	for _, l := range r.last {
		if wanted[l.UserID] {
			out = append(out, l)
		}
	}
	return out, nil
}

type fakeSender struct {
	sentTo []string
	fail   bool
}

func (s *fakeSender) SendToUser(_ context.Context, user notifdomain.UserInfo, _ notifdomain.Message) (*push.Ticket, error) {
	if s.fail {
		return nil, fmt.Errorf("push rejected")
	}
	s.sentTo = append(s.sentTo, user.ID)
	return &push.Ticket{}, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

// oneRule replaces the production rules with a single always-firing rule that
// is open around the clock, so tests exercise the scan and not the calendar.
func oneRule(typ domain.NotificationType, cooldown time.Duration) []domain.NotificationRule {
	return []domain.NotificationRule{{
		Type:         typ,
		Cooldown:     cooldown,
		TimeWindow:   domain.TimeWindow{StartHour: 0, EndHour: 24},
		Evaluate:     func(*domain.UserContext, time.Time) bool { return true },
		BuildTitle:   func(*domain.UserContext) string { return "title" },
		BuildMessage: func(*domain.UserContext) string { return "body" },
	}}
}

func makeUsers(n int) []domain.UserContext {
	users := make([]domain.UserContext, 0, n)
	for i := 0; i < n; i++ {
		users = append(users, domain.UserContext{
			UserID:          fmt.Sprintf("user-%03d", i),
			ExpoPushToken:   "ExponentPushToken[x]",
			Timezone:        "UTC",
			TodayTasksTotal: 3,
		})
	}
	return users
}

func newTestService(f *fakeFetcher, r *fakeLogRepo, snd *fakeSender, batchSize int) *Service {
	svc := NewService(f, r, snd)
	svc.rules = oneRule(domain.DailyTaskReminder, time.Hour)
	svc.batchSize = batchSize
	svc.maxRetries = 1
	return svc
}

// ── tests ─────────────────────────────────────────────────────────────────────

// The offset paging it replaced applied limit before offset, so the second page
// was always empty and every user past the first batch was silently skipped.
func TestProcessAllNotificationsWalksEveryPage(t *testing.T) {
	fetcher := &fakeFetcher{users: makeUsers(250)}
	repo := &fakeLogRepo{}
	sender := &fakeSender{}
	svc := newTestService(fetcher, repo, sender, 100)

	stats, err := svc.ProcessAllNotifications(context.Background())
	if err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	if stats.TotalUsers != 250 {
		t.Errorf("processed %d users, want 250", stats.TotalUsers)
	}
	if len(sender.sentTo) != 250 {
		t.Errorf("sent %d notifications, want 250", len(sender.sentTo))
	}
	if fetcher.pages != 3 {
		t.Errorf("fetched %d pages, want 3", fetcher.pages)
	}
	if got := fetcher.seenCursors; got[0] != "" || got[1] != "user-099" || got[2] != "user-199" {
		t.Errorf("cursors = %v, want [\"\" user-099 user-199]", got)
	}
}

// One cooldown query per page, never one per user per rule.
func TestCooldownsAreLoadedOncePerPage(t *testing.T) {
	fetcher := &fakeFetcher{users: makeUsers(250)}
	repo := &fakeLogRepo{}
	svc := newTestService(fetcher, repo, &fakeSender{}, 100)

	if _, err := svc.ProcessAllNotifications(context.Background()); err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	if repo.batchCalls != 3 {
		t.Errorf("cooldown queries = %d, want 3 (one per page)", repo.batchCalls)
	}
	for i, size := range repo.batchSizes {
		if size == 0 {
			t.Errorf("cooldown query %d asked for 0 users", i)
		}
	}
}

func TestUserOnCooldownIsSkipped(t *testing.T) {
	fetcher := &fakeFetcher{users: makeUsers(2)}
	repo := &fakeLogRepo{last: []domain.LastNotification{{
		UserID: "user-000",
		Type:   domain.DailyTaskReminder,
		SentAt: time.Now().Add(-10 * time.Minute),
	}}}
	sender := &fakeSender{}
	svc := newTestService(fetcher, repo, sender, 100)

	if _, err := svc.ProcessAllNotifications(context.Background()); err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	if len(sender.sentTo) != 1 || sender.sentTo[0] != "user-001" {
		t.Errorf("sent to %v, want only user-001 (user-000 is inside its cooldown)", sender.sentTo)
	}
}

func TestExpiredCooldownSendsAgain(t *testing.T) {
	fetcher := &fakeFetcher{users: makeUsers(1)}
	repo := &fakeLogRepo{last: []domain.LastNotification{{
		UserID: "user-000",
		Type:   domain.DailyTaskReminder,
		SentAt: time.Now().Add(-90 * time.Minute),
	}}}
	sender := &fakeSender{}
	svc := newTestService(fetcher, repo, sender, 100)

	if _, err := svc.ProcessAllNotifications(context.Background()); err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	if len(sender.sentTo) != 1 {
		t.Errorf("sent %d notifications, want 1 — the 1h cooldown lapsed 30m ago", len(sender.sentTo))
	}
}

// The scan must hand the fetcher the union of rule windows so users outside
// every window are never enriched.
func TestActiveHoursArePassedToFetcher(t *testing.T) {
	fetcher := &fakeFetcher{users: makeUsers(1)}
	svc := newTestService(fetcher, &fakeLogRepo{}, &fakeSender{}, 100)
	svc.rules = []domain.NotificationRule{{
		Type:         domain.StreakWarning,
		TimeWindow:   domain.TimeWindow{StartHour: 18, EndHour: 22},
		Evaluate:     func(*domain.UserContext, time.Time) bool { return false },
		BuildTitle:   func(*domain.UserContext) string { return "" },
		BuildMessage: func(*domain.UserContext) string { return "" },
	}}

	if _, err := svc.ProcessAllNotifications(context.Background()); err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	for hour := 0; hour < 24; hour++ {
		want := hour >= 18 && hour < 22
		if got := fetcher.activeHours.Contains(hour); got != want {
			t.Errorf("activeHours.Contains(%d) = %v, want %v", hour, got, want)
		}
	}
}

// A page where nobody is eligible must not end the scan early.
func TestEmptyPageDoesNotStopTheScan(t *testing.T) {
	fetcher := &sparseFetcher{total: 3, eligibleOn: 2}
	sender := &fakeSender{}
	svc := newTestService(&fakeFetcher{}, &fakeLogRepo{}, sender, 100)
	svc.userFetcher = fetcher

	stats, err := svc.ProcessAllNotifications(context.Background())
	if err != nil {
		t.Fatalf("ProcessAllNotifications: %v", err)
	}

	if fetcher.calls != 3 {
		t.Errorf("fetched %d pages, want 3 — an empty page must not end the scan", fetcher.calls)
	}
	if stats.TotalUsers != 1 {
		t.Errorf("processed %d users, want 1", stats.TotalUsers)
	}
}

// sparseFetcher returns `total` pages, only one of which carries a user — the
// shape produced when everyone on a page is outside every rule window.
type sparseFetcher struct {
	total      int
	eligibleOn int
	calls      int
}

func (f *sparseFetcher) FetchUserPage(
	_ context.Context,
	_ string,
	_ int,
	_ domain.HourSet,
	_ time.Time,
) ([]domain.UserContext, string, error) {
	f.calls++

	var users []domain.UserContext
	if f.calls == f.eligibleOn {
		users = makeUsers(1)
	}

	next := ""
	if f.calls < f.total {
		next = fmt.Sprintf("cursor-%d", f.calls)
	}
	return users, next, nil
}

func TestActiveHoursUnionsOverlappingWindows(t *testing.T) {
	set := domain.ActiveHours([]domain.NotificationRule{
		{TimeWindow: domain.TimeWindow{StartHour: 9, EndHour: 14}},
		{TimeWindow: domain.TimeWindow{StartHour: 12, EndHour: 16}},
		{TimeWindow: domain.TimeWindow{StartHour: 22, EndHour: 23}},
	})

	for hour := 0; hour < 24; hour++ {
		want := (hour >= 9 && hour < 16) || hour == 22
		if got := set.Contains(hour); got != want {
			t.Errorf("Contains(%d) = %v, want %v", hour, got, want)
		}
	}

	if set.Contains(-1) || set.Contains(24) {
		t.Error("Contains must reject out-of-range hours")
	}
}
