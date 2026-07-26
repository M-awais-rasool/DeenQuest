package infrastructure

import (
	"context"
	"strings"
	"testing"
)

func testClient() *Client {
	return NewClient(
		"https://api.alquran.cloud/v1",
		"https://cdn.islamic.network",
		"ar.alafasy", // configured default
		128,
	)
}

func TestGetSurahAudio_UsesTheRequestedReciter(t *testing.T) {
	audio, err := testClient().GetSurahAudio(context.Background(), 67, "ar.husary")
	if err != nil {
		t.Fatalf("GetSurahAudio: %v", err)
	}
	if audio.Reciter != "ar.husary" {
		t.Errorf("Reciter = %q, want ar.husary", audio.Reciter)
	}
	if !strings.Contains(audio.URL, "/ar.husary/") {
		t.Errorf("the chosen reciter must appear in the URL, got %q", audio.URL)
	}
	if strings.Contains(audio.URL, "ar.alafasy") {
		t.Errorf("the default reciter leaked into the URL: %q", audio.URL)
	}
}

func TestGetSurahAudio_EmptyReciterFallsBackToDefault(t *testing.T) {
	audio, err := testClient().GetSurahAudio(context.Background(), 67, "")
	if err != nil {
		t.Fatalf("GetSurahAudio: %v", err)
	}
	if audio.Reciter != "ar.alafasy" {
		t.Errorf("Reciter = %q, want the configured default ar.alafasy", audio.Reciter)
	}
	if !strings.Contains(audio.URL, "/ar.alafasy/") {
		t.Errorf("URL should use the default edition, got %q", audio.URL)
	}
}

func TestGetSurahAudio_RejectsInjectedReciter(t *testing.T) {
	// A malicious edition must not be able to redirect the audio path.
	audio, err := testClient().GetSurahAudio(context.Background(), 67, "../../evil")
	if err != nil {
		t.Fatalf("GetSurahAudio: %v", err)
	}
	if strings.Contains(audio.URL, "..") {
		t.Errorf("path traversal reached the URL: %q", audio.URL)
	}
	if audio.Reciter != "ar.alafasy" {
		t.Errorf("a rejected edition should fall back to the default, got %q", audio.Reciter)
	}
}

func TestGetSurahAudio_ValidatesSurahID(t *testing.T) {
	if _, err := testClient().GetSurahAudio(context.Background(), 200, "ar.husary"); err == nil {
		t.Error("surah 200 should be rejected")
	}
}

// ── per-reciter bitrate ──────────────────────────────────────────────────────

// perAyahBitrates mirrors what cdn.islamic.network actually publishes for
// per-ayah audio (verified 2026-07-26). The URL builder must pick from these,
// or playback 403s and the app goes silent with no error.
var perAyahBitrates = map[string][]int{
	"ar.alafasy":            {64, 128},
	"ar.abdulbasitmurattal": {64, 192}, // no 128
	"ar.husary":             {64, 128},
	"ar.minshawi":           {128},
}

func TestGetSurahAudio_PicksAPerAyahValidBitrate(t *testing.T) {
	client := testClient() // configured default is 128

	for edition, valid := range perAyahBitrates {
		audio, err := client.GetSurahAudio(context.Background(), 78, edition)
		if err != nil {
			t.Fatalf("GetSurahAudio(%s): %v", edition, err)
		}

		ok := false
		for _, br := range valid {
			if audio.Bitrate == br {
				ok = true
				break
			}
		}
		if !ok {
			t.Errorf("%s: bitrate %d is not published for per-ayah audio (available: %v) — playback would 403",
				edition, audio.Bitrate, valid)
		}
	}
}

// TestDerivedAyahURLKeepsTheChosenBitrate mirrors the client's rewrite
// (quranTrack.ts) to prove the URL the app actually plays is well formed.
func TestDerivedAyahURLKeepsTheChosenBitrate(t *testing.T) {
	audio, err := testClient().GetSurahAudio(context.Background(), 78, "ar.abdulbasitmurattal")
	if err != nil {
		t.Fatalf("GetSurahAudio: %v", err)
	}

	ayahURL := strings.Replace(audio.URL, "/audio-surah/", "/audio/", 1)
	if !strings.Contains(ayahURL, "/audio/192/ar.abdulbasitmurattal/") {
		t.Errorf("derived per-ayah URL = %q, want /audio/192/ar.abdulbasitmurattal/", ayahURL)
	}
	if strings.Contains(ayahURL, "/128/") {
		t.Error("128 kbps has no per-ayah audio for Abdul Basit; it must not be used")
	}
}
