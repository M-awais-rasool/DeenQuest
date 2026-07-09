package prayer

import "testing"

func toMin(hhmm string) int {
	if len(hhmm) != 5 {
		return -1
	}
	return (int(hhmm[0]-'0')*10+int(hhmm[1]-'0'))*60 + int(hhmm[3]-'0')*10 + int(hhmm[4]-'0')
}

// Karachi, 21 Jun 2026 (tz +5) — times must be ordered through the day and
// land in sane ranges.
func TestCompute_OrderedAndSane(t *testing.T) {
	got := Compute(2026, 6, 21, 24.86, 67.00, 5, Default())

	seq := []string{got.Fajr, got.Sunrise, got.Dhuhr, got.Asr, got.Maghrib, got.Isha}
	for i := 1; i < len(seq); i++ {
		if toMin(seq[i]) <= toMin(seq[i-1]) {
			t.Fatalf("prayer times out of order at %d: %v", i, seq)
		}
	}
	if toMin(got.Fajr) < toMin("02:00") || toMin(got.Fajr) > toMin("06:30") {
		t.Fatalf("Fajr out of expected range: %s", got.Fajr)
	}
	if toMin(got.Dhuhr) < toMin("11:30") || toMin(got.Dhuhr) > toMin("13:30") {
		t.Fatalf("Dhuhr out of expected range: %s", got.Dhuhr)
	}
}
