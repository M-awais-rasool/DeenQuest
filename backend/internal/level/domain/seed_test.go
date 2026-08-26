package domain

import "testing"

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

const (
	qaidaSection = 4
	qaidaLevels  = 20
)

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

	if qaida != qaidaLevels {
		t.Errorf("qaida levels = %d, want %d", qaida, qaidaLevels)
	}
	if practice < 2 {
		t.Errorf("practice drills = %d, want ≥ 2", practice)
	}
	for _, id := range []int{901, 902} {
		if _, ok := byID[id]; !ok {
			t.Errorf("coach practice level %d missing (coach.ts points at it)", id)
		}
	}

	for id := qaidaSection - 2; id <= qaidaLevels; id += qaidaSection {
		lvl, ok := byID[id]
		if !ok {
			continue
		}
		if lvl.UnlockReward == "" {
			t.Errorf("level %d: mid-section level should carry a treasure unlock_reward", id)
		}
	}

	for id := qaidaSection; id <= qaidaLevels; id += qaidaSection {
		lvl, ok := byID[id]
		if !ok {
			continue
		}
		hasCert := false
		for _, lesson := range lvl.Lessons {
			if lesson.Component == "CertificateComponent" {
				hasCert = true
			}
		}
		if !hasCert {
			t.Errorf("level %d: checkpoint has no CertificateComponent", id)
		}
		if lvl.UnlockReward == "" {
			t.Errorf("level %d: checkpoint should award a title", id)
		}
	}

	for _, l := range levels {
		if l.CourseType == CourseQaida && l.ID <= qaidaSection && l.Difficulty != LevelEasy {
			t.Errorf("level %d: section 1 must be easy, got %s", l.ID, l.Difficulty)
		}
	}

	if demo, ok := byID[902]; ok {
		for i, lesson := range demo.Lessons {
			if lesson.Component != EngineComponent {
				t.Errorf("level 902 lesson %d: component %q, want %q (DSL-authored)", i+1, lesson.Component, EngineComponent)
			}
		}
	}
}

const (
	namazIDFloor    = 100
	namazLevelCount = 24
)

func TestNamazCurriculumShape(t *testing.T) {
	levels := SeedLevels()

	byID := map[int]Level{}
	namaz := 0
	for _, l := range levels {
		byID[l.ID] = l
		if l.CourseType == CourseNamaz {
			namaz++
		}
	}

	if namaz != namazLevelCount {
		t.Errorf("namaz levels = %d, want %d", namaz, namazLevelCount)
	}

	for id := namazIDFloor + 1; id <= namazIDFloor+namazLevelCount; id++ {
		lvl, ok := byID[id]
		if !ok {
			t.Errorf("namaz level %d missing", id)
			continue
		}
		if lvl.CourseType != CourseNamaz {
			t.Errorf("level %d: course_type = %q, want %q", id, lvl.CourseType, CourseNamaz)
		}
	}

	lastID := namazIDFloor + namazLevelCount
	if lvl, ok := byID[lastID]; ok {
		hasCert := false
		for _, lesson := range lvl.Lessons {
			if lesson.Component == "CertificateComponent" {
				hasCert = true
			}
		}
		if !hasCert {
			t.Errorf("level %d: final namaz level has no CertificateComponent", lastID)
		}
	}
}
