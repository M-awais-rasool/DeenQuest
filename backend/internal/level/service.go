package level

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/chawais/deenquest/backend/internal/progress"
	"github.com/chawais/deenquest/backend/internal/reward"
)

var (
	ErrLevelNotFound      = errors.New("level not found")
	ErrInvalidLessonIndex = errors.New("invalid lesson index")
)

type Service struct {
	repo     Repository
	progress *progress.Service
	reward   *reward.Service
}

func NewService(repo Repository, progressSvc *progress.Service, rewardSvc *reward.Service) *Service {
	return &Service{repo: repo, progress: progressSvc, reward: rewardSvc}
}

func (s *Service) Seed(ctx context.Context) error {
	stored, err := s.repo.LevelSeedVersion(ctx)
	if err != nil {
		return fmt.Errorf("read level seed version: %w", err)
	}
	if stored < SeedDataVersion {
		if err := s.repo.ReplaceLevels(ctx, SeedLevels(), SeedDataVersion); err != nil {
			return fmt.Errorf("migrate curriculum v%d→v%d: %w", stored, SeedDataVersion, err)
		}
		return nil
	}
	return s.repo.SeedLevels(ctx, SeedLevels())
}

func (s *Service) LevelByID(ctx context.Context, levelID int) (*Level, error) {
	return s.repo.GetLevelByID(ctx, levelID)
}

func (s *Service) CompletedLevelCount(ctx context.Context, userID string) (int, error) {
	userLevels, err := s.repo.GetUserLevels(ctx, userID)
	if err != nil {
		return 0, err
	}
	return countCompletedLevels(userLevels), nil
}

func countCompletedLevels(userLevels []UserLevel) int {
	completed := 0
	for _, ul := range userLevels {
		if ul.Completed {
			completed++
		}
	}
	return completed
}

func levelIDs(levels []Level) []int {
	ids := make([]int, 0, len(levels))
	for _, l := range levels {
		ids = append(ids, l.ID)
	}
	return ids
}

// GetLevels returns course levels annotated with the user's progress status.
func (s *Service) GetLevels(ctx context.Context, userID string, courseType CourseType) ([]LevelWithStatus, error) {
	levels, err := s.repo.ListLevelsByCourse(ctx, courseType)
	if err != nil {
		return nil, fmt.Errorf("list levels: %w", err)
	}

	userLevels, err := s.repo.GetUserLevelsByLevelIDs(ctx, userID, levelIDs(levels))
	if err != nil {
		return nil, fmt.Errorf("get user levels: %w", err)
	}

	ulMap := make(map[int]UserLevel, len(userLevels))
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

	results := make([]LevelWithStatus, 0, len(levels))
	for _, l := range levels {
		lws := LevelWithStatus{Level: l, LessonCount: len(l.Lessons)}
		lws.Lessons = []Lesson{}
		lws.MiniGame = MiniGame{}
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
func (s *Service) GetLevelDetail(ctx context.Context, userID string, levelID int, courseType CourseType) (*LevelWithStatus, error) {
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

	lws := &LevelWithStatus{Level: *lvl, Status: "available", LessonCount: len(lvl.Lessons)}
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
func (s *Service) CompleteLessonInLevel(ctx context.Context, userID string, levelID, lessonIndex int, courseType CourseType) (*UserLevel, error) {
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
		ul = &UserLevel{
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
func (s *Service) CompleteLevel(ctx context.Context, userID string, levelID int, courseType CourseType) (*LevelCompletionResult, error) {
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
		return &LevelCompletionResult{
			XPEarned:     0,
			UnlockReward: lvl.UnlockReward,
			TreasureOpen: false,
			NextLevelID:  nextLevelID,
			CourseType:   string(lvl.CourseType),
		}, nil
	}

	if ul == nil {
		ul = &UserLevel{
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

	// Award XP (fixed amount per level) and bump the streak.
	xp := lvl.XPReward
	updatedProg, err := s.progress.Award(ctx, userID, xp, 5)
	if err != nil {
		return nil, err
	}
	updatedStreak, err := s.progress.BumpStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Grant any rewards newly unlocked by this completion (non-fatal).
	var newRewards []reward.Reward
	if completed, cerr := s.CompletedLevelCount(ctx, userID); cerr == nil {
		if granted, gerr := s.reward.Grant(ctx, userID, reward.Metrics{
			CompletedLevels: completed,
			XP:              updatedProg.TotalXP,
			StreakDays:      updatedStreak.CurrentStreak,
		}); gerr == nil {
			newRewards = granted
		}
	}
	if newRewards == nil {
		newRewards = []reward.Reward{}
	}

	nextLevel, err := s.repo.GetNextLevelByCourseLevel(ctx, lvl.CourseType, lvl.CourseLevel)
	if err != nil {
		return nil, err
	}
	nextLevelID := 0
	if nextLevel != nil {
		nextLevelID = nextLevel.ID
	}

	return &LevelCompletionResult{
		XPEarned:     xp,
		UnlockReward: lvl.UnlockReward,
		TreasureOpen: lvl.CourseLevel%5 == 0,
		NextLevelID:  nextLevelID,
		CourseType:   string(lvl.CourseType),
		NewRewards:   newRewards,
	}, nil
}
