package application

import "context"

type ActivitySource string

const (
	SourceLesson     ActivitySource = "lesson"
	SourceTask       ActivitySource = "task"
	SourceHifz       ActivitySource = "hifz"
	SourceRecitation ActivitySource = "recitation"
	SourceCoach      ActivitySource = "coach"
	// SourceChallenge marks XP paid out *by* the challenge module (quest and
	// duel rewards). Listeners must ignore it or a payout would score the very
	// challenge that produced it.
	SourceChallenge ActivitySource = "challenge"
	SourceOther     ActivitySource = "other"
)

type ActivityListener interface {
	OnActivity(ctx context.Context, userID string, source ActivitySource, xp int)
}

func (s *Service) SetActivityListener(l ActivityListener) {
	s.listener = l
}
