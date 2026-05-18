package learningagent

import (
	"sync"
	"time"
)

type BufferedEvent struct {
	Type      string
	Payload   map[string]interface{}
	Timestamp time.Time
}

type userBuffer struct {
	events     []BufferedEvent
	firstEvent time.Time
	mu         sync.Mutex
}

type EventBuffer struct {
	maxSize   int
	window    time.Duration
	threshold int
	buffers   map[string]*userBuffer
	mu        sync.RWMutex
}

func NewEventBuffer(maxSize int, window time.Duration, threshold int) *EventBuffer {
	return &EventBuffer{
		maxSize:   maxSize,
		window:    window,
		threshold: threshold,
		buffers:   make(map[string]*userBuffer),
	}
}

func (b *EventBuffer) Add(userID string, eventType string, payload map[string]interface{}) ([]BufferedEvent, bool) {
	b.mu.Lock()
	ub, exists := b.buffers[userID]
	if !exists {
		ub = &userBuffer{
			events:     make([]BufferedEvent, 0, b.maxSize),
			firstEvent: time.Now(),
		}
		b.buffers[userID] = ub
	}
	b.mu.Unlock()

	ub.mu.Lock()
	defer ub.mu.Unlock()

	ub.events = append(ub.events, BufferedEvent{
		Type:      eventType,
		Payload:   payload,
		Timestamp: time.Now(),
	})

	if len(ub.events) >= b.threshold {
		events := make([]BufferedEvent, len(ub.events))
		copy(events, ub.events)
		ub.events = nil
		ub.firstEvent = time.Now()
		return events, true
	}

	if time.Since(ub.firstEvent) > b.window && len(ub.events) > 0 {
		events := make([]BufferedEvent, len(ub.events))
		copy(events, ub.events)
		ub.events = nil
		ub.firstEvent = time.Now()
		return events, true
	}

	return nil, false
}
