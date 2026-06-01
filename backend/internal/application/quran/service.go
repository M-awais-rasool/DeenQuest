package quran

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	domain "github.com/chawais/talent-flow/backend/internal/domain/quran"
	"github.com/chawais/talent-flow/backend/internal/infrastructure/cache"
)

const (
	surahListTTL   = time.Hour
	surahDetailTTL = 7 * 24 * time.Hour
	audioURLTTL    = 7 * 24 * time.Hour
)

type Provider interface {
	GetSurahList(ctx context.Context) ([]domain.SurahSummary, error)
	GetSurahByID(ctx context.Context, id int, translationEdition string) (*domain.SurahDetail, error)
	GetSurahAudio(ctx context.Context, id int) (*domain.SurahAudio, error)
}

type Service struct {
	provider Provider
	redis    *cache.RedisClient
}

func NewService(provider Provider, redisClient *cache.RedisClient) *Service {
	return &Service{
		provider: provider,
		redis:    redisClient,
	}
}

func (s *Service) GetSurahList(ctx context.Context) ([]domain.SurahSummary, error) {
	const key = "quran:surahs:v1"

	var cached []domain.SurahSummary
	if s.getCached(ctx, key, &cached) {
		return cached, nil
	}

	surahs, err := s.provider.GetSurahList(ctx)
	if err != nil {
		return nil, err
	}
	s.setCached(ctx, key, surahs, surahListTTL)
	return surahs, nil
}

func (s *Service) GetSurahByID(ctx context.Context, id int, translationEdition string) (*domain.SurahDetail, error) {
	if err := domain.ValidateSurahID(id); err != nil {
		return nil, err
	}

	translationEdition = strings.TrimSpace(translationEdition)
	key := fmt.Sprintf("quran:surah:%d:%s:v2", id, cacheToken(translationEdition))

	var cached domain.SurahDetail
	if s.getCached(ctx, key, &cached) {
		return &cached, nil
	}

	surah, err := s.provider.GetSurahByID(ctx, id, translationEdition)
	if err != nil {
		return nil, err
	}
	s.setCached(ctx, key, surah, surahDetailTTL)
	return surah, nil
}

func (s *Service) GetSurahAudio(ctx context.Context, id int) (*domain.SurahAudio, error) {
	if err := domain.ValidateSurahID(id); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("quran:surah:%d:audio:v1", id)
	var cached domain.SurahAudio
	if s.getCached(ctx, key, &cached) {
		return &cached, nil
	}

	audio, err := s.provider.GetSurahAudio(ctx, id)
	if err != nil {
		return nil, err
	}
	s.setCached(ctx, key, audio, audioURLTTL)
	return audio, nil
}

func (s *Service) getCached(ctx context.Context, key string, dest any) bool {
	if s.redis == nil {
		return false
	}

	raw, err := s.redis.Client.Get(ctx, key).Bytes()
	if err != nil {
		return false
	}
	return json.Unmarshal(raw, dest) == nil
}

func (s *Service) setCached(ctx context.Context, key string, value any, ttl time.Duration) {
	if s.redis == nil {
		return
	}

	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	_ = s.redis.Client.Set(ctx, key, raw, ttl).Err()
}

func cacheToken(value string) string {
	if value == "" {
		return "none"
	}
	replacer := strings.NewReplacer(":", "_", "/", "_", "\\", "_", " ", "_")
	return replacer.Replace(strings.ToLower(value))
}
