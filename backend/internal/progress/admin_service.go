package progress

import (
	"context"
	"errors"
	"regexp"
	"strconv"
	"strings"
)

var (
	ErrValidation     = errors.New("validation failed")
	ErrTaskNotFound   = errors.New("task not found")
	ErrRewardNotFound = errors.New("reward not found")
)

// GetContentRegistry returns the component/mini-game/block schema catalog.
func (s *CoreService) GetContentRegistry() ContentRegistry {
	return BuildContentRegistry()
}

// ─── Levels ────────────────────────────────────────────────────────────────

func (s *CoreService) AdminListLevels(ctx context.Context) ([]Level, error) {
	return s.repo.ListAllLevels(ctx)
}

func (s *CoreService) AdminGetLevel(ctx context.Context, id int) (*Level, error) {
	level, err := s.repo.GetLevelByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, ErrLevelNotFound
	}
	return level, nil
}

func (s *CoreService) AdminCreateLevel(ctx context.Context, in *Level) (*Level, error) {
	if err := validateLevel(in); err != nil {
		return nil, err
	}
	if in.CourseType == "" {
		in.CourseType = CourseQaida
	}

	existing, err := s.repo.ListAllLevels(ctx)
	if err != nil {
		return nil, err
	}
	// Auto-assign IDs so the admin never has to pick them manually.
	if in.ID == 0 {
		in.ID = maxLevelID(existing) + 1
	}
	if in.CourseLevel == 0 {
		in.CourseLevel = maxCourseLevel(existing, in.CourseType) + 1
	}

	if err := s.repo.CreateLevel(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminUpdateLevel(ctx context.Context, id int, in *Level) (*Level, error) {
	if err := validateLevel(in); err != nil {
		return nil, err
	}
	in.ID = id
	if in.CourseType == "" {
		in.CourseType = CourseQaida
	}
	if err := s.repo.UpdateLevel(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminDeleteLevel(ctx context.Context, id int) error {
	return s.repo.DeleteLevel(ctx, id)
}

// ─── Daily tasks ─────────────────────────────────────────────────────────────

func (s *CoreService) AdminListTasks(ctx context.Context) ([]DailyTask, error) {
	return s.repo.ListAllDailyTasks(ctx)
}

func (s *CoreService) AdminGetTask(ctx context.Context, id string) (*DailyTask, error) {
	task, err := s.repo.GetDailyTaskByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrTaskNotFound
	}
	return task, nil
}

func (s *CoreService) AdminCreateTask(ctx context.Context, in *DailyTask) (*DailyTask, error) {
	if err := validateTask(in); err != nil {
		return nil, err
	}
	if in.ID == "" {
		in.ID = slugify(in.Title)
	}
	if in.ID == "" {
		return nil, errors.New("task id or title is required")
	}
	if in.CompletionType == "" {
		in.CompletionType = CompletionButton
	}
	if existing, _ := s.repo.GetDailyTaskByID(ctx, in.ID); existing != nil {
		return nil, errors.New("a task with this id already exists")
	}
	if err := s.repo.CreateDailyTask(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminUpdateTask(ctx context.Context, id string, in *DailyTask) (*DailyTask, error) {
	if err := validateTask(in); err != nil {
		return nil, err
	}
	in.ID = id
	if in.CompletionType == "" {
		in.CompletionType = CompletionButton
	}
	if err := s.repo.UpdateDailyTask(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminDeleteTask(ctx context.Context, id string) error {
	return s.repo.DeleteDailyTask(ctx, id)
}

// ─── Rewards ─────────────────────────────────────────────────────────────────

func (s *CoreService) AdminListRewards(ctx context.Context) ([]Reward, error) {
	return s.repo.ListAllRewards(ctx)
}

func (s *CoreService) AdminGetReward(ctx context.Context, id string) (*Reward, error) {
	reward, err := s.repo.GetRewardByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if reward == nil {
		return nil, ErrRewardNotFound
	}
	return reward, nil
}

func (s *CoreService) AdminCreateReward(ctx context.Context, in *Reward) (*Reward, error) {
	if in == nil || strings.TrimSpace(in.Title) == "" {
		return nil, errors.New("title is required")
	}
	if in.ID == "" {
		in.ID = slugify(in.Title)
	}
	if in.ID == "" {
		return nil, errors.New("reward id or title is required")
	}
	if existing, _ := s.repo.GetRewardByID(ctx, in.ID); existing != nil {
		return nil, errors.New("a reward with this id already exists")
	}
	if err := s.repo.CreateReward(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminUpdateReward(ctx context.Context, id string, in *Reward) (*Reward, error) {
	if in == nil || strings.TrimSpace(in.Title) == "" {
		return nil, errors.New("title is required")
	}
	in.ID = id
	if err := s.repo.UpdateReward(ctx, in); err != nil {
		return nil, err
	}
	return in, nil
}

func (s *CoreService) AdminDeleteReward(ctx context.Context, id string) error {
	return s.repo.DeleteReward(ctx, id)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func validateLevel(l *Level) error {
	if l == nil || strings.TrimSpace(l.Title) == "" {
		return errors.New("title is required")
	}
	for i, lesson := range l.Lessons {
		if strings.TrimSpace(lesson.Component) == "" {
			return errors.New("lesson " + strconv.Itoa(i+1) + " is missing a component")
		}
	}
	return nil
}

func validateTask(t *DailyTask) error {
	if t == nil || strings.TrimSpace(t.Title) == "" {
		return errors.New("title is required")
	}
	return nil
}

func maxLevelID(levels []Level) int {
	max := 0
	for _, l := range levels {
		if l.ID > max {
			max = l.ID
		}
	}
	return max
}

func maxCourseLevel(levels []Level, course CourseType) int {
	max := 0
	for _, l := range levels {
		if l.CourseType == course && l.CourseLevel > max {
			max = l.CourseLevel
		}
	}
	return max
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = slugRe.ReplaceAllString(s, "-")
	return strings.Trim(s, "-")
}
