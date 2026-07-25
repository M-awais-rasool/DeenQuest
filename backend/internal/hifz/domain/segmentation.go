package domain

import (
	"fmt"
	"sort"
)

type SurahMeta struct {
	ID          int
	Name        string // Arabic
	EnglishName string
	AyahCount   int
	Juz         int // first juz the surah appears in (used for juz-scoped plans)
}

var JuzSurahs = map[int][]int{
	29: {67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77},
	30: {
		78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96,
		97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112,
		113, 114,
	},
}

// ScopeSurahIDs resolves a plan's scope to an ordered surah list.
func ScopeSurahIDs(scope PlanScope) ([]int, error) {
	if len(scope.SurahIDs) > 0 {
		ids := append([]int(nil), scope.SurahIDs...)
		return ids, nil
	}
	if scope.Juz > 0 {
		ids, ok := JuzSurahs[scope.Juz]
		if !ok {
			return nil, fmt.Errorf("%w: juz %d is not a supported plan scope", ErrInvalidScope, scope.Juz)
		}
		return append([]int(nil), ids...), nil
	}
	return nil, ErrInvalidScope
}

func BuildPortions(plan Plan, metaByID map[int]SurahMeta, ayahsPerPortion int) ([]Portion, error) {
	if plan.Segmentation.Mode == SegmentManual && len(plan.Segmentation.Ranges) > 0 {
		return buildManualPortions(plan, metaByID)
	}

	size := ayahsPerPortion
	if size <= 0 {
		size = plan.Segmentation.AyahsPerPortion
	}
	if size <= 0 {
		size = 4
	}

	surahIDs, err := ScopeSurahIDs(plan.Scope)
	if err != nil {
		return nil, err
	}

	var portions []Portion
	idx := 0
	for _, sid := range surahIDs {
		meta, ok := metaByID[sid]
		if !ok || meta.AyahCount <= 0 {
			continue // surah metadata unavailable — skip rather than emit a bad range
		}
		for start := 1; start <= meta.AyahCount; start += size {
			end := start + size - 1
			if end > meta.AyahCount {
				end = meta.AyahCount
			}
			// Absorb a 1-ayah tail into the previous portion rather than leaving a
			// stub — a lone ayah is not a memorization session.
			if end == meta.AyahCount && start == end && len(portions) > 0 &&
				portions[len(portions)-1].SurahID == sid {
				last := &portions[len(portions)-1]
				last.AyahEnd = end
				last.ID = PortionID(plan.ID, sid, last.AyahStart, last.AyahEnd)
				last.Label = portionLabel(meta, last.AyahStart, last.AyahEnd)
				continue
			}
			portions = append(portions, Portion{
				ID:         PortionID(plan.ID, sid, start, end),
				PlanID:     plan.ID,
				SurahID:    sid,
				SurahName:  meta.Name,
				AyahStart:  start,
				AyahEnd:    end,
				OrderIndex: idx,
				Label:      portionLabel(meta, start, end),
			})
			idx++
		}
	}

	if len(portions) == 0 {
		return nil, ErrNoPortions
	}
	return portions, nil
}

func buildManualPortions(plan Plan, metaByID map[int]SurahMeta) ([]Portion, error) {
	ranges := append([]ManualRange(nil), plan.Segmentation.Ranges...)
	sort.SliceStable(ranges, func(i, j int) bool {
		if ranges[i].SurahID != ranges[j].SurahID {
			return ranges[i].SurahID < ranges[j].SurahID
		}
		return ranges[i].AyahStart < ranges[j].AyahStart
	})

	var portions []Portion
	for idx, r := range ranges {
		if r.AyahStart < 1 || r.AyahEnd < r.AyahStart {
			continue
		}
		meta := metaByID[r.SurahID]
		if meta.AyahCount > 0 && r.AyahEnd > meta.AyahCount {
			r.AyahEnd = meta.AyahCount
		}
		label := r.Label
		if label == "" {
			label = portionLabel(meta, r.AyahStart, r.AyahEnd)
		}
		portions = append(portions, Portion{
			ID:         PortionID(plan.ID, r.SurahID, r.AyahStart, r.AyahEnd),
			PlanID:     plan.ID,
			SurahID:    r.SurahID,
			SurahName:  meta.Name,
			AyahStart:  r.AyahStart,
			AyahEnd:    r.AyahEnd,
			OrderIndex: idx,
			Label:      label,
		})
	}
	if len(portions) == 0 {
		return nil, ErrNoPortions
	}
	return portions, nil
}

func portionLabel(meta SurahMeta, start, end int) string {
	name := meta.EnglishName
	if name == "" {
		name = fmt.Sprintf("Surah %d", meta.ID)
	}
	if start == end {
		return fmt.Sprintf("%s · %d", name, start)
	}
	return fmt.Sprintf("%s · %d–%d", name, start, end)
}

// TotalAyahs sums the ayahs covered by a portion list.
func TotalAyahs(portions []Portion) int {
	total := 0
	for _, p := range portions {
		total += p.AyahCount()
	}
	return total
}
