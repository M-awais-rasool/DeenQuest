package application

import "sync"

type userLocks struct {
	mu    sync.Mutex
	locks map[string]*sync.Mutex
}

func newUserLocks() *userLocks {
	return &userLocks{locks: make(map[string]*sync.Mutex)}
}

func (l *userLocks) lock(userID string) func() {
	l.mu.Lock()
	m, ok := l.locks[userID]
	if !ok {
		m = &sync.Mutex{}
		l.locks[userID] = m
	}
	l.mu.Unlock()

	m.Lock()
	return m.Unlock
}
