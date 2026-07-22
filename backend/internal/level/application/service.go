package application

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"

	"github.com/chawais/deenquest/backend/internal/level/domain"
	progressapp "github.com/chawais/deenquest/backend/internal/progress/application"
	progressdomain "github.com/chawais/deenquest/backend/internal/progress/domain"
	rewardapp "github.com/chawais/deenquest/backend/internal/reward/application"
	rewarddomain "github.com/chawais/deenquest/backend/internal/reward/domain"
)

var (
	ErrLevelNotFound      = errors.New("level not found")
	ErrInvalidLessonIndex = errors.New("invalid lesson index")
)

type Service struct {
	repo     domain.Repository
	progress *progressapp.Service
	reward   *rewardapp.Service
}

func NewService(repo domain.Repository, progressSvc *progressapp.Service, rewardSvc *rewardapp.Service) *Service {
	return &Service{repo: repo, progress: progressSvc, reward: rewardSvc}
}

func (s *Service) Seed(ctx context.Context) error {
	stored, err := s.repo.LevelSeedVersion(ctx)
	if err != nil {
		return fmt.Errorf("read level seed version: %w", err)
	}
	if stored < domain.SeedDataVersion {
		if err := s.repo.ReplaceLevels(ctx, domain.SeedLevels(), domain.SeedDataVersion); err != nil {
			return fmt.Errorf("migrate curriculum v%d→v%d: %w", stored, domain.SeedDataVersion, err)
		}
		return nil
	}
	return s.repo.SeedLevels(ctx, domain.SeedLevels())
}

func (s *Service) LevelByID(ctx context.Context, levelID int) (*domain.Level, error) {
	return s.repo.GetLevelByID(ctx, levelID)
}

func (s *Service) CompletedLevelCount(ctx context.Context, userID string) (int, error) {
	userLevels, err := s.repo.GetUserLevels(ctx, userID)
	if err != nil {
		return 0, err
	}
	return countCompletedLevels(userLevels), nil
}

func countCompletedLevels(userLevels []domain.UserLevel) int {
	completed := 0
	for _, ul := range userLevels {
		if ul.Completed {
			completed++
		}
	}
	return completed
}

func levelIDs(levels []domain.Level) []int {
	ids := make([]int, 0, len(levels))
	for _, l := range levels {
		ids = append(ids, l.ID)
	}
	return ids
}

// GetLevels returns course levels annotated with the user's progress status.
func (s *Service) GetLevels(ctx context.Context, userID string, courseType domain.CourseType) ([]domain.LevelWithStatus, error) {
	levels, err := s.repo.ListLevelsByCourse(ctx, courseType)
	if err != nil {
		return nil, fmt.Errorf("list levels: %w", err)
	}

	userLevels, err := s.repo.GetUserLevelsByLevelIDs(ctx, userID, levelIDs(levels))
	if err != nil {
		return nil, fmt.Errorf("get user levels: %w", err)
	}

	ulMap := make(map[int]domain.UserLevel, len(userLevels))
	for _, ul := range userLevels {
		ulMap[ul.LevelID] = ul
	}

	// Determine the highest completed course level to unlock the next step in this course only.
	highestCompletedCourseLevel := 0
	for _, l := range levels {
		if ul, ok := ulMap[l.ID]; ok && ul.Completed && l.CourseLevel > highestCompletedCourseLevel {
			highestCompletedCourseLevel = l.CourseLevel
		}
	}

	results := make([]domain.LevelWithStatus, 0, len(levels))
	for _, l := range levels {
		lws := domain.LevelWithStatus{Level: l, LessonCount: len(l.Lessons)}
		lws.Lessons = []domain.Lesson{}
		lws.MiniGame = domain.MiniGame{}
		lws.Goal = ""
		if ul, ok := ulMap[l.ID]; ok {
			lws.LessonsComplete = ul.LessonsComplete
			if ul.Completed {
				lws.Status = "completed"
			} else {
				lws.Status = "in_progress"
			}
		} else if l.CourseLevel <= highestCompletedCourseLevel+1 {
			lws.Status = "available"
		} else {
			lws.Status = "locked"
		}
		results = append(results, lws)
	}

	return results, nil
}

// GetLevelDetail returns a single level with the user's progress.
func (s *Service) GetLevelDetail(ctx context.Context, userID string, levelID int, courseType domain.CourseType) (*domain.LevelWithStatus, error) {
	lvl, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if lvl == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && lvl.CourseType != courseType {
		return nil, ErrLevelNotFound
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}

	lws := &domain.LevelWithStatus{Level: *lvl, Status: "available", LessonCount: len(lvl.Lessons)}
	if ul != nil {
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
func (s *Service) CompleteLessonInLevel(ctx context.Context, userID string, levelID, lessonIndex int, courseType domain.CourseType) (*domain.UserLevel, error) {
	lvl, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if lvl == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && lvl.CourseType != courseType {
		return nil, ErrLevelNotFound
	}
	if lessonIndex < 0 || lessonIndex >= len(lvl.Lessons) {
		return nil, ErrInvalidLessonIndex
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul == nil {
		ul = &domain.UserLevel{
			ID:         uuid.NewString(),
			UserID:     userID,
			LevelID:    levelID,
			CourseType: lvl.CourseType,
			CreatedAt:  time.Now().UTC(),
		}
	}
	ul.CourseType = lvl.CourseType

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
func (s *Service) CompleteLevel(ctx context.Context, userID string, levelID int, courseType domain.CourseType) (*domain.LevelCompletionResult, error) {
	lvl, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if lvl == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && lvl.CourseType != courseType {
		return nil, ErrLevelNotFound
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul != nil && ul.Completed {
		// Already completed — return existing result, no extra XP.
		nextLevel, err := s.repo.GetNextLevelByCourseLevel(ctx, lvl.CourseType, lvl.CourseLevel)
		if err != nil {
			return nil, err
		}
		nextLevelID := 0
		if nextLevel != nil {
			nextLevelID = nextLevel.ID
		}
		return &domain.LevelCompletionResult{
			XPEarned:     0,
			UnlockReward: lvl.UnlockReward,
			TreasureOpen: false,
			NextLevelID:  nextLevelID,
			CourseType:   string(lvl.CourseType),
		}, nil
	}

	if ul == nil {
		ul = &domain.UserLevel{
			ID:         uuid.NewString(),
			UserID:     userID,
			LevelID:    levelID,
			CourseType: lvl.CourseType,
			CreatedAt:  time.Now().UTC(),
		}
	}

	ul.CourseType = lvl.CourseType
	ul.LessonsComplete = len(lvl.Lessons)
	ul.MiniGameDone = true
	ul.Completed = true
	ul.CompletedAt = time.Now().UTC()

	if err := s.repo.UpsertUserLevel(ctx, ul); err != nil {
		return nil, err
	}

	xp := lvl.XPReward
	var (
		updatedProg   *progressdomain.Progress
		updatedStreak *progressdomain.Streak
		completed     int
		completedErr  error
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { updatedProg, err = s.progress.Award(gctx, userID, xp, 5); return })
	g.Go(func() (err error) { updatedStreak, err = s.progress.BumpStreak(gctx, userID); return })
	g.Go(func() error { completed, completedErr = s.CompletedLevelCount(gctx, userID); return nil })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	// Grant any rewards newly unlocked by this completion (non-fatal).
	var newRewards []rewarddomain.Reward
	if completedErr == nil {
		if granted, gerr := s.reward.Grant(ctx, userID, rewardapp.Metrics{
			CompletedLevels: completed,
			XP:              updatedProg.TotalXP,
			StreakDays:      updatedStreak.CurrentStreak,
		}); gerr == nil {
			newRewards = granted
		}
	}
	if newRewards == nil {
		newRewards = []rewarddomain.Reward{}
	}

	nextLevel, err := s.repo.GetNextLevelByCourseLevel(ctx, lvl.CourseType, lvl.CourseLevel)
	if err != nil {
		return nil, err
	}
	nextLevelID := 0
	if nextLevel != nil {
		nextLevelID = nextLevel.ID
	}

	return &domain.LevelCompletionResult{
		XPEarned:     xp,
		UnlockReward: lvl.UnlockReward,
		TreasureOpen: lvl.CourseLevel%5 == 0,
		NextLevelID:  nextLevelID,
		CourseType:   string(lvl.CourseType),
		NewRewards:   newRewards,
	}, nil
}
