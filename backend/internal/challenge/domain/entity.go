package domain

import "time"

type Metric string

const (
	MetricXP             Metric = "xp"
	MetricLessons        Metric = "lessons"
	MetricTasks          Metric = "tasks"
	MetricHifz           Metric = "hifz"
	MetricRecitations    Metric = "recitations"
	MetricEncouragements Metric = "encouragements"
)

// Valid reports whether m is a metric this module knows how to score.
func (m Metric) Valid() bool {
	switch m {
	case MetricXP, MetricLessons, MetricTasks, MetricHifz, MetricRecitations, MetricEncouragements:
		return true
	}
	return false
}

type Deltas map[Metric]int

func MetricForSource(source string) (Metric, bool) {
	switch source {
	case "lesson", "coach":
		return MetricLessons, true
	case "task":
		return MetricTasks, true
	case "hifz":
		return MetricHifz, true
	case "recitation":
		return MetricRecitations, true
	}
	return "", false
}

func DeltasFor(source string, xp int) Deltas {
	d := Deltas{}
	if xp > 0 {
		d[MetricXP] = xp
	}
	if m, ok := MetricForSource(source); ok {
		d[m] = 1
	}
	return d
}

/* ─────────────────────────── quests ─────────────────────────── */
type QuestTemplate struct {
	ID       string `bson:"_id" json:"id"`
	Title    string `bson:"title" json:"title"`
	Metric   Metric `bson:"metric" json:"metric"`
	Target   int    `bson:"target" json:"target"`
	RewardXP int    `bson:"reward_xp" json:"reward_xp"`
	Glyph  string `bson:"glyph" json:"glyph"`
	Accent string `bson:"accent" json:"accent"` // gold | pink | teal | violet | blue
}

type UserQuest struct {
	ID         string    `bson:"_id" json:"id"`
	UserID     string    `bson:"user_id" json:"user_id"`
	TemplateID string    `bson:"template_id" json:"template_id"`
	WeekKey    string    `bson:"week_key" json:"week_key"`
	Title      string    `bson:"title" json:"title"`
	Metric     Metric    `bson:"metric" json:"metric"`
	Target     int       `bson:"target" json:"target"`
	Progress   int       `bson:"progress" json:"progress"`
	RewardXP   int       `bson:"reward_xp" json:"reward_xp"`
	Glyph      string    `bson:"glyph" json:"glyph"`
	Accent     string    `bson:"accent" json:"accent"`
	Completed  bool      `bson:"completed" json:"completed"`
	RewardPaid bool      `bson:"reward_paid" json:"reward_paid"`
	CreatedAt  time.Time `bson:"created_at" json:"created_at"`
}

// NewUserQuest instantiates a template for a user's week.
func NewUserQuest(id, userID, weekKey string, t QuestTemplate, now time.Time) UserQuest {
	return UserQuest{
		ID:         id,
		UserID:     userID,
		TemplateID: t.ID,
		WeekKey:    weekKey,
		Title:      t.Title,
		Metric:     t.Metric,
		Target:     t.Target,
		RewardXP:   t.RewardXP,
		Glyph:      t.Glyph,
		Accent:     t.Accent,
		CreatedAt:  now,
	}
}

/* ─────────────────────────── duels ─────────────────────────── */

type DuelStatus string

const (
	DuelPending DuelStatus = "pending"
	DuelActive  DuelStatus = "active"
	DuelCompleted DuelStatus = "completed"
	DuelCancelled DuelStatus = "cancelled"
)

const DuelWinnerXP = 100

type Duel struct {
	ID              string     `bson:"_id" json:"id"`
	InviteCode      string     `bson:"invite_code" json:"invite_code"`
	ChallengerID    string     `bson:"challenger_id" json:"challenger_id"`
	OpponentID      string     `bson:"opponent_id,omitempty" json:"opponent_id,omitempty"`
	Status          DuelStatus `bson:"status" json:"status"`
	ChallengerScore int        `bson:"challenger_score" json:"challenger_score"`
	OpponentScore   int        `bson:"opponent_score" json:"opponent_score"`
	StartsAt        time.Time  `bson:"starts_at" json:"starts_at"`
	EndsAt          time.Time  `bson:"ends_at" json:"ends_at"`
	// WinnerID is empty for an unsettled duel and for a draw.
	WinnerID  string    `bson:"winner_id,omitempty" json:"winner_id,omitempty"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

func (d *Duel) Involves(userID string) bool {
	return userID != "" && (d.ChallengerID == userID || d.OpponentID == userID)
}

func (d *Duel) Rival(userID string) string {
	switch userID {
	case d.ChallengerID:
		return d.OpponentID
	case d.OpponentID:
		return d.ChallengerID
	}
	return ""
}

func (d *Duel) Score(userID string) int {
	switch userID {
	case d.ChallengerID:
		return d.ChallengerScore
	case d.OpponentID:
		return d.OpponentScore
	}
	return 0
}

func (d *Duel) AddScore(userID string, amount int, now time.Time) bool {
	if amount <= 0 || d.Status != DuelActive || now.Before(d.StartsAt) || !now.Before(d.EndsAt) {
		return false
	}
	switch userID {
	case d.ChallengerID:
		d.ChallengerScore += amount
	case d.OpponentID:
		d.OpponentScore += amount
	default:
		return false
	}
	d.UpdatedAt = now
	return true
}

// Settle closes an active duel whose window has elapsed and decides the winner.
// It reports whether the duel changed, so callers only persist real transitions.
func (d *Duel) Settle(now time.Time) bool {
	if d.Status != DuelActive || now.Before(d.EndsAt) {
		return false
	}
	d.Status = DuelCompleted
	switch {
	case d.ChallengerScore > d.OpponentScore:
		d.WinnerID = d.ChallengerID
	case d.OpponentScore > d.ChallengerScore:
		d.WinnerID = d.OpponentID
	default:
		d.WinnerID = "" // draw
	}
	d.UpdatedAt = now
	return true
}

func (d *Duel) Expired(now time.Time) bool {
	return d.Status == DuelPending && !now.Before(d.EndsAt)
}

/* ─────────────────────── encouragements ─────────────────────── */
type Encouragement struct {
	ID        string    `bson:"_id" json:"id"`
	UserID    string    `bson:"user_id" json:"user_id"`
	TargetID  string    `bson:"target_id" json:"target_id"`
	Date      string    `bson:"date" json:"date"` // YYYY-MM-DD, UTC
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
}

func DateKey(t time.Time) string {
	return t.UTC().Format("2006-01-02")
}

/* ─────────────────── group (family/khatm) challenges ─────────────────── */
type GroupMember struct {
	UserID       string    `bson:"user_id" json:"user_id"`
	Contribution int       `bson:"contribution" json:"contribution"`
	JoinedAt     time.Time `bson:"joined_at" json:"joined_at"`
}

const MaxGroupMembers = 12

type GroupChallenge struct {
	ID          string        `bson:"_id" json:"id"`
	Name        string        `bson:"name" json:"name"`
	Description string        `bson:"description" json:"description"`
	OwnerID     string        `bson:"owner_id" json:"owner_id"`
	JoinCode    string        `bson:"join_code" json:"join_code"`
	Metric      Metric        `bson:"metric" json:"metric"`
	Target      int           `bson:"target" json:"target"`
	Progress    int           `bson:"progress" json:"progress"`
	Members     []GroupMember `bson:"members" json:"members"`
	EndsAt      time.Time     `bson:"ends_at" json:"ends_at"`
	Completed   bool          `bson:"completed" json:"completed"`
	CompletedAt time.Time     `bson:"completed_at,omitempty" json:"completed_at,omitempty"`
	CreatedAt   time.Time     `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time     `bson:"updated_at" json:"updated_at"`
}

// HasMember reports whether userID has already joined.
func (g *GroupChallenge) HasMember(userID string) bool {
	for i := range g.Members {
		if g.Members[i].UserID == userID {
			return true
		}
	}
	return false
}

func (g *GroupChallenge) AddMember(userID string, now time.Time) bool {
	if g.HasMember(userID) || len(g.Members) >= MaxGroupMembers {
		return false
	}
	g.Members = append(g.Members, GroupMember{UserID: userID, JoinedAt: now})
	g.UpdatedAt = now
	return true
}

func (g *GroupChallenge) Contribute(userID string, amount int, now time.Time) bool {
	if amount <= 0 || g.Completed || !now.Before(g.EndsAt) {
		return false
	}
	idx := -1
	for i := range g.Members {
		if g.Members[i].UserID == userID {
			idx = i
			break
		}
	}
	if idx < 0 {
		return false
	}
	g.Members[idx].Contribution += amount
	g.Progress += amount
	if g.Progress >= g.Target {
		g.Progress = g.Target
		g.Completed = true
		g.CompletedAt = now
	}
	g.UpdatedAt = now
	return true
}

func (g *GroupChallenge) PercentComplete() int {
	if g.Target <= 0 {
		return 0
	}
	pct := g.Progress * 100 / g.Target
	if pct > 100 {
		return 100
	}
	return pct
}
