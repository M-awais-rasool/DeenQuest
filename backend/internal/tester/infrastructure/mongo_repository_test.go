package infrastructure

import (
	"context"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/chawais/deenquest/backend/internal/tester/domain"
)

// These run against a real MongoDB, because what they check — upsert operator
// conflicts, $nin with an empty list, the projection the report decodes — is
// exactly what a fake repository cannot get wrong.
//
//	docker run --rm -d -p 27018:27017 mongo:7
//	MONGO_TEST_URI=mongodb://localhost:27018 go test ./internal/tester/...
func testDB(t *testing.T) *mongo.Database {
	t.Helper()

	uri := os.Getenv("MONGO_TEST_URI")
	if uri == "" {
		t.Skip("set MONGO_TEST_URI to run the tester repository against MongoDB")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if err := client.Ping(ctx, nil); err != nil {
		t.Fatalf("ping: %v", err)
	}

	db := client.Database("deenquest_tester_test")
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		_ = db.Drop(ctx)
		_ = client.Disconnect(ctx)
	})
	return db
}

func TestRecordActivityAccumulatesOneRowPerDay(t *testing.T) {
	db := testDB(t)
	repo, err := NewMongoRepository(db)
	if err != nil {
		t.Fatalf("NewMongoRepository: %v", err)
	}
	ctx := context.Background()

	first := time.Date(2026, 9, 12, 8, 0, 0, 0, time.UTC)
	later := first.Add(3 * time.Hour)

	for _, p := range []domain.Ping{
		{UserID: "u1", Date: "2026-09-12", SeenAt: first, Requests: 1, Client: "android"},
		{UserID: "u1", Date: "2026-09-12", SeenAt: later, Requests: 9},
		{UserID: "u1", Date: "2026-09-13", SeenAt: later.Add(20 * time.Hour), Requests: 2},
	} {
		if err := repo.RecordActivity(ctx, p); err != nil {
			t.Fatalf("RecordActivity: %v", err)
		}
	}

	days, err := repo.Activity(ctx, "2026-09-06", "2026-09-12")
	if err != nil {
		t.Fatalf("Activity: %v", err)
	}
	if len(days) != 1 {
		t.Fatalf("got %d rows in the window, want 1 (the 13th is outside it)", len(days))
	}

	day := days[0]
	if day.Requests != 10 {
		t.Errorf("requests = %d, want 10", day.Requests)
	}
	if !day.FirstSeen.Equal(first) {
		t.Errorf("first_seen = %v, want the first ping's time %v", day.FirstSeen, first)
	}
	if !day.LastSeen.Equal(later) {
		t.Errorf("last_seen = %v, want %v", day.LastSeen, later)
	}
	// A later ping with no user agent must not erase the platform already known.
	if day.Client != "android" {
		t.Errorf("client = %q, want android", day.Client)
	}
}

func TestSaveRosterReplacesTheWholeList(t *testing.T) {
	db := testDB(t)
	repo, err := NewMongoRepository(db)
	if err != nil {
		t.Fatalf("NewMongoRepository: %v", err)
	}
	ctx := context.Background()
	now := time.Now().UTC().Truncate(time.Millisecond)

	entries := []domain.RosterEntry{
		{Email: "a@example.com", AddedAt: now},
		{Email: "b@example.com", AddedAt: now},
	}
	if err := repo.SaveRoster(ctx, entries, false); err != nil {
		t.Fatalf("SaveRoster: %v", err)
	}

	// Re-posting a shorter list with replace drops whoever is missing from it.
	if err := repo.SaveRoster(ctx, []domain.RosterEntry{{Email: "b@example.com", AddedAt: now.Add(time.Hour)}}, true); err != nil {
		t.Fatalf("SaveRoster replace: %v", err)
	}

	roster, err := repo.Roster(ctx)
	if err != nil {
		t.Fatalf("Roster: %v", err)
	}
	if len(roster) != 1 || roster[0].Email != "b@example.com" {
		t.Fatalf("roster = %+v", roster)
	}
	// added_at is the day they were first invited, not the last paste.
	if !roster[0].AddedAt.Equal(now) {
		t.Errorf("added_at = %v, want the original %v", roster[0].AddedAt, now)
	}

	if err := repo.DeleteRoster(ctx, "b@example.com"); err != nil {
		t.Fatalf("DeleteRoster: %v", err)
	}
	if roster, _ := repo.Roster(ctx); len(roster) != 0 {
		t.Errorf("roster after delete = %+v", roster)
	}
}

func TestAccountsMatchesEitherEmailOrID(t *testing.T) {
	db := testDB(t)
	repo, err := NewMongoRepository(db)
	if err != nil {
		t.Fatalf("NewMongoRepository: %v", err)
	}
	ctx := context.Background()
	joined := time.Date(2026, 9, 1, 12, 0, 0, 0, time.UTC)

	_, err = db.Collection("users").InsertMany(ctx, []interface{}{
		bson.M{"_id": "u1", "email": "invited@example.com", "display_name": "Invited", "created_at": joined, "role": "USER"},
		bson.M{"_id": "u2", "email": "walkin@example.com", "display_name": "Walk-in", "created_at": joined, "role": "USER"},
		bson.M{"_id": "u3", "email": "nobody@example.com", "display_name": "Nobody", "created_at": joined, "role": "USER"},
	})
	if err != nil {
		t.Fatalf("seed users: %v", err)
	}

	accounts, err := repo.Accounts(ctx, []string{"invited@example.com"}, []string{"u2"})
	if err != nil {
		t.Fatalf("Accounts: %v", err)
	}
	if len(accounts) != 2 {
		t.Fatalf("got %d accounts, want 2: %+v", len(accounts), accounts)
	}
	for _, a := range accounts {
		if a.ID == "" || a.Email == "" || a.DisplayName == "" || a.CreatedAt.IsZero() {
			t.Errorf("projection dropped a field the report needs: %+v", a)
		}
	}
}

func TestAccountsWithNothingToLookUp(t *testing.T) {
	db := testDB(t)
	repo, err := NewMongoRepository(db)
	if err != nil {
		t.Fatalf("NewMongoRepository: %v", err)
	}

	accounts, err := repo.Accounts(context.Background(), nil, nil)
	if err != nil || len(accounts) != 0 {
		t.Errorf("accounts = %+v, err = %v", accounts, err)
	}
}
