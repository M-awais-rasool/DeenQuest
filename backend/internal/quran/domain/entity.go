package domain

import (
	"errors"
	"strings"
)

var (
	ErrInvalidSurahID = errors.New("invalid surah id")
	ErrSurahNotFound  = errors.New("surah not found")
)

type SurahSummary struct {
	ID                     int    `json:"id"`
	Number                 int    `json:"number"`
	Name                   string `json:"name"`
	EnglishName            string `json:"english_name"`
	EnglishNameTranslation string `json:"english_name_translation"`
	NumberOfAyahs          int    `json:"number_of_ayahs"`
	RevelationType         string `json:"revelation_type"`
}

type Ayah struct {
	Number        int    `json:"number"`
	NumberInSurah int    `json:"number_in_surah"`
	Juz           int    `json:"juz"`
	Page          int    `json:"page"`
	Text          string `json:"text"`
	Translation   string `json:"translation,omitempty"`
}

type SurahDetail struct {
	ID                     int    `json:"id"`
	Number                 int    `json:"number"`
	Name                   string `json:"name"`
	EnglishName            string `json:"english_name"`
	EnglishNameTranslation string `json:"english_name_translation"`
	NumberOfAyahs          int    `json:"number_of_ayahs"`
	RevelationType         string `json:"revelation_type"`
	TranslationEdition     string `json:"translation_edition,omitempty"`
	Ayahs                  []Ayah `json:"ayahs"`
}

type SurahAudio struct {
	SurahID int    `json:"surah_id"`
	Reciter string `json:"reciter"`
	Bitrate int    `json:"bitrate"`
	URL     string `json:"url"`
	Source  string `json:"source"`
}

func ValidateSurahID(id int) error {
	if id < 1 || id > 114 {
		return ErrInvalidSurahID
	}
	return nil
}

var audioBitrateByEdition = map[string]int{
	"ar.alafasy":            128,
	"ar.abdulbasitmurattal": 192,
	"ar.husary":             128,
	"ar.minshawi":           128,
}

func AudioBitrateFor(edition string, fallback int) int {
	if br, ok := audioBitrateByEdition[NormalizeReciter(edition)]; ok {
		return br
	}
	return fallback
}

func NormalizeReciter(edition string) string {
	edition = strings.ToLower(strings.TrimSpace(edition))
	if edition == "" || len(edition) > 48 || strings.Contains(edition, "..") {
		return ""
	}
	for _, r := range edition {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r == '.', r == '_', r == '-':
		default:
			return ""
		}
	}
	return edition
}
