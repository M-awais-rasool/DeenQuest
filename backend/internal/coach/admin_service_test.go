package coach

import (
	"context"
	"encoding/json"
	"testing"
	"time"
)

// fakeAdminRepo is an in-memory AdminRepository for the dashboard tests.
type fakeAdminRepo struct {
	states  []*UserSkillState
	active  int
	decay   int
	events  int64
	missed  []LessonStruggle
	scans   int // how many times the learner collection was streamed
	failNow error
}

func (f *fakeAdminRepo) EachSkillState(_ context.Context, fn func(*UserSkillState) error) error {
	if f.failNow != nil {
		return f.failNow
	}
	f.scans++
	for _, s := range f.states {
		if err := fn(s); err != nil {
			return err
		}
	}
	return nil
}

func (f *fakeAdminRepo) CountActiveInsights(context.Context, time.Time) (int, int, error) {
	return f.active, f.decay, nil
}

func (f *fakeAdminRepo) CountEvents(context.Context) (int64, error) { return f.events, nil }

func (f *fakeAdminRepo) MostMissedLessons(context.Context, int) ([]LessonStruggle, error) {
	return f.missed, nil
}

func newFakeAdminRepo() *fakeAdminRepo {
	weak := NewUserSkillState("weak-learner")
	weak.Skills["ب"] = &SkillStat{Attempts: 20, Correct: 4, EMAAccuracy: 0.2, LastSeen: adminNow}

	lapsed := NewUserSkillState("lapsed-learner")
	lapsed.Skills["ت"] = &SkillStat{
		Attempts: 30, Correct: 27, EMAAccuracy: 0.9,
		LastSeen: adminNow.AddDate(0, 0, -inactiveDays-2),
	}

	return &fakeAdminRepo{
		states: []*UserSkillState{weak, lapsed},
		active: 12,
		decay:  4,
		events: 9001,
		missed: []LessonStruggle{
			{LevelID: 12, LessonIndex: 2, Mistakes: 40, Learners: 9},
		},
	}
}

func TestAdminServiceStatsFromRepo(t *testing.T) {
	repo := newFakeAdminRepo()
	stats, err := NewAdminService(repo).Stats(context.Background())
	if err != nil {
		t.Fatalf("Stats: %v", err)
	}

	if stats.TotalLearners != 2 {
		t.Errorf("total learners: got %d, want 2", stats.TotalLearners)
	}
	if stats.Segments[SegmentWeak] != 1 {
		t.Errorf("weak segment: got %d, want 1", stats.Segments[SegmentWeak])
	}
	if stats.Segments[SegmentInactive] != 1 {
		t.Errorf("inactive segment: got %d, want 1", stats.Segments[SegmentInactive])
	}
	if stats.ActiveRecommendations != 12 || stats.DueRevisions != 4 {
		t.Errorf("insight counts: got %d active / %d due, want 12 / 4",
			stats.ActiveRecommendations, stats.DueRevisions)
	}
	if stats.TotalEvents != 9001 {
		t.Errorf("total events: got %d, want 9001", stats.TotalEvents)
	}

	for _, key := range []string{SegmentImproving, SegmentActive, SegmentWeak, SegmentInactive} {
		if _, ok := stats.Segments[key]; !ok {
			t.Errorf("segment %q missing from payload", key)
		}
	}
}

func TestAdminServiceCurriculumFromRepo(t *testing.T) {
	repo := newFakeAdminRepo()
	cur, err := NewAdminService(repo).Curriculum(context.Background())
	if err != nil {
		t.Fatalf("Curriculum: %v", err)
	}

	if len(cur.TopWeakSkills) == 0 {
		t.Fatal("expected at least one weak skill row")
	}
	if cur.TopWeakSkills[0].Tag != "ب" {
		t.Errorf("hardest skill: got %q, want %q", cur.TopWeakSkills[0].Tag, "ب")
	}
	if len(cur.TopMissedLessons) != 1 || cur.TopMissedLessons[0].LevelID != 12 {
		t.Errorf("missed lessons not passed through: %+v", cur.TopMissedLessons)
	}
}

// The panel polls every 30s and calls both endpoints each time; one snapshot
// must serve both so a left-open dashboard does not rescan on every request.
func TestAdminServiceCachesOneSnapshot(t *testing.T) {
	repo := newFakeAdminRepo()
	svc := NewAdminService(repo)

	for i := 0; i < 3; i++ {
		if _, err := svc.Stats(context.Background()); err != nil {
			t.Fatalf("Stats: %v", err)
		}
		if _, err := svc.Curriculum(context.Background()); err != nil {
			t.Fatalf("Curriculum: %v", err)
		}
	}

	if repo.scans != 1 {
		t.Errorf("collection scans: got %d, want 1 (cached)", repo.scans)
	}
}

func TestAdminPayloadJSONKeys(t *testing.T) {
	repo := newFakeAdminRepo()
	svc := NewAdminService(repo)

	stats, _ := svc.Stats(context.Background())
	blob, err := json.Marshal(stats)
	if err != nil {
		t.Fatalf("marshal stats: %v", err)
	}
	var got map[string]any
	if err := json.Unmarshal(blob, &got); err != nil {
		t.Fatalf("unmarshal stats: %v", err)
	}
	for _, key := range []string{
		"total_learners", "segments", "active_recommendations",
		"due_revisions", "avg_engagement", "avg_dropout_risk", "total_events",
	} {
		if _, ok := got[key]; !ok {
			t.Errorf("stats payload missing key %q", key)
		}
	}

	cur, _ := svc.Curriculum(context.Background())
	blob, _ = json.Marshal(cur)
	var curGot map[string]any
	if err := json.Unmarshal(blob, &curGot); err != nil {
		t.Fatalf("unmarshal curriculum: %v", err)
	}
	for _, key := range []string{"top_weak_skills", "top_missed_lessons"} {
		if _, ok := curGot[key]; !ok {
			t.Errorf("curriculum payload missing key %q", key)
		}
	}
}
