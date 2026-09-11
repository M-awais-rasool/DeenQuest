package http

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sort"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/chawais/deenquest/backend/internal/tester/application"
	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

// memoryRepo is the whole feature minus MongoDB: enough to drive the tracker,
// the report and the roster endpoints through a real gin engine.
type memoryRepo struct {
	mu       sync.Mutex
	activity map[string]*domain.ActivityDay
	roster   map[string]domain.RosterEntry
	accounts []domain.Account
}

func newMemoryRepo(accounts ...domain.Account) *memoryRepo {
	return &memoryRepo{
		activity: map[string]*domain.ActivityDay{},
		roster:   map[string]domain.RosterEntry{},
		accounts: accounts,
	}
}

func (m *memoryRepo) RecordActivity(_ context.Context, p domain.Ping) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	key := p.UserID + "|" + p.Date
	day, ok := m.activity[key]
	if !ok {
		day = &domain.ActivityDay{ID: key, UserID: p.UserID, Date: p.Date, FirstSeen: p.SeenAt}
		m.activity[key] = day
	}
	day.LastSeen = p.SeenAt
	day.Requests += p.Requests
	if p.Client != "" {
		day.Client = p.Client
	}
	return nil
}

func (m *memoryRepo) Activity(_ context.Context, from, to string) ([]domain.ActivityDay, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	var out []domain.ActivityDay
	for _, day := range m.activity {
		if day.Date >= from && day.Date <= to {
			out = append(out, *day)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (m *memoryRepo) Roster(context.Context) ([]domain.RosterEntry, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	out := make([]domain.RosterEntry, 0, len(m.roster))
	for _, e := range m.roster {
		out = append(out, e)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Email < out[j].Email })
	return out, nil
}

func (m *memoryRepo) SaveRoster(_ context.Context, entries []domain.RosterEntry, replace bool) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	if replace {
		m.roster = map[string]domain.RosterEntry{}
	}
	for _, e := range entries {
		m.roster[e.Email] = e
	}
	return nil
}

func (m *memoryRepo) DeleteRoster(_ context.Context, email string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.roster, email)
	return nil
}

func (m *memoryRepo) Accounts(_ context.Context, emails, userIDs []string) ([]domain.Account, error) {
	want := map[string]bool{}
	for _, e := range emails {
		want[e] = true
	}
	for _, id := range userIDs {
		want[id] = true
	}

	var out []domain.Account
	for _, a := range m.accounts {
		if want[a.Email] || want[a.ID] {
			out = append(out, a)
		}
	}
	return out, nil
}

// engine mirrors how app/http.go mounts this: the tracker on the authenticated
// group, the report under /admin.
func engine(repo domain.Repository) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()

	rec := application.NewRecorder(repo, time.UTC, time.Minute)
	handler := NewAdminHandler(application.NewService(repo, time.UTC))

	authed := r.Group("/api/v1")
	authed.Use(func(c *gin.Context) {
		if id := c.GetHeader("X-Test-User"); id != "" {
			c.Set("user_id", id)
			c.Next()
			return
		}
		c.AbortWithStatus(http.StatusUnauthorized)
	})
	authed.Use(Track(rec))
	authed.GET("/progress/me", func(c *gin.Context) { c.Status(http.StatusOK) })

	RegisterAdminRoutes(r.Group("/api/v1/admin"), handler)
	return r
}

func call(t *testing.T, r *gin.Engine, method, path, body string, headers map[string]string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	for k, v := range headers {
		req.Header.Set(k, v)
	}

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func report(t *testing.T, r *gin.Engine) domain.Report {
	t.Helper()

	w := call(t, r, "GET", "/api/v1/admin/testers?days=7", "", nil)
	if w.Code != http.StatusOK {
		t.Fatalf("report status = %d: %s", w.Code, w.Body.String())
	}

	var body struct {
		Data domain.Report `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("decode report: %v", err)
	}
	return body.Data
}

// The point of the whole feature: an ordinary authenticated call from the
// already-published build marks the tester present, with no app change.
func TestAnAuthenticatedCallMarksTheTesterActive(t *testing.T) {
	repo := newMemoryRepo(domain.Account{
		ID: "u1", Email: "tester@example.com", DisplayName: "Tester",
	})
	r := engine(repo)

	w := call(t, r, "POST", "/api/v1/admin/testers/roster",
		`{"emails":["tester@example.com"],"replace":true}`, nil)
	if w.Code != http.StatusOK {
		t.Fatalf("roster save status = %d: %s", w.Code, w.Body.String())
	}

	before := report(t, r)
	if before.Summary.MissingToday != 1 {
		t.Fatalf("before the call, missing_today = %d, want 1", before.Summary.MissingToday)
	}

	if w := call(t, r, "GET", "/api/v1/progress/me", "", map[string]string{
		"X-Test-User": "u1",
		"User-Agent":  "okhttp/4.12.0",
	}); w.Code != http.StatusOK {
		t.Fatalf("app call status = %d", w.Code)
	}
	waitForRows(t, repo, 1)

	after := report(t, r)
	if after.Summary.ActiveToday != 1 || after.Summary.MissingToday != 0 {
		t.Fatalf("summary = %+v", after.Summary)
	}
	if len(after.Testers) != 1 {
		t.Fatalf("got %d rows", len(after.Testers))
	}
	row := after.Testers[0]
	if !row.ActiveToday || row.Client != "android" || row.Days[len(row.Days)-1].Requests != 1 {
		t.Errorf("row = %+v", row)
	}
}

// A rejected request is not someone using the app.
func TestAnUnauthenticatedCallRecordsNothing(t *testing.T) {
	repo := newMemoryRepo()
	r := engine(repo)

	if w := call(t, r, "GET", "/api/v1/progress/me", "", nil); w.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", w.Code)
	}

	time.Sleep(50 * time.Millisecond)
	repo.mu.Lock()
	defer repo.mu.Unlock()
	if len(repo.activity) != 0 {
		t.Errorf("recorded %d rows for an unauthenticated call", len(repo.activity))
	}
}

func TestRemovingATesterDropsTheRow(t *testing.T) {
	repo := newMemoryRepo()
	r := engine(repo)

	call(t, r, "POST", "/api/v1/admin/testers/roster",
		`{"emails":["a@example.com, b@example.com"],"replace":true}`, nil)
	if got := len(report(t, r).Testers); got != 2 {
		t.Fatalf("got %d rows, want 2", got)
	}

	if w := call(t, r, "DELETE", "/api/v1/admin/testers/roster/a%40example.com", "", nil); w.Code != http.StatusOK {
		t.Fatalf("delete status = %d: %s", w.Code, w.Body.String())
	}

	rows := report(t, r).Testers
	if len(rows) != 1 || rows[0].Email != "b@example.com" {
		t.Errorf("rows = %+v", rows)
	}
}

func TestAPastedListWithNoAddressesIsRejected(t *testing.T) {
	r := engine(newMemoryRepo())

	w := call(t, r, "POST", "/api/v1/admin/testers/roster", `{"emails":["nonsense"]}`, nil)
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400", w.Code)
	}
}

func waitForRows(t *testing.T, repo *memoryRepo, want int) {
	t.Helper()

	deadline := time.Now().Add(2 * time.Second)
	for {
		repo.mu.Lock()
		got := len(repo.activity)
		repo.mu.Unlock()

		if got >= want {
			return
		}
		if time.Now().After(deadline) {
			t.Fatalf("only %d activity rows written, want %d", got, want)
		}
		time.Sleep(time.Millisecond)
	}
}

func TestClientFromUserAgent(t *testing.T) {
	cases := map[string]string{
		"okhttp/4.12.0":                       "android",
		"DeenQuest/1.0 CFNetwork/1494 Darwin": "ios",
		"Mozilla/5.0 (Macintosh) Chrome/128":  "web",
		"":                                    "",
		"curl/8.4.0":                          "",
	}
	for agent, want := range cases {
		if got := clientFrom(agent); got != want {
			t.Errorf("clientFrom(%q) = %q, want %q", agent, got, want)
		}
	}
}
