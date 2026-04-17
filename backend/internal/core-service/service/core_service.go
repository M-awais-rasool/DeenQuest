package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/talent-flow/backend/internal/core-service/model"
	"github.com/chawais/talent-flow/backend/internal/core-service/repository"
	"github.com/chawais/talent-flow/backend/pkg/queue"
)

type EventPublisher interface {
	Publish(ctx context.Context, topic string, event queue.Event) error
}

type CoreService struct {
	repo      repository.CoreRepository
	publisher EventPublisher
}

func NewCoreService(repo repository.CoreRepository, publisher EventPublisher) *CoreService {
	return &CoreService{repo: repo, publisher: publisher}
}

// ProgressResponse is the response type for the user's progress summary.
type ProgressResponse struct {
	XP                int    `json:"xp"`
	Level             int    `json:"level"`
	BarakahScore      int    `json:"barakah_score"`
	CurrentStreak     int    `json:"current_streak"`
	LongestStreak     int    `json:"longest_streak"`
	WeeklyCompletions []bool `json:"weekly_completions"` // index 0 = 6 days ago, index 6 = today
}

// GetUserProgress returns XP, streak, and the last 7 days completion status.
func (s *CoreService) GetUserProgress(ctx context.Context, userID string) (*ProgressResponse, error) {
	progress, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		return nil, err
	}
	if progress == nil {
		progress = &model.Progress{Level: 1}
	}

	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}
	if streak == nil {
		streak = &model.Streak{}
	}

	now := time.Now().UTC()
	dates := make([]string, 7)
	for i := 0; i < 7; i++ {
		dates[i] = now.AddDate(0, 0, -(6 - i)).Format("2006-01-02")
	}

	completedDates, err := s.repo.GetCompletedDates(ctx, userID, dates)
	if err != nil {
		return nil, err
	}

	weekly := make([]bool, 7)
	for i, d := range dates {
		weekly[i] = completedDates[d]
	}

	return &ProgressResponse{
		XP:                progress.TotalXP,
		Level:             progress.Level,
		BarakahScore:      progress.BarakahScore,
		CurrentStreak:     streak.CurrentStreak,
		LongestStreak:     streak.LongestStreak,
		WeeklyCompletions: weekly,
	}, nil
}

// SeedDailyTasks inserts/updates the master task templates into the database.
func (s *CoreService) SeedDailyTasks(ctx context.Context) error {
	return s.repo.SeedDailyTasks(ctx, model.SeedTasks())
}

// GetDailyTasks returns 5 tasks for a user on a given date.
// If no assignment exists for today, it picks 1 fixed (Fajr) + 4 random tasks
// and persists the assignment so the user gets the same set all day.
func (s *CoreService) GetDailyTasks(ctx context.Context, userID string) ([]model.DailyTaskWithStatus, error) {
	today := time.Now().UTC().Format("2006-01-02")

	// Check existing assignments for today.
	assignments, err := s.repo.GetUserDailyTasks(ctx, userID, today)
	if err != nil {
		return nil, fmt.Errorf("get user daily tasks: %w", err)
	}

	// If no assignments exist, generate them.
	if len(assignments) == 0 {
		allTasks, err := s.repo.ListAllDailyTasks(ctx)
		if err != nil {
			return nil, fmt.Errorf("list all daily tasks: %w", err)
		}

		var fixed []model.DailyTask
		var pool []model.DailyTask
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

		selected := make([]model.DailyTask, 0, 5)
		selected = append(selected, fixed...)
		remaining := 5 - len(selected)
		if remaining > len(pool) {
			remaining = len(pool)
		}
		selected = append(selected, pool[:remaining]...)

		now := time.Now().UTC()
		assignments = make([]model.UserDailyTask, 0, len(selected))
		for _, t := range selected {
			assignments = append(assignments, model.UserDailyTask{
				ID:        uuid.NewString(),
				UserID:    userID,
				TaskID:    t.ID,
				Date:      today,
				Completed: false,
				CreatedAt: now,
			})
		}

		if err := s.repo.UpsertUserDailyTasks(ctx, assignments); err != nil {
			return nil, fmt.Errorf("upsert user daily tasks: %w", err)
		}
	}

	// Build the response by joining assignments with task templates.
	completionMap := make(map[string]model.UserDailyTask, len(assignments))
	for _, a := range assignments {
		completionMap[a.TaskID] = a
	}

	results := make([]model.DailyTaskWithStatus, 0, len(assignments))
	for _, a := range assignments {
		task, err := s.repo.GetDailyTaskByID(ctx, a.TaskID)
		if err != nil {
			return nil, err
		}
		if task == nil {
			continue
		}
		results = append(results, model.DailyTaskWithStatus{
			DailyTask:   *task,
			Completed:   a.Completed,
			CompletedAt: a.CompletedAt,
		})
	}

	return results, nil
}

// CompleteDailyTask marks a user's daily task as completed and awards XP.
func (s *CoreService) CompleteDailyTask(ctx context.Context, userID, taskID string) error {
	today := time.Now().UTC().Format("2006-01-02")

	if err := s.repo.CompleteUserDailyTask(ctx, userID, taskID, today); err != nil {
		if errors.Is(err, repository.ErrAlreadyCompleted) {
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

	if err := s.bumpProgress(ctx, userID, task.RewardXP, 0); err != nil {
		return err
	}
	if err := s.bumpStreak(ctx, userID); err != nil {
		return err
	}

	if s.publisher != nil {
		_ = s.publisher.Publish(ctx, "habit.completed", queue.Event{
			Type: "daily_task.completed",
			Payload: map[string]interface{}{
				"user_id": userID,
				"task_id": taskID,
				"xp":      task.RewardXP,
			},
		})
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

func (s *CoreService) bumpProgress(ctx context.Context, userID string, xpDelta int, barakahDelta int) error {
	p, err := s.repo.GetProgress(ctx, userID)
	if err != nil {
		return err
	}
	if p == nil {
		p = &model.Progress{ID: uuid.NewString(), UserID: userID, Level: 1}
	}
	p.TotalXP += xpDelta
	p.BarakahScore += barakahDelta
	p.Level = (p.TotalXP / 100) + 1
	p.UpdatedAt = time.Now().UTC()
	return s.repo.UpsertProgress(ctx, p)
}

func (s *CoreService) bumpStreak(ctx context.Context, userID string) error {
	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	if streak == nil {
		streak = &model.Streak{ID: uuid.NewString(), UserID: userID, CurrentStreak: 1, LongestStreak: 1, LastCompletedAt: now, UpdatedAt: now}
	} else {
		last := streak.LastCompletedAt.UTC()
		today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
		lastDay := time.Date(last.Year(), last.Month(), last.Day(), 0, 0, 0, 0, time.UTC)
		days := int(today.Sub(lastDay).Hours() / 24)
		if days == 1 {
			streak.CurrentStreak++
		} else if days > 1 {
			streak.CurrentStreak = 1
		}
		if streak.CurrentStreak > streak.LongestStreak {
			streak.LongestStreak = streak.CurrentStreak
		}
		streak.LastCompletedAt = now
		streak.UpdatedAt = now
	}
	if s.publisher != nil {
		_ = s.publisher.Publish(ctx, "streak.updated", queue.Event{Type: "streak.updated", Payload: streak})
	}
	return s.repo.UpsertStreak(ctx, streak)
}

// ─── Level Journey Methods ───

// SeedLevels inserts/updates the 20 master level templates.
func (s *CoreService) SeedLevels(ctx context.Context) error {
	return s.repo.SeedLevels(ctx, model.SeedLevels())
}

// GetLevels returns all levels annotated with the user's progress status.
func (s *CoreService) GetLevels(ctx context.Context, userID string) ([]model.LevelWithStatus, error) {
	levels, err := s.repo.ListAllLevels(ctx)
	if err != nil {
		return nil, fmt.Errorf("list levels: %w", err)
	}

	userLevels, err := s.repo.GetUserLevels(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user levels: %w", err)
	}

	ulMap := make(map[int]model.UserLevel, len(userLevels))
	for _, ul := range userLevels {
		ulMap[ul.LevelID] = ul
	}

	// Determine the highest completed level to figure out which levels are available.
	highestCompleted := 0
	for _, ul := range userLevels {
		if ul.Completed && ul.LevelID > highestCompleted {
			highestCompleted = ul.LevelID
		}
	}

	results := make([]model.LevelWithStatus, 0, len(levels))
	for _, l := range levels {
		lws := model.LevelWithStatus{Level: l}
		if ul, ok := ulMap[l.ID]; ok {
			lws.Stars = ul.Stars
			lws.LessonsComplete = ul.LessonsComplete
			if ul.Completed {
				lws.Status = "completed"
			} else {
				lws.Status = "in_progress"
			}
		} else if l.ID <= highestCompleted+1 {
			lws.Status = "available"
		} else {
			lws.Status = "locked"
		}
		results = append(results, lws)
	}

	return results, nil
}

// GetLevelDetail returns a single level with the user's progress.
func (s *CoreService) GetLevelDetail(ctx context.Context, userID string, levelID int) (*model.LevelWithStatus, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, errors.New("level not found")
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}

	lws := &model.LevelWithStatus{Level: *level, Status: "available"}
	if ul != nil {
		lws.Stars = ul.Stars
		lws.LessonsComplete = ul.LessonsComplete
		if ul.Completed {
			lws.Status = "completed"
		} else {
			lws.Status = "in_progress"
		}
	}
	return lws, nil
}

// CompleteLessonInLevel marks a lesson as complete within a level.
func (s *CoreService) CompleteLessonInLevel(ctx context.Context, userID string, levelID, lessonIndex int) (*model.UserLevel, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, errors.New("level not found")
	}
	if lessonIndex < 0 || lessonIndex >= len(level.Lessons) {
		return nil, errors.New("invalid lesson index")
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul == nil {
		ul = &model.UserLevel{
			ID:        uuid.NewString(),
			UserID:    userID,
			LevelID:   levelID,
			CreatedAt: time.Now().UTC(),
		}
	}

	newCount := lessonIndex + 1
	if newCount > ul.LessonsComplete {
		ul.LessonsComplete = newCount
	}

	if err := s.repo.UpsertUserLevel(ctx, ul); err != nil {
		return nil, err
	}
	return ul, nil
}

// CompleteLevel marks a level as fully completed and awards XP + rewards.
func (s *CoreService) CompleteLevel(ctx context.Context, userID string, levelID int, stars int) (*model.LevelCompletionResult, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, errors.New("level not found")
	}

	if stars < 1 {
		stars = 1
	}
	if stars > 3 {
		stars = 3
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul != nil && ul.Completed {
		// Already completed — return existing result, no extra XP.
		return &model.LevelCompletionResult{
			XPEarned:     0,
			Stars:        ul.Stars,
			UnlockReward: level.UnlockReward,
			TreasureOpen: false,
			NextLevelID:  levelID + 1,
		}, nil
	}

	if ul == nil {
		ul = &model.UserLevel{
			ID:        uuid.NewString(),
			UserID:    userID,
			LevelID:   levelID,
			CreatedAt: time.Now().UTC(),
		}
	}

	ul.Stars = stars
	ul.LessonsComplete = len(level.Lessons)
	ul.MiniGameDone = true
	ul.Completed = true
	ul.CompletedAt = time.Now().UTC()

	if err := s.repo.UpsertUserLevel(ctx, ul); err != nil {
		return nil, err
	}

	// Award XP scaled by stars.
	xp := level.XPReward * stars / 2
	if err := s.bumpProgress(ctx, userID, xp, stars*5); err != nil {
		return nil, err
	}
	if err := s.bumpStreak(ctx, userID); err != nil {
		return nil, err
	}

	if s.publisher != nil {
		_ = s.publisher.Publish(ctx, "level.completed", queue.Event{
			Type: "level.completed",
			Payload: map[string]interface{}{
				"user_id":  userID,
				"level_id": levelID,
				"stars":    stars,
				"xp":       xp,
			},
		})
	}

	return &model.LevelCompletionResult{
		XPEarned:     xp,
		Stars:        stars,
		UnlockReward: level.UnlockReward,
		TreasureOpen: levelID%5 == 0,
		NextLevelID:  levelID + 1,
	}, nil
}
