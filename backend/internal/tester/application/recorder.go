package application

import (
	"context"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

// DefaultFlushWindow is how long a user's activity is held in memory before it
// is written. One write per user per five minutes is what keeps this feature
// off the request path of a box that runs on one core: a tester polling the
// recitation queue once a second would otherwise be one MongoDB write a second.
const DefaultFlushWindow = 5 * time.Minute

type pending struct {
	flushedAt time.Time
	lastSeen  time.Time
	requests  int
	client    string
}

// Recorder turns authenticated requests into one activity row per user per day.
//
// Nothing here blocks the caller: Touch takes a mutex for a handful of map
// operations and hands the write to a goroutine. Whatever has not been flushed
// when the process exits is lost, which costs at most a few minutes of request
// counts on a row that already says the user was there.
type Recorder struct {
	repo   domain.Repository
	loc    *time.Location
	window time.Duration
	now    func() time.Time

	mu        sync.Mutex
	users     map[string]*pending // keyed by "userID|date"
	lastSweep time.Time
}

func NewRecorder(repo domain.Repository, loc *time.Location, window time.Duration) *Recorder {
	if loc == nil {
		loc = time.UTC
	}
	if window <= 0 {
		window = DefaultFlushWindow
	}
	return &Recorder{
		repo:   repo,
		loc:    loc,
		window: window,
		now:    time.Now,
		users:  make(map[string]*pending),
	}
}

// Location is the timezone days are bucketed in.
func (r *Recorder) Location() *time.Location { return r.loc }

// Touch notes that userID just made a request. client is "android", "ios",
// "web" or empty when the user agent says nothing useful.
func (r *Recorder) Touch(userID, client string) {
	if r == nil || r.repo == nil || userID == "" {
		return
	}

	now := r.now().UTC()
	date := now.In(r.loc).Format("2006-01-02")
	key := userID + "|" + date

	r.mu.Lock()
	entry, ok := r.users[key]
	if !ok {
		entry = &pending{}
		r.users[key] = entry
	}
	entry.requests++
	entry.lastSeen = now
	if client != "" {
		entry.client = client
	}

	// A brand-new key flushes at once: it is either the user's first request of
	// the day or the first after a restart, and that is the fact the report is
	// actually about. Everything after it waits out the window.
	var pings []domain.Ping
	if now.Sub(entry.flushedAt) >= r.window {
		pings = append(pings, take(userID, date, entry, now))
	}
	pings = append(pings, r.sweep(now)...)
	r.mu.Unlock()

	r.send(pings)
}

// Flush writes everything still held in memory. Called on shutdown, where the
// alternative is losing the last few minutes of a tester's day.
func (r *Recorder) Flush(ctx context.Context) {
	if r == nil || r.repo == nil {
		return
	}

	now := r.now().UTC()

	r.mu.Lock()
	pings := make([]domain.Ping, 0, len(r.users))
	for key, entry := range r.users {
		if entry.requests == 0 {
			continue
		}
		userID, date := splitKey(key)
		pings = append(pings, take(userID, date, entry, now))
	}
	r.users = make(map[string]*pending)
	r.mu.Unlock()

	for _, p := range pings {
		_ = r.repo.RecordActivity(ctx, p)
	}
}

func (r *Recorder) send(pings []domain.Ping) {
	for _, p := range pings {
		p := p
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			_ = r.repo.RecordActivity(ctx, p)
		}()
	}
}

// sweep flushes and forgets users who stopped making requests part-way through
// a window — including yesterday's key once midnight has passed. Without it
// their last few requests would never be written and the map would keep an
// entry for every user the process has ever seen. Callers hold the mutex.
func (r *Recorder) sweep(now time.Time) []domain.Ping {
	if now.Sub(r.lastSweep) < r.window {
		return nil
	}
	r.lastSweep = now

	var pings []domain.Ping
	for key, entry := range r.users {
		if now.Sub(entry.lastSeen) < r.window {
			continue
		}
		if entry.requests > 0 {
			userID, date := splitKey(key)
			pings = append(pings, take(userID, date, entry, now))
		}
		delete(r.users, key)
	}
	return pings
}

// take turns an entry's held requests into a ping and marks it flushed.
func take(userID, date string, entry *pending, now time.Time) domain.Ping {
	p := domain.Ping{
		UserID:   userID,
		Date:     date,
		SeenAt:   entry.lastSeen,
		Requests: entry.requests,
		Client:   entry.client,
	}
	entry.flushedAt = now
	entry.requests = 0
	return p
}

func splitKey(key string) (userID, date string) {
	for i := len(key) - 1; i >= 0; i-- {
		if key[i] == '|' {
			return key[:i], key[i+1:]
		}
	}
	return key, ""
}
