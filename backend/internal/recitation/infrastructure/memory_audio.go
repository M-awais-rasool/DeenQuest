package infrastructure

import (
	"context"
	"sync"

	"github.com/chawais/deenquest/backend/internal/recitation/domain"
)

type MemoryAudioStore struct {
	mu    sync.Mutex
	clips map[string][]byte
}

func NewMemoryAudioStore() *MemoryAudioStore {
	return &MemoryAudioStore{clips: make(map[string][]byte)}
}

func (s *MemoryAudioStore) Put(_ context.Context, id string, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.clips[id] = data
	return nil
}

func (s *MemoryAudioStore) Get(_ context.Context, id string) ([]byte, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	data, ok := s.clips[id]
	if !ok {
		return nil, domain.ErrJobNotFound
	}
	return data, nil
}

func (s *MemoryAudioStore) Delete(_ context.Context, id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.clips, id)
	return nil
}
