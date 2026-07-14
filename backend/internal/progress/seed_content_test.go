package progress

import "testing"

// TestSeedContentLoads guards the embed + parse path: a malformed chunk file
// must fail the build's test stage, never a production boot.
func TestSeedContentLoads(t *testing.T) {
	levels := SeedLevels()
	if len(levels) == 0 {
		t.Fatal("no levels loaded from embedded content")
	}
	chunks := SeedContentChunks()
	if len(chunks) == 0 {
		t.Fatal("no content chunks loaded")
	}
	for _, chunk := range chunks {
		if chunk.Schema != ContentChunkSchema {
			t.Errorf("%s: schema %q", chunk.File, chunk.Schema)
		}
		if len(chunk.Levels) == 0 {
			t.Errorf("%s: chunk has no levels", chunk.File)
		}
	}
}

// TestContentLintClean is the same gate as `make content-lint`, wired into
// `go test` so content regressions cannot merge.
func TestContentLintClean(t *testing.T) {
	issues := LintLevels(SeedLevels())
	for _, issue := range issues {
		t.Errorf("%s", issue)
	}
}

// TestCurriculumShape pins the Part-1 curriculum contract: 50 qaida levels,
// a certificate every 10th level, review+treasure every 5th, and the two
// coach-practice drills.
func TestCurriculumShape(t *testing.T) {
	levels := SeedLevels()

	byID := map[int]Level{}
	qaida := 0
	practice := 0
	for _, l := range levels {
		byID[l.ID] = l
		switch l.CourseType {
		case CourseQaida:
			qaida++
		case CoursePractice:
			practice++
		}
	}

	if qaida != 50 {
		t.Errorf("qaida levels = %d, want 50", qaida)
	}
	if practice < 2 {
		t.Errorf("practice drills = %d, want ≥ 2", practice)
	}
	for _, id := range []int{901, 902} {
		if _, ok := byID[id]; !ok {
			t.Errorf("coach practice level %d missing (coach.ts points at it)", id)
		}
	}

	// Review levels (every 5th, except checkpoints) carry a treasure reward.
	for id := 5; id <= 45; id += 10 {
		level, ok := byID[id]
		if !ok {
			continue
		}
		if level.UnlockReward == "" {
			t.Errorf("level %d: review level should carry a treasure unlock_reward", id)
		}
	}

	// Checkpoints (every 10th) end in a certificate and award a title.
	for id := 10; id <= 50; id += 10 {
		level, ok := byID[id]
		if !ok {
			continue
		}
		hasCert := false
		for _, lesson := range level.Lessons {
			if lesson.Component == "CertificateComponent" {
				hasCert = true
			}
		}
		if !hasCert {
			t.Errorf("level %d: checkpoint has no CertificateComponent", id)
		}
		if level.UnlockReward == "" {
			t.Errorf("level %d: checkpoint should award a title", id)
		}
	}

	// Difficulty never exceeds "medium" and eases in: section 1 is all easy.
	for _, l := range levels {
		if l.CourseType == CourseQaida && l.ID <= 10 && l.Difficulty != LevelEasy {
			t.Errorf("level %d: section 1 must be easy, got %s", l.ID, l.Difficulty)
		}
	}
}
