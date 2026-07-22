package domain

import "context"

type Repository interface {
	SaveRecitationAttempt(ctx context.Context, attempt *RecitationAttempt) error
	CountUserRecitationAttempts(ctx context.Context, userID string, levelID, lessonIndex int) (int, error)
}
