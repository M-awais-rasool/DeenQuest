package application

import (
	"context"
	"testing"
	"time"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

type reportRepo struct {
	activity []domain.ActivityDay
	roster   []domain.RosterEntry
	accounts []domain.Account

	savedEntries []domain.RosterEntry
	savedReplace bool
	deleted      string
}

func (r *reportRepo) RecordActivity(context.Context, domain.Ping) error { return nil }

func (r *reportRepo) Activity(_ context.Context, from, to string) ([]domain.ActivityDay, error) {
	var out []domain.ActivityDay
	for _, d := range r.activity {
		if d.Date >= from && d.Date <= to {
			out = append(out, d)
		}
	}
	return out, nil
}

func (r *reportRepo) Roster(context.Context) ([]domain.RosterEntry, error) { return r.roster, nil }

func (r *reportRepo) SaveRoster(_ context.Context, entries []domain.RosterEntry, replace bool) error {
	r.savedEntries, r.savedReplace = entries, replace
	r.roster = entries
	return nil
}

func (r *reportRepo) DeleteRoster(_ context.Context, email string) error {
	r.deleted = email
	return nil
}

func (r *reportRepo) Accounts(context.Context, []string, []string) ([]domain.Account, error) {
	return r.accounts, nil
}

func at(day int, hour int) time.Time {
	return time.Date(2026, 9, day, hour, 0, 0, 0, time.UTC)
}

func testService(repo domain.Repository) *Service {
	svc := NewService(repo, time.UTC)
	svc.now = func() time.Time { return at(12, 20) } // 2026-09-12, evening
	return svc
}

func findRow(t *testing.T, report *domain.Report, email string) domain.TesterRow {
	t.Helper()
	for _, row := range report.Testers {
		if row.Email == email {
			return row
		}
	}
	t.Fatalf("no row for %s", email)
	return domain.TesterRow{}
}

func fullReport(t *testing.T) (*domain.Report, *reportRepo) {
	t.Helper()

	repo := &reportRepo{
		roster: []domain.RosterEntry{
			{Email: "faithful@example.com"},
			{Email: "quiet@example.com"},
			{Email: "never@example.com"},
		},
		accounts: []domain.Account{
			{ID: "u-faithful", Email: "faithful@example.com", DisplayName: "Faithful", CreatedAt: at(1, 9)},
			{ID: "u-quiet", Email: "quiet@example.com", DisplayName: "Quiet", CreatedAt: at(2, 9)},
			{ID: "u-stranger", Email: "stranger@example.com", DisplayName: "Stranger", CreatedAt: at(3, 9)},
		},
		activity: []domain.ActivityDay{
			{UserID: "u-faithful", Date: "2026-09-10", FirstSeen: at(10, 8), LastSeen: at(10, 9), Requests: 12, Client: "android"},
			{UserID: "u-faithful", Date: "2026-09-11", FirstSeen: at(11, 8), LastSeen: at(11, 9), Requests: 20, Client: "android"},
			{UserID: "u-faithful", Date: "2026-09-12", FirstSeen: at(12, 8), LastSeen: at(12, 9), Requests: 8, Client: "android"},
			{UserID: "u-quiet", Date: "2026-09-09", FirstSeen: at(9, 18), LastSeen: at(9, 19), Requests: 4, Client: "ios"},
			{UserID: "u-stranger", Date: "2026-09-12", FirstSeen: at(12, 7), LastSeen: at(12, 7), Requests: 3},
		},
	}

	report, err := testService(repo).Report(context.Background(), 7)
	if err != nil {
		t.Fatalf("Report: %v", err)
	}
	return report, repo
}

func TestReportDrawsTheRequestedWindow(t *testing.T) {
	report, _ := fullReport(t)

	if len(report.Days) != 7 {
		t.Fatalf("got %d columns, want 7", len(report.Days))
	}
	if report.Days[0] != "2026-09-06" || report.Days[6] != "2026-09-12" {
		t.Errorf("window = %s..%s", report.Days[0], report.Days[6])
	}
	if report.Today != "2026-09-12" {
		t.Errorf("today = %s", report.Today)
	}
}

func TestReportMarksWhoOpenedItToday(t *testing.T) {
	report, _ := fullReport(t)

	faithful := findRow(t, report, "faithful@example.com")
	if !faithful.ActiveToday || faithful.DaysActive != 3 || faithful.CurrentStreak != 3 {
		t.Errorf("faithful = %+v", faithful)
	}
	if faithful.TotalRequests != 40 || faithful.Client != "android" {
		t.Errorf("faithful counters = %d requests, client %q", faithful.TotalRequests, faithful.Client)
	}

	quiet := findRow(t, report, "quiet@example.com")
	if quiet.ActiveToday || quiet.DaysActive != 1 || quiet.DaysSinceSeen != 3 {
		t.Errorf("quiet = %+v", quiet)
	}
}

// A tester who was invited but never signed in has no account at all, and is
// the single most useful row on the page.
func TestReportKeepsTestersWhoNeverSignedIn(t *testing.T) {
	report, _ := fullReport(t)

	never := findRow(t, report, "never@example.com")
	if never.HasAccount || never.LastSeen != nil || never.DaysSinceSeen != -1 {
		t.Errorf("never = %+v", never)
	}
	if !never.InRoster {
		t.Error("roster membership lost")
	}
}

// Someone who signed in with a different account than the one invited still
// has to be visible, marked as off-roster.
func TestReportIncludesUsersOutsideTheRoster(t *testing.T) {
	report, _ := fullReport(t)

	stranger := findRow(t, report, "stranger@example.com")
	if stranger.InRoster {
		t.Error("stranger counted as a roster tester")
	}
	if !stranger.ActiveToday {
		t.Error("stranger's activity was dropped")
	}
}

func TestReportSummaryCountsEachState(t *testing.T) {
	report, _ := fullReport(t)

	want := domain.Summary{
		Roster:        3,
		Signed:        2,
		NeverOpened:   1,
		ActiveToday:   2, // faithful + the off-roster stranger
		MissingToday:  2, // quiet + never
		PerfectWindow: 0,
	}
	if report.Summary != want {
		t.Errorf("summary = %+v, want %+v", report.Summary, want)
	}
}

// The page exists to answer "who do I message today", so the silent testers
// have to be at the top.
func TestReportPutsTheSilentTestersFirst(t *testing.T) {
	report, _ := fullReport(t)

	order := make([]string, len(report.Testers))
	for i, row := range report.Testers {
		order[i] = row.Email
	}
	want := []string{
		"never@example.com",    // never opened it
		"quiet@example.com",    // silent for three days
		"stranger@example.com", // opened it today, off roster
		"faithful@example.com", // opened it today
	}
	for i := range want {
		if order[i] != want[i] {
			t.Fatalf("order = %v, want %v", order, want)
		}
	}
}

// Today not being over yet must not read as a broken streak.
func TestStreakSurvivesAnEmptyToday(t *testing.T) {
	cells := []domain.DayCell{
		{Active: true}, {Active: true}, {Active: false},
	}
	if got := streak(cells); got != 2 {
		t.Errorf("streak = %d, want 2", got)
	}

	cells[1].Active = false
	if got := streak(cells); got != 0 {
		t.Errorf("streak after a missed yesterday = %d, want 0", got)
	}
}

func TestSaveRosterAcceptsAPastedList(t *testing.T) {
	repo := &reportRepo{}
	svc := testService(repo)

	_, err := svc.SaveRoster(context.Background(), []string{
		"One <ONE@example.com>, two@example.com\nthree@example.com; two@example.com",
		"not-an-email",
	}, true)
	if err != nil {
		t.Fatalf("SaveRoster: %v", err)
	}

	var got []string
	for _, e := range repo.savedEntries {
		got = append(got, e.Email)
	}
	want := []string{"one@example.com", "two@example.com", "three@example.com"}
	if len(got) != len(want) {
		t.Fatalf("parsed %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("parsed %v, want %v", got, want)
		}
	}
	if !repo.savedReplace {
		t.Error("replace flag lost")
	}
}

func TestSaveRosterRejectsAListWithNoAddresses(t *testing.T) {
	svc := testService(&reportRepo{})

	if _, err := svc.SaveRoster(context.Background(), []string{"oops"}, false); err != ErrNoEmails {
		t.Errorf("err = %v, want ErrNoEmails", err)
	}
}
