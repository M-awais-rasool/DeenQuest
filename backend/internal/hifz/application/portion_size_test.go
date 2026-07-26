package application

import (
	"testing"

	"github.com/chawais/deenquest/backend/internal/hifz/domain"
)

// The guarantee these tests protect: portion IDs embed their ayah range, so if
// the plan's segmentation size were edited later, every sealed portion would get
// a new ID and the learner's progress would silently vanish. The size is
// therefore frozen onto the enrollment.

func autoPlan(size int) *domain.Plan {
	return &domain.Plan{
		ID:    "al-mulk",
		Scope: domain.PlanScope{SurahIDs: []int{67}},
		Segmentation: domain.Segmentation{
			Mode:            domain.SegmentAuto,
			AyahsPerPortion: size,
		},
	}
}

func TestPortionSize_PrefersTheFrozenEnrollmentValue(t *testing.T) {
	enrollment := &domain.Enrollment{AyahsPerPortion: 3}

	// The plan was later re-segmented to 6; the enrollment must win.
	if got := portionSize(enrollment, autoPlan(6)); got != 3 {
		t.Errorf("portionSize = %d, want 3 — an edited plan must not re-cut portions", got)
	}
}

func TestPortionSize_FallsBackToThePlanForLegacyEnrollments(t *testing.T) {
	// Enrollments written before the field existed have a zero value; they keep
	// reproducing the boundaries the plan originally produced.
	if got := portionSize(&domain.Enrollment{}, autoPlan(4)); got != 4 {
		t.Errorf("portionSize = %d, want 4 for a legacy enrollment", got)
	}
}

func TestPortionSize_HandlesNilArguments(t *testing.T) {
	if got := portionSize(nil, autoPlan(5)); got != 5 {
		t.Errorf("portionSize(nil enrollment) = %d, want 5", got)
	}
	if got := portionSize(&domain.Enrollment{}, nil); got != 0 {
		t.Errorf("portionSize(nil plan) = %d, want 0", got)
	}
}

func TestFrozenSizeKeepsPortionIDsStable(t *testing.T) {
	// Al-Mulk's 30 ayahs are long enough that 3-ayah and 6-ayah segmentation
	// genuinely differ — a 4-ayah surah would split identically either way and
	// the test would prove nothing.
	meta := map[int]domain.SurahMeta{
		67: {ID: 67, Name: "الملك", EnglishName: "Al-Mulk", AyahCount: 30},
	}

	original := autoPlan(3)
	enrollment := &domain.Enrollment{AyahsPerPortion: 3}

	before, err := domain.BuildPortions(*original, meta, portionSize(enrollment, original))
	if err != nil {
		t.Fatalf("BuildPortions (before): %v", err)
	}

	// An admin re-segments the plan to 6 ayahs per portion.
	edited := autoPlan(6)
	after, err := domain.BuildPortions(*edited, meta, portionSize(enrollment, edited))
	if err != nil {
		t.Fatalf("BuildPortions (after): %v", err)
	}

	if len(before) != len(after) {
		t.Fatalf("portion count changed after the plan was edited: %d → %d",
			len(before), len(after))
	}
	for i := range before {
		if before[i].ID != after[i].ID {
			t.Errorf("portion %d id changed: %q → %q — progress would be orphaned",
				i, before[i].ID, after[i].ID)
		}
	}

	// Prove the fixture is meaningful: without the freeze the edit really would
	// have produced different IDs.
	unfrozen, err := domain.BuildPortions(*edited, meta, edited.Segmentation.AyahsPerPortion)
	if err != nil {
		t.Fatalf("BuildPortions (unfrozen): %v", err)
	}
	if len(unfrozen) == len(before) {
		t.Fatalf("fixture is vacuous: 3 and 6 ayahs segment this surah into the same %d portions",
			len(before))
	}
}
