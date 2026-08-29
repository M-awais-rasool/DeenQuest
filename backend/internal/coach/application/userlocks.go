package application

import "sync"

// userLocks serialises insight reconciliation per user.
//
// Reconciling is a read-modify-write over one user's whole insight set:
// evaluate the rules against their current state, then upsert the results and
// expire whatever is no longer emitted. Two of those interleaving on the same
// user lets the slower one write conclusions drawn from state the faster one
// has already replaced.
//
// The path that matters is completing a practice. It marks an insight done,
// clears the counters that raised it, and re-evaluates — while a background
// evaluation from the user's last telemetry batch may still be in flight. If
// that evaluation read the counters before they were cleared and writes after
// the completion, the finished insight comes back as active, and the guard in
// CompletePractice that refuses to pay XP twice reads exactly that field.
//
// A per-user lock is enough because there is one API container. If that ever
// stops being true this becomes a distributed lock, or the reconcile becomes a
// conditional write — but not before.
type userLocks struct {
	mu    sync.Mutex
	locks map[string]*sync.Mutex
}

func newUserLocks() *userLocks {
	return &userLocks{locks: make(map[string]*sync.Mutex)}
}

// lock blocks until the caller owns userID, and returns the release function.
//
// Entries are never evicted. One mutex per user who has been active since the
// process started is a few dozen bytes each — cheaper than the bookkeeping that
// reclaiming them safely would need.
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
