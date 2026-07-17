package dailytask

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"

	"github.com/chawais/deenquest/backend/internal/progress"
)

// Service manages the daily-task loop. Completing a task awards XP and bumps
// the streak, so it depends on the progress service.
type Service struct {
	repo     Repository
	progress *progress.Service
}

func NewService(repo Repository, progressSvc *progress.Service) *Service {
	return &Service{repo: repo, progress: progressSvc}
}

// Seed inserts/updates the master task templates into the database.
func (s *Service) Seed(ctx context.Context) error {
	return s.repo.SeedDailyTasks(ctx, SeedTasks())
}

// GetDailyTasks returns 5 tasks for a user on a given date.
// If no assignment exists for today, it picks 1 fixed (Fajr) + 4 random tasks
// and persists the assignment so the user gets the same set all day.
func (s *Service) GetDailyTasks(ctx context.Context, userID string) ([]DailyTaskWithStatus, error) {
	today := time.Now().UTC().Format("2006-01-02")

	var (
		assignments []UserDailyTask
		allTasks    []DailyTask
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { assignments, err = s.repo.GetUserDailyTasks(gctx, userID, today); return })
	g.Go(func() (err error) { allTasks, err = s.repo.ListAllDailyTasks(gctx); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load daily tasks: %w", err)
	}

	taskByID := make(map[string]DailyTask, len(allTasks))
	for _, t := range allTasks {
		taskByID[t.ID] = t
	}

	// If no assignments exist, generate them.
	if len(assignments) == 0 {
		var fixed []DailyTask
		var pool []DailyTask
		for _, t := range allTasks {
			if t.IsFixed {
				fixed = append(fixed, t)
			} else {
				pool = append(pool, t)
			}
		}

		// Deterministic-ish shuffle seeded with date+userID for variety.
		rng := rand.New(rand.NewSource(int64(hashString(userID + today))))
		rng.Shuffle(len(pool), func(i, j int) { pool[i], pool[j] = pool[j], pool[i] })

		selected := make([]DailyTask, 0, 5)
		selected = append(selected, fixed...)
		remaining := 5 - len(selected)
		if remaining > len(pool) {
			remaining = len(pool)
		}
		selected = append(selected, pool[:remaining]...)

		now := time.Now().UTC()
		assignments = make([]UserDailyTask, 0, len(selected))
		for _, t := range selected {
			assignments = append(assignments, UserDailyTask{
				ID:        uuid.NewString(),
				UserID:    userID,
				TaskID:    t.ID,
				Date:      today,
				Completed: false,
				CreatedAt: now,
			})
		}

		if err := s.repo.UpsertUserDailyTask(ctx, assignments); err != nil {
			return nil, fmt.Errorf("upsert user daily tasks: %w", err)
		}
	}

	// Build the response by joining assignments with the task-template map.
	results := make([]DailyTaskWithStatus, 0, len(assignments))
	for _, a := range assignments {
		task, ok := taskByID[a.TaskID]
		if !ok {
			continue
		}
		results = append(results, DailyTaskWithStatus{
			DailyTask:   task,
			Completed:   a.Completed,
			CompletedAt: a.CompletedAt,
		})
	}

	return results, nil
}

// CompleteDailyTask marks a user's daily task as completed and awards XP.
func (s *Service) CompleteDailyTask(ctx context.Context, userID, taskID string) error {
	today := time.Now().UTC().Format("2006-01-02")

	if err := s.repo.CompleteUserDailyTask(ctx, userID, taskID, today); err != nil {
		if errors.Is(err, ErrAlreadyCompleted) {
			return nil
		}
		return fmt.Errorf("complete daily task: %w", err)
	}

	task, err := s.repo.GetDailyTaskByID(ctx, taskID)
	if err != nil {
		return err
	}
	if task == nil {
		return errors.New("task template not found")
	}

	if _, err := s.progress.Award(ctx, userID, task.RewardXP, 0); err != nil {
		return err
	}
	if _, err := s.progress.BumpStreak(ctx, userID); err != nil {
		return err
	}

	return nil
}

// hashString produces a simple hash for seeding the random shuffle.
func hashString(s string) uint32 {
	var h uint32
	for _, c := range s {
		h = h*31 + uint32(c)
	}
	return h
}
