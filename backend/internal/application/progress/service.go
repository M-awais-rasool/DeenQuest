package progress

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"sort"
	"time"

	"github.com/google/uuid"
	"golang.org/x/sync/errgroup"

	dlearning "github.com/chawais/talent-flow/backend/internal/domain/learning"
	"github.com/chawais/talent-flow/backend/internal/domain/progress"
)

// EventEmitter publishes Learning Agent behavior events. The learning Publisher
// satisfies it. Optional: when nil, completion events are simply not emitted, so
// core flows are unaffected by the learning pipeline.
type EventEmitter interface {
	Emit(ctx context.Context, ev dlearning.BehaviorEvent)
}

// LearnerStateReader exposes the user's learning state so daily-task selection
// can bias toward weak areas. The learning Repository satisfies it. Optional:
// when nil, selection falls back to the original deterministic shuffle.
type LearnerStateReader interface {
	GetState(ctx context.Context, userID string) (*dlearning.LearnerState, error)
}

type CoreService struct {
	repo    progress.CoreRepository
	emitter EventEmitter
	states  LearnerStateReader
}

// SetEventEmitter wires the Learning Agent's event publisher. Called once at startup.
func (s *CoreService) SetEventEmitter(e EventEmitter) { s.emitter = e }

// SetLearnerStateReader wires the Learning Agent's state store for personalized
// daily-task selection. Called once at startup.
func (s *CoreService) SetLearnerStateReader(r LearnerStateReader) { s.states = r }

// emit fires a behavior event off the request lifecycle (context.Background so a
// completed/canceled request can't drop the event). No-op when no emitter is set.
func (s *CoreService) emit(ev dlearning.BehaviorEvent) {
	if s.emitter == nil {
		return
	}
	s.emitter.Emit(context.Background(), ev)
}

// levelSkillTags aggregates the de-duplicated skill tags across a level's
// lessons and mini-game, used to attribute mastery on level completion.
func levelSkillTags(level *progress.Level) []string {
	seen := make(map[string]struct{})
	var tags []string
	add := func(ts []string) {
		for _, t := range ts {
			if t == "" {
				continue
			}
			if _, ok := seen[t]; ok {
				continue
			}
			seen[t] = struct{}{}
			tags = append(tags, t)
		}
	}
	for i := range level.Lessons {
		add(level.Lessons[i].SkillTags)
	}
	add(level.MiniGame.SkillTags)
	return tags
}

var (
	ErrLevelNotFound      = errors.New("level not found")
	ErrInvalidLessonIndex = errors.New("invalid lesson index")
)

func NewCoreService(repo progress.CoreRepository) *CoreService {
	return &CoreService{repo: repo}
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

// PublicProgressResponse contains only the fields safe to expose without authentication.
type PublicProgressResponse struct {
	XP            int `json:"xp"`
	Level         int `json:"level"`
	BarakahScore  int `json:"barakah_score"`
	CurrentStreak int `json:"current_streak"`
}

type LeaderboardEntry struct {
	Rank   int    `json:"rank"`
	UserID string `json:"user_id"`
	Level  int    `json:"level"`
	XP     int    `json:"xp"`
}

// GetUserProgress returns XP, streak, and the last 7 days completion status.
func (s *CoreService) GetUserProgress(ctx context.Context, userID string) (*ProgressResponse, error) {
	now := time.Now().UTC()
	dates := make([]string, 7)
	for i := 0; i < 7; i++ {
		dates[i] = now.AddDate(0, 0, -(6 - i)).Format("2006-01-02")
	}

	var (
		prog           *progress.Progress
		streak         *progress.Streak
		completedDates map[string]bool
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { prog, err = s.repo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.repo.GetStreak(gctx, userID); return })
	g.Go(func() (err error) { completedDates, err = s.repo.GetCompletedDates(gctx, userID, dates); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if prog == nil {
		prog = &progress.Progress{Level: 1}
	}
	if streak == nil {
		streak = &progress.Streak{}
	}

	weekly := make([]bool, 7)
	for i, d := range dates {
		weekly[i] = completedDates[d]
	}

	return &ProgressResponse{
		XP:                prog.TotalXP,
		Level:             prog.Level,
		BarakahScore:      prog.BarakahScore,
		CurrentStreak:     streak.CurrentStreak,
		LongestStreak:     streak.LongestStreak,
		WeeklyCompletions: weekly,
	}, nil
}

// GetPublicProgress returns the subset of progress data that is safe to show publicly.
func (s *CoreService) GetPublicProgress(ctx context.Context, userID string) (*PublicProgressResponse, error) {
	var (
		prog   *progress.Progress
		streak *progress.Streak
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { prog, err = s.repo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.repo.GetStreak(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, err
	}

	if prog == nil {
		prog = &progress.Progress{Level: 1}
	}
	currentStreak := 0
	if streak != nil {
		currentStreak = streak.CurrentStreak
	}

	return &PublicProgressResponse{
		XP:            prog.TotalXP,
		Level:         prog.Level,
		BarakahScore:  prog.BarakahScore,
		CurrentStreak: currentStreak,
	}, nil
}

func (s *CoreService) GetLeaderboard(ctx context.Context, limit int) ([]LeaderboardEntry, error) {
	rows, err := s.repo.ListLeaderboardProgress(ctx, limit)
	if err != nil {
		return nil, err
	}

	result := make([]LeaderboardEntry, 0, len(rows))
	for i, row := range rows {
		level := row.Level
		if level < 1 {
			level = 1
		}
		result = append(result, LeaderboardEntry{
			Rank:   i + 1,
			UserID: row.UserID,
			Level:  level,
			XP:     row.TotalXP,
		})
	}

	return result, nil
}

// SeedDailyTasks inserts/updates the master task templates into the database.
func (s *CoreService) SeedDailyTasks(ctx context.Context) error {
	return s.repo.SeedDailyTasks(ctx, progress.SeedTasks())
}

// GetDailyTasks returns 5 tasks for a user on a given date.
// If no assignment exists for today, it picks 1 fixed (Fajr) + 4 random tasks
// and persists the assignment so the user gets the same set all day.
func (s *CoreService) GetDailyTasks(ctx context.Context, userID string) ([]progress.DailyTaskWithStatus, error) {
	today := time.Now().UTC().Format("2006-01-02")

	var (
		assignments []progress.UserDailyTask
		allTasks    []progress.DailyTask
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { assignments, err = s.repo.GetUserDailyTasks(gctx, userID, today); return })
	g.Go(func() (err error) { allTasks, err = s.repo.ListAllDailyTasks(gctx); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load daily tasks: %w", err)
	}

	taskByID := make(map[string]progress.DailyTask, len(allTasks))
	for _, t := range allTasks {
		taskByID[t.ID] = t
	}

	// If no assignments exist, generate them.
	if len(assignments) == 0 {
		var fixed []progress.DailyTask
		var pool []progress.DailyTask
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

		// Personalize: float tasks that exercise the learner's weak areas to the
		// front (stable, so the shuffle still varies order within each group).
		if weak := s.weakAreaSet(ctx, userID); len(weak) > 0 {
			sort.SliceStable(pool, func(i, j int) bool {
				return taskMatchesWeak(pool[i], weak) && !taskMatchesWeak(pool[j], weak)
			})
		}

		selected := make([]progress.DailyTask, 0, 5)
		selected = append(selected, fixed...)
		remaining := 5 - len(selected)
		if remaining > len(pool) {
			remaining = len(pool)
		}
		selected = append(selected, pool[:remaining]...)

		now := time.Now().UTC()
		assignments = make([]progress.UserDailyTask, 0, len(selected))
		for _, t := range selected {
			assignments = append(assignments, progress.UserDailyTask{
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
	results := make([]progress.DailyTaskWithStatus, 0, len(assignments))
	for _, a := range assignments {
		task, ok := taskByID[a.TaskID]
		if !ok {
			continue
		}
		results = append(results, progress.DailyTaskWithStatus{
			DailyTask:   task,
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
		if errors.Is(err, progress.ErrAlreadyCompleted) {
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

	if _, err := s.bumpProgress(ctx, userID, task.RewardXP, 0); err != nil {
		return err
	}
	if _, err := s.bumpStreak(ctx, userID); err != nil {
		return err
	}

	s.emit(dlearning.BehaviorEvent{
		UserID:    userID,
		Type:      dlearning.EventTaskCompleted,
		TaskID:    taskID,
		SkillTags: task.SkillTags,
	})

	return nil
}

// weakAreaSet returns the user's weak-area skill tags as a set, or nil when no
// learner state is available (new user, or reader not wired). Best-effort —
// errors degrade to the default selection rather than failing the request.
func (s *CoreService) weakAreaSet(ctx context.Context, userID string) map[string]struct{} {
	if s.states == nil {
		return nil
	}
	st, err := s.states.GetState(ctx, userID)
	if err != nil || st == nil {
		return nil
	}
	set := make(map[string]struct{}, len(st.WeakAreas))
	for _, w := range st.WeakAreas {
		set[w] = struct{}{}
	}
	return set
}

func taskMatchesWeak(t progress.DailyTask, weak map[string]struct{}) bool {
	for _, tag := range t.SkillTags {
		if _, ok := weak[tag]; ok {
			return true
		}
	}
	return false
}

// hashString produces a simple hash for seeding the random shuffle.
func hashString(s string) uint32 {
	var h uint32
	for _, c := range s {
		h = h*31 + uint32(c)
	}
	return h
}

// bumpProgress applies an XP/Barakah delta atomically and returns the updated
// progress. It is race-free under concurrent completions (single $inc upsert).
func (s *CoreService) bumpProgress(ctx context.Context, userID string, xpDelta int, barakahDelta int) (*progress.Progress, error) {
	return s.repo.IncrementProgress(ctx, userID, xpDelta, barakahDelta)
}

// bumpStreak advances the user's daily streak and returns the updated streak.
func (s *CoreService) bumpStreak(ctx context.Context, userID string) (*progress.Streak, error) {
	streak, err := s.repo.GetStreak(ctx, userID)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if streak == nil {
		streak = &progress.Streak{ID: uuid.NewString(), UserID: userID, CurrentStreak: 1, LongestStreak: 1, LastCompletedAt: now, UpdatedAt: now}
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
	if err := s.repo.UpsertStreak(ctx, streak); err != nil {
		return nil, err
	}
	return streak, nil
}

// ─── Level Journey Methods ───

// SeedLevels inserts/updates the master level templates for every course.
func (s *CoreService) SeedLevels(ctx context.Context) error {
	return s.repo.SeedLevels(ctx, progress.SeedLevels())
}

// SeedRewards inserts/updates the master reward definitions.
func (s *CoreService) SeedRewards(ctx context.Context) error {
	return s.repo.SeedRewards(ctx, progress.SeedRewards())
}

// GetRewards returns all rewards annotated with the user's unlock status and progress.
func (s *CoreService) GetRewards(ctx context.Context, userID string) ([]progress.RewardWithStatus, error) {
	var (
		allRewards  []progress.Reward
		userRewards []progress.UserReward
		userLevels  []progress.UserLevel
		prog        *progress.Progress
		streak      *progress.Streak
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { allRewards, err = s.repo.ListAllRewards(gctx); return })
	g.Go(func() (err error) { userRewards, err = s.repo.GetUserRewards(gctx, userID); return })
	g.Go(func() (err error) { userLevels, err = s.repo.GetUserLevels(gctx, userID); return })
	g.Go(func() (err error) { prog, err = s.repo.GetProgress(gctx, userID); return })
	g.Go(func() (err error) { streak, err = s.repo.GetStreak(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load rewards data: %w", err)
	}

	grantedMap := make(map[string]progress.UserReward, len(userRewards))
	for _, ur := range userRewards {
		grantedMap[ur.RewardID] = ur
	}

	completedLevels, xp, streakDays := deriveMetrics(userLevels, prog, streak)

	result := make([]progress.RewardWithStatus, 0, len(allRewards))
	for _, rw := range allRewards {
		rws := progress.RewardWithStatus{Reward: rw}
		current := metricValue(rw.Trigger, completedLevels, xp, streakDays)
		rws.Current = current
		rws.Progress = progressRatio(current, rw.Required)
		if ur, ok := grantedMap[rw.ID]; ok {
			rws.Unlocked = true
			t := ur.UnlockedAt
			rws.UnlockedAt = &t
		}
		result = append(result, rws)
	}
	return result, nil
}

func (s *CoreService) checkAndGrantRewards(ctx context.Context, userID string, xp, streakDays int) ([]progress.Reward, error) {
	var (
		allRewards  []progress.Reward
		userRewards []progress.UserReward
		userLevels  []progress.UserLevel
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() (err error) { allRewards, err = s.repo.ListAllRewards(gctx); return })
	g.Go(func() (err error) { userRewards, err = s.repo.GetUserRewards(gctx, userID); return })
	g.Go(func() (err error) { userLevels, err = s.repo.GetUserLevels(gctx, userID); return })
	if err := g.Wait(); err != nil {
		return nil, fmt.Errorf("load reward-eligibility data: %w", err)
	}
	if len(allRewards) == 0 {
		return nil, nil
	}

	granted := make(map[string]struct{}, len(userRewards))
	for _, ur := range userRewards {
		granted[ur.RewardID] = struct{}{}
	}

	completedLevels := countCompletedLevels(userLevels)

	var newlyGranted []progress.Reward
	for _, rw := range allRewards {
		if _, already := granted[rw.ID]; already {
			continue
		}
		current := metricValue(rw.Trigger, completedLevels, xp, streakDays)
		if current >= rw.Required {
			ur := &progress.UserReward{
				ID:         uuid.NewString(),
				UserID:     userID,
				RewardID:   rw.ID,
				UnlockedAt: time.Now().UTC(),
			}
			if err := s.repo.GrantUserReward(ctx, ur); err != nil {
				return nil, fmt.Errorf("grant reward %s: %w", rw.ID, err)
			}
			newlyGranted = append(newlyGranted, rw)
		}
	}
	return newlyGranted, nil
}

// countCompletedLevels returns how many of the user's levels are completed.
func countCompletedLevels(userLevels []progress.UserLevel) int {
	completed := 0
	for _, ul := range userLevels {
		if ul.Completed {
			completed++
		}
	}
	return completed
}

// deriveMetrics resolves the three reward metrics from already-fetched data.
func deriveMetrics(userLevels []progress.UserLevel, prog *progress.Progress, streak *progress.Streak) (completedLevels, xp, streakDays int) {
	completedLevels = countCompletedLevels(userLevels)
	if prog != nil {
		xp = prog.TotalXP
	}
	if streak != nil {
		streakDays = streak.CurrentStreak
	}
	return completedLevels, xp, streakDays
}

// metricValue resolves the correct user metric for a given reward trigger.
func metricValue(trigger progress.RewardTrigger, completedLevels, xp, streakDays int) int {
	switch trigger {
	case progress.TriggerLevelsCompleted:
		return completedLevels
	case progress.TriggerXP:
		return xp
	case progress.TriggerStreakDays:
		return streakDays
	default:
		return 0
	}
}

// progressRatio returns a 0.0–1.0 ratio clamped to 1.
func progressRatio(current, required int) float64 {
	if required <= 0 {
		return 1.0
	}
	ratio := float64(current) / float64(required)
	if ratio > 1.0 {
		return 1.0
	}
	return ratio
}

func levelIDs(levels []progress.Level) []int {
	ids := make([]int, 0, len(levels))
	for _, l := range levels {
		ids = append(ids, l.ID)
	}
	return ids
}

// GetLevels returns course levels annotated with the user's progress status.
func (s *CoreService) GetLevels(ctx context.Context, userID string, courseType progress.CourseType) ([]progress.LevelWithStatus, error) {
	levels, err := s.repo.ListLevelsByCourse(ctx, courseType)
	if err != nil {
		return nil, fmt.Errorf("list levels: %w", err)
	}

	userLevels, err := s.repo.GetUserLevelsByLevelIDs(ctx, userID, levelIDs(levels))
	if err != nil {
		return nil, fmt.Errorf("get user levels: %w", err)
	}

	ulMap := make(map[int]progress.UserLevel, len(userLevels))
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

	results := make([]progress.LevelWithStatus, 0, len(levels))
	for _, l := range levels {
		lws := progress.LevelWithStatus{Level: l, LessonCount: len(l.Lessons)}
		lws.Lessons = []progress.Lesson{}
		lws.MiniGame = progress.MiniGame{}
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
func (s *CoreService) GetLevelDetail(ctx context.Context, userID string, levelID int, courseType progress.CourseType) (*progress.LevelWithStatus, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && level.CourseType != courseType {
		return nil, ErrLevelNotFound
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}

	lws := &progress.LevelWithStatus{Level: *level, Status: "available", LessonCount: len(level.Lessons)}
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
func (s *CoreService) CompleteLessonInLevel(ctx context.Context, userID string, levelID, lessonIndex int, courseType progress.CourseType) (*progress.UserLevel, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && level.CourseType != courseType {
		return nil, ErrLevelNotFound
	}
	if lessonIndex < 0 || lessonIndex >= len(level.Lessons) {
		return nil, ErrInvalidLessonIndex
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul == nil {
		ul = &progress.UserLevel{
			ID:         uuid.NewString(),
			UserID:     userID,
			LevelID:    levelID,
			CourseType: level.CourseType,
			CreatedAt:  time.Now().UTC(),
		}
	}
	ul.CourseType = level.CourseType

	newCount := lessonIndex + 1
	if newCount > ul.LessonsComplete {
		ul.LessonsComplete = newCount
	}

	if err := s.repo.UpsertUserLevel(ctx, ul); err != nil {
		return nil, err
	}

	s.emit(dlearning.BehaviorEvent{
		UserID:      userID,
		Type:        dlearning.EventLessonCompleted,
		CourseType:  string(level.CourseType),
		LevelID:     levelID,
		LessonIndex: lessonIndex,
		SkillTags:   level.Lessons[lessonIndex].SkillTags,
	})

	return ul, nil
}

// CompleteLevel marks a level as fully completed and awards XP + rewards.
func (s *CoreService) CompleteLevel(ctx context.Context, userID string, levelID int, courseType progress.CourseType) (*progress.LevelCompletionResult, error) {
	level, err := s.repo.GetLevelByID(ctx, levelID)
	if err != nil {
		return nil, err
	}
	if level == nil {
		return nil, ErrLevelNotFound
	}
	if courseType != "" && level.CourseType != courseType {
		return nil, ErrLevelNotFound
	}

	ul, err := s.repo.GetUserLevel(ctx, userID, levelID)
	if err != nil {
		return nil, err
	}
	if ul != nil && ul.Completed {
		// Already completed — return existing result, no extra XP.
		nextLevel, err := s.repo.GetNextLevelByCourseLevel(ctx, level.CourseType, level.CourseLevel)
		if err != nil {
			return nil, err
		}
		nextLevelID := 0
		if nextLevel != nil {
			nextLevelID = nextLevel.ID
		}
		return &progress.LevelCompletionResult{
			XPEarned:     0,
			UnlockReward: level.UnlockReward,
			TreasureOpen: false,
			NextLevelID:  nextLevelID,
			CourseType:   string(level.CourseType),
		}, nil
	}

	if ul == nil {
		ul = &progress.UserLevel{
			ID:         uuid.NewString(),
			UserID:     userID,
			LevelID:    levelID,
			CourseType: level.CourseType,
			CreatedAt:  time.Now().UTC(),
		}
	}

	ul.CourseType = level.CourseType
	ul.LessonsComplete = len(level.Lessons)
	ul.MiniGameDone = true
	ul.Completed = true
	ul.CompletedAt = time.Now().UTC()

	if err := s.repo.UpsertUserLevel(ctx, ul); err != nil {
		return nil, err
	}

	// Award XP (fixed amount per level).
	xp := level.XPReward
	updatedProg, err := s.bumpProgress(ctx, userID, xp, 5)
	if err != nil {
		return nil, err
	}
	updatedStreak, err := s.bumpStreak(ctx, userID)
	if err != nil {
		return nil, err
	}

	newRewards, err := s.checkAndGrantRewards(ctx, userID, updatedProg.TotalXP, updatedStreak.CurrentStreak)
	if err != nil {
		// Non-fatal: log but don't fail the completion.
		newRewards = nil
	}

	if newRewards == nil {
		newRewards = []progress.Reward{}
	}
	nextLevel, err := s.repo.GetNextLevelByCourseLevel(ctx, level.CourseType, level.CourseLevel)
	if err != nil {
		return nil, err
	}
	nextLevelID := 0
	if nextLevel != nil {
		nextLevelID = nextLevel.ID
	}

	s.emit(dlearning.BehaviorEvent{
		UserID:     userID,
		Type:       dlearning.EventLevelCompleted,
		CourseType: string(level.CourseType),
		LevelID:    levelID,
		SkillTags:  levelSkillTags(level),
	})

	return &progress.LevelCompletionResult{
		XPEarned:     xp,
		UnlockReward: level.UnlockReward,
		TreasureOpen: level.CourseLevel%5 == 0,
		NextLevelID:  nextLevelID,
		CourseType:   string(level.CourseType),
		NewRewards:   newRewards,
	}, nil
}
