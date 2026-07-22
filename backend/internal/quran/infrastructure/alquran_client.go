package infrastructure

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/chawais/deenquest/backend/internal/quran/domain"

	"golang.org/x/sync/errgroup"
)

const (
	DefaultBaseURL      = "https://api.alquran.cloud/v1"
	DefaultAudioCDNURL  = "https://cdn.islamic.network"
	DefaultAudioEdition = "ar.alafasy"
	DefaultAudioBitrate = 128
)

type Client struct {
	baseURL      string
	audioCDNURL  string
	audioEdition string
	audioBitrate int
	httpClient   *http.Client
}

func NewClient(baseURL, audioCDNURL, audioEdition string, audioBitrate int) *Client {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if baseURL == "" {
		baseURL = DefaultBaseURL
	}
	audioCDNURL = strings.TrimRight(strings.TrimSpace(audioCDNURL), "/")
	if audioCDNURL == "" {
		audioCDNURL = DefaultAudioCDNURL
	}
	audioEdition = strings.TrimSpace(audioEdition)
	if audioEdition == "" {
		audioEdition = DefaultAudioEdition
	}
	if audioBitrate <= 0 {
		audioBitrate = DefaultAudioBitrate
	}

	return &Client{
		baseURL:      baseURL,
		audioCDNURL:  audioCDNURL,
		audioEdition: audioEdition,
		audioBitrate: audioBitrate,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

type apiEnvelope[T any] struct {
	Code   int    `json:"code"`
	Status string `json:"status"`
	Data   T      `json:"data"`
}

type apiSurahSummary struct {
	Number                 int    `json:"number"`
	Name                   string `json:"name"`
	EnglishName            string `json:"englishName"`
	EnglishNameTranslation string `json:"englishNameTranslation"`
	NumberOfAyahs          int    `json:"numberOfAyahs"`
	RevelationType         string `json:"revelationType"`
}

type apiAyah struct {
	Number        int    `json:"number"`
	Text          string `json:"text"`
	NumberInSurah int    `json:"numberInSurah"`
	Juz           int    `json:"juz"`
	Page          int    `json:"page"`
}

type apiSurahDetail struct {
	apiSurahSummary
	Ayahs []apiAyah `json:"ayahs"`
}

func (c *Client) GetSurahList(ctx context.Context) ([]domain.SurahSummary, error) {
	var envelope apiEnvelope[[]apiSurahSummary]
	if err := c.get(ctx, "/surah", &envelope); err != nil {
		return nil, err
	}

	surahs := make([]domain.SurahSummary, 0, len(envelope.Data))
	for _, s := range envelope.Data {
		surahs = append(surahs, mapSurahSummary(s))
	}
	return surahs, nil
}

func (c *Client) GetSurahByID(ctx context.Context, id int, translationEdition string) (*domain.SurahDetail, error) {
	if err := domain.ValidateSurahID(id); err != nil {
		return nil, err
	}

	const edition = "ar.alafasy"
	translationEdition = strings.TrimSpace(translationEdition)

	var (
		envelope     apiEnvelope[apiSurahDetail]
		translations map[int]string
	)
	g, gctx := errgroup.WithContext(ctx)
	g.Go(func() error {
		return c.get(gctx, fmt.Sprintf("/surah/%d/%s", id, edition), &envelope)
	})
	if translationEdition != "" {
		g.Go(func() error {
			t, err := c.getSurahTranslation(gctx, id, translationEdition)
			if err != nil {
				return err
			}
			translations = t
			return nil
		})
	}
	if err := g.Wait(); err != nil {
		return nil, err
	}

	detail := mapSurahDetail(envelope.Data)
	if translationEdition == "" {
		return detail, nil
	}

	for i := range detail.Ayahs {
		detail.Ayahs[i].Translation = translations[detail.Ayahs[i].NumberInSurah]
	}
	detail.TranslationEdition = translationEdition
	return detail, nil
}

func (c *Client) GetSurahAudio(_ context.Context, id int) (*domain.SurahAudio, error) {
	if err := domain.ValidateSurahID(id); err != nil {
		return nil, err
	}

	return &domain.SurahAudio{
		SurahID: id,
		Reciter: c.audioEdition,
		Bitrate: c.audioBitrate,
		URL:     fmt.Sprintf("%s/quran/audio-surah/%d/%s/%d.mp3", c.audioCDNURL, c.audioBitrate, c.audioEdition, id),
		Source:  "alquran.cloud-cdn",
	}, nil
}

func (c *Client) getSurahTranslation(ctx context.Context, id int, edition string) (map[int]string, error) {
	var envelope apiEnvelope[apiSurahDetail]
	if err := c.get(ctx, fmt.Sprintf("/surah/%d/%s", id, url.PathEscape(edition)), &envelope); err != nil {
		return nil, err
	}

	translations := make(map[int]string, len(envelope.Data.Ayahs))
	for _, ayah := range envelope.Data.Ayahs {
		translations[ayah.NumberInSurah] = ayah.Text
	}
	return translations, nil
}

func (c *Client) get(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
	if err != nil {
		return fmt.Errorf("create alquran request: %w", err)
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call alquran API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10<<20))
	if err != nil {
		return fmt.Errorf("read alquran response: %w", err)
	}

	if resp.StatusCode == http.StatusNotFound {
		return domain.ErrSurahNotFound
	}
	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("alquran API returned %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("decode alquran response: %w", err)
	}
	return nil
}

func mapSurahSummary(s apiSurahSummary) domain.SurahSummary {
	return domain.SurahSummary{
		ID:                     s.Number,
		Number:                 s.Number,
		Name:                   s.Name,
		EnglishName:            s.EnglishName,
		EnglishNameTranslation: s.EnglishNameTranslation,
		NumberOfAyahs:          s.NumberOfAyahs,
		RevelationType:         s.RevelationType,
	}
}

func mapSurahDetail(s apiSurahDetail) *domain.SurahDetail {
	ayahs := make([]domain.Ayah, 0, len(s.Ayahs))
	for _, a := range s.Ayahs {
		ayahs = append(ayahs, domain.Ayah{
			Number:        a.Number,
			NumberInSurah: a.NumberInSurah,
			Juz:           a.Juz,
			Page:          a.Page,
			Text:          a.Text,
		})
	}

	return &domain.SurahDetail{
		ID:                     s.Number,
		Number:                 s.Number,
		Name:                   s.Name,
		EnglishName:            s.EnglishName,
		EnglishNameTranslation: s.EnglishNameTranslation,
		NumberOfAyahs:          s.NumberOfAyahs,
		RevelationType:         s.RevelationType,
		Ayahs:                  ayahs,
	}
}
