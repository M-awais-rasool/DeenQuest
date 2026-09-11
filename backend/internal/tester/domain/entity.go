// Package domain models who is trying the app and on which days.
//
// It exists for the closed-testing phase on Google Play: the store requires a
// group of testers to keep the app installed and opened, and the only way to
// know who has actually opened it — without shipping a new build — is to watch
// the requests the installed build already makes.
package domain

import (
	"context"
	"time"
)

// Ping is one throttled report that a user was using the app. Requests carries
// every call made since the previous ping, so the counter stays honest even
// though only one write per user per window reaches MongoDB.
type Ping struct {
	UserID   string
	Date     string // YYYY-MM-DD in the reporting timezone
	SeenAt   time.Time
	Requests int
	Client   string // "android", "ios", "web" or "" when the agent is unknown
}

// ActivityDay is the stored row: one per user per day.
type ActivityDay struct {
	ID        string    `bson:"_id"`
	UserID    string    `bson:"user_id"`
	Date      string    `bson:"date"`
	FirstSeen time.Time `bson:"first_seen"`
	LastSeen  time.Time `bson:"last_seen"`
	Requests  int       `bson:"requests"`
	Client    string    `bson:"client,omitempty"`
	CreatedAt time.Time `bson:"created_at"`
}

// RosterEntry is a tester the Play Console lists. It is kept separately from
// the users collection because a tester who never signs in has no account —
// and those are exactly the people worth chasing.
type RosterEntry struct {
	Email   string    `bson:"_id" json:"email"`
	Name    string    `bson:"name,omitempty" json:"name,omitempty"`
	Note    string    `bson:"note,omitempty" json:"note,omitempty"`
	AddedAt time.Time `bson:"added_at" json:"added_at"`
}

// Account is the slice of a user record the report needs.
type Account struct {
	ID          string    `bson:"_id"`
	Email       string    `bson:"email"`
	DisplayName string    `bson:"display_name"`
	CreatedAt   time.Time `bson:"created_at"`
}

// DayCell is one square in a tester's row.
type DayCell struct {
	Date      string     `json:"date"`
	Active    bool       `json:"active"`
	Requests  int        `json:"requests"`
	FirstSeen *time.Time `json:"first_seen,omitempty"`
	LastSeen  *time.Time `json:"last_seen,omitempty"`
}

// TesterRow is one person in the report.
type TesterRow struct {
	Email         string     `json:"email"`
	Name          string     `json:"name"`
	UserID        string     `json:"user_id,omitempty"`
	InRoster      bool       `json:"in_roster"`
	HasAccount    bool       `json:"has_account"`
	Note          string     `json:"note,omitempty"`
	Client        string     `json:"client,omitempty"`
	JoinedAt      *time.Time `json:"joined_at,omitempty"`
	FirstSeen     *time.Time `json:"first_seen,omitempty"`
	LastSeen      *time.Time `json:"last_seen,omitempty"`
	ActiveToday   bool       `json:"active_today"`
	DaysSinceSeen int        `json:"days_since_seen"` // -1 when never seen
	DaysActive    int        `json:"days_active"`
	CurrentStreak int        `json:"current_streak"`
	TotalRequests int        `json:"total_requests"`
	Days          []DayCell  `json:"days"`
}

// Summary is the headline count for each state a tester can be in.
type Summary struct {
	Roster        int `json:"roster"`
	Signed        int `json:"signed_in"`      // roster members with an account
	NeverOpened   int `json:"never_opened"`   // roster members with no account at all
	ActiveToday   int `json:"active_today"`   // anyone in the report, roster or not
	MissingToday  int `json:"missing_today"`  // roster members who have not opened it today
	PerfectWindow int `json:"perfect_window"` // roster members active on every day shown
}

// Report is the whole page: the days across the top, a row per tester.
type Report struct {
	Timezone string      `json:"timezone"`
	Today    string      `json:"today"`
	Days     []string    `json:"days"` // oldest first
	Summary  Summary     `json:"summary"`
	Testers  []TesterRow `json:"testers"`
}

type Repository interface {
	RecordActivity(ctx context.Context, p Ping) error
	Activity(ctx context.Context, from, to string) ([]ActivityDay, error)
	Roster(ctx context.Context) ([]RosterEntry, error)
	SaveRoster(ctx context.Context, entries []RosterEntry, replace bool) error
	DeleteRoster(ctx context.Context, email string) error
	Accounts(ctx context.Context, emails, userIDs []string) ([]Account, error)
}
