package application

import "github.com/chawais/deenquest/backend/internal/challenge/domain"

// Overview is everything the Challenges screen renders in one round-trip.
type Overview struct {
	Duel   *DuelView   `json:"duel"`
	Group  *GroupView  `json:"group"`
	Quests []QuestView `json:"quests"`
	Results []DuelView `json:"results"`
}

// Participant is the public face of a user inside a challenge.
type Participant struct {
	UserID      string `json:"user_id"`
	DisplayName string `json:"display_name"`
	Initial     string `json:"initial"`
	Score       int    `json:"score"`
}

// DuelView is a duel rendered from the requesting user's point of view: "you"
// is always the caller, whichever side of the duel they are on.
type DuelView struct {
	ID         string            `json:"id"`
	Status     domain.DuelStatus `json:"status"`
	InviteCode string            `json:"invite_code,omitempty"`
	You        Participant       `json:"you"`
	Rival     *Participant `json:"rival"`
	StartsAt  string       `json:"starts_at"`
	EndsAt    string       `json:"ends_at"`
	EndsInSec int64        `json:"ends_in_sec"`
	Outcome  string `json:"outcome,omitempty"`
	RewardXP int    `json:"reward_xp"`
}

// GroupView is a shared group challenge with its member roster.
type GroupView struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	JoinCode    string        `json:"join_code"`
	Metric      domain.Metric `json:"metric"`
	Target      int           `json:"target"`
	Progress    int           `json:"progress"`
	Percent     int           `json:"percent"`
	Members     []Participant `json:"members"`
	MemberCount int           `json:"member_count"`
	IsOwner     bool          `json:"is_owner"`
	Completed   bool          `json:"completed"`
	EndsAt      string        `json:"ends_at"`
}

// QuestView is one weekly quest tile.
type QuestView struct {
	ID        string        `json:"id"`
	Title     string        `json:"title"`
	Metric    domain.Metric `json:"metric"`
	Target    int           `json:"target"`
	Progress  int           `json:"progress"`
	Percent   int           `json:"percent"`
	RewardXP  int           `json:"reward_xp"`
	Glyph     string        `json:"glyph"`
	Accent    string        `json:"accent"`
	Completed bool          `json:"completed"`
}

// CreateGroupRequest is the payload for starting a shared challenge.
type CreateGroupRequest struct {
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Metric      domain.Metric `json:"metric"`
	Target      int           `json:"target"`
	Days        int           `json:"days"`
}

// JoinRequest carries a shared duel or group code.
type JoinRequest struct {
	Code string `json:"code"`
}
