package application

import (
	"context"
	"errors"
	"testing"

	"github.com/chawais/deenquest/backend/internal/analytics/domain"
)

type fakeRepo struct {
	rolled       []string
	backfilled   int
	backfillDays int
	backfillErr  error
	rollUpErr    error
}

func (f *fakeRepo) GetAdminAnalytics(context.Context) (*domain.AdminAnalytics, error) {
	return &domain.AdminAnalytics{}, nil
}

func (f *fakeRepo) RollUpDay(_ context.Context, date string) error {
	if f.rollUpErr != nil {
		return f.rollUpErr
	}
	f.rolled = append(f.rolled, date)
	return nil
}

func (f *fakeRepo) BackfillMissingDays(context.Context) (int, error) {
	f.backfilled++
	return f.backfillDays, f.backfillErr
}

func TestBackfillDelegatesToTheRepository(t *testing.T) {
	repo := &fakeRepo{backfillDays: 3}
	roller := NewRoller(repo)

	if err := roller.Backfill(context.Background()); err != nil {
		t.Fatalf("Backfill: %v", err)
	}
	if repo.backfilled != 1 {
		t.Errorf("backfill ran %d times, want 1", repo.backfilled)
	}
}

// Startup aborts on a failed backfill so that applyRetention is never reached.
// Swallowing this would let the TTL indexes delete uncounted days.
func TestBackfillReturnsTheRepositoryError(t *testing.T) {
	wantErr := errors.New("mongo unreachable")
	roller := NewRoller(&fakeRepo{backfillErr: wantErr})

	err := roller.Backfill(context.Background())
	if !errors.Is(err, wantErr) {
		t.Errorf("error = %v, want %v", err, wantErr)
	}
}

func TestBackfillOnAFreshDatabaseIsNotAnError(t *testing.T) {
	roller := NewRoller(&fakeRepo{backfillDays: 0})

	if err := roller.Backfill(context.Background()); err != nil {
		t.Errorf("Backfill on an empty database = %v, want nil", err)
	}
}
