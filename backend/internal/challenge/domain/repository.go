package domain

import (
	"context"
	"errors"
)

var (
	ErrDuelNotFound           = errors.New("challenge: duel not found")
	ErrGroupNotFound          = errors.New("challenge: group challenge not found")
	ErrCodeTaken              = errors.New("challenge: invite code already in use")
	ErrAlreadyJoined          = errors.New("challenge: already a participant")
	ErrGroupFull              = errors.New("challenge: group challenge is full")
	ErrDuelUnavailable        = errors.New("challenge: duel is no longer open to join")
	ErrSelfJoin               = errors.New("challenge: cannot join your own challenge")
	ErrActiveDuel             = errors.New("challenge: you already have an open duel")
	ErrDuplicateEncouragement = errors.New("challenge: already encouraged this person today")
	ErrNotAParticipant        = errors.New("challenge: that person is not in one of your challenges")
)

type Repository interface {
	// quest catalog
	SeedQuestTemplates(ctx context.Context, templates []QuestTemplate) error
	ListQuestTemplates(ctx context.Context) ([]QuestTemplate, error)

	// per-user weekly quests
	ListUserQuests(ctx context.Context, userID, weekKey string) ([]UserQuest, error)
	InsertUserQuests(ctx context.Context, quests []UserQuest) error
	SaveUserQuest(ctx context.Context, quest *UserQuest) error
	// SaveUserQuests persists several quests in one round trip. Scoring an
	// activity typically advances more than one quest at a time, and doing that
	// as N separate writes was the bulk of the database work behind a single
	// lesson completion.
	SaveUserQuests(ctx context.Context, quests []*UserQuest) error

	// duels
	CreateDuel(ctx context.Context, duel *Duel) error
	SaveDuel(ctx context.Context, duel *Duel) error
	GetDuelByCode(ctx context.Context, code string) (*Duel, error)
	// ListOpenDuelsForUser returns the user's pending and active duels, newest first.
	ListOpenDuelsForUser(ctx context.Context, userID string) ([]Duel, error)
	// ListRecentDuelsForUser returns the user's settled duels, newest first.
	ListRecentDuelsForUser(ctx context.Context, userID string, limit int) ([]Duel, error)
	RecordEncouragement(ctx context.Context, e Encouragement) error

	// group challenges
	CreateGroup(ctx context.Context, group *GroupChallenge) error
	SaveGroup(ctx context.Context, group *GroupChallenge) error
	GetGroupByCode(ctx context.Context, code string) (*GroupChallenge, error)
	// ListGroupsForUser returns every group the user is a member of, newest first.
	ListGroupsForUser(ctx context.Context, userID string) ([]GroupChallenge, error)
}
