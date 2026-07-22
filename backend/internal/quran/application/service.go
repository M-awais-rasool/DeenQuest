package application

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/chawais/deenquest/backend/internal/quran/domain"

	"github.com/chawais/deenquest/backend/internal/platform/cache"
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

type memEntry struct {
	value     []byte
	expiresAt time.Time
}

type Service struct {
	provider Provider
	redis    *cache.RedisClient

	mu  sync.RWMutex
	mem map[string]memEntry
}

func NewService(provider Provider, redisClient *cache.RedisClient) *Service {
	return &Service{
		provider: provider,
		redis:    redisClient,
		mem:      make(map[string]memEntry),
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
	s.mu.RLock()
	entry, ok := s.mem[key]
	s.mu.RUnlock()
	if ok && time.Now().Before(entry.expiresAt) {
		return json.Unmarshal(entry.value, dest) == nil
	}

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
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}

	s.mu.Lock()
	s.mem[key] = memEntry{value: raw, expiresAt: time.Now().Add(ttl)}
	s.mu.Unlock()

	if s.redis == nil {
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
