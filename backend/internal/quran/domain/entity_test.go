package domain

import "testing"

func TestNormalizeReciter_AcceptsRealEditions(t *testing.T) {
	for _, edition := range []string{
		"ar.alafasy",
		"ar.abdulbasitmurattal",
		"ar.husary",
		"ar.minshawi",
	} {
		if got := NormalizeReciter(edition); got != edition {
			t.Errorf("NormalizeReciter(%q) = %q, want it unchanged", edition, got)
		}
	}
}

func TestNormalizeReciter_TrimsAndLowercases(t *testing.T) {
	if got := NormalizeReciter("  AR.Husary "); got != "ar.husary" {
		t.Errorf("NormalizeReciter = %q, want ar.husary", got)
	}
}

func TestNormalizeReciter_RejectsPathInjection(t *testing.T) {
	// The edition is interpolated into a CDN URL path, so a slash or a dot-dot
	// would let a caller point the audio request somewhere else entirely.
	bad := []string{
		"../../etc/passwd",
		"ar.alafasy/../../x",
		"ar.alafasy/128",
		"ar alafasy",
		"ar.alafasy?x=1",
		"ar.alafasy#frag",
		"http://evil.test/a.mp3",
		"ar.alafasy%2f..",
		"",
		"   ",
	}
	for _, edition := range bad {
		if got := NormalizeReciter(edition); got != "" {
			t.Errorf("NormalizeReciter(%q) = %q, want \"\" (rejected)", edition, got)
		}
	}
}

func TestNormalizeReciter_RejectsOverlongInput(t *testing.T) {
	long := ""
	for i := 0; i < 60; i++ {
		long += "a"
	}
	if got := NormalizeReciter(long); got != "" {
		t.Errorf("an over-long edition should be rejected, got %q", got)
	}
}
