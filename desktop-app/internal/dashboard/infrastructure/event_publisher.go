package infrastructure

import (
	"context"
	"fmt"
	"sync"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// eventPublisher implements domain.EventPublisher interface
type eventPublisher struct {
	mu         sync.RWMutex
	handlers   map[string][]domain.EventHandler
	asyncQueue chan *eventJob
}

// eventJob represents an async event job
type eventJob struct {
	ctx   context.Context
	event *domain.Event
}

// NewEventPublisher creates a new event publisher
func NewEventPublisher(workerCount int) domain.EventPublisher {
	publisher := &eventPublisher{
		handlers:   make(map[string][]domain.EventHandler),
		asyncQueue: make(chan *eventJob, 100),
	}

	// Start worker goroutines for async events
	for i := 0; i < workerCount; i++ {
		go publisher.worker()
	}

	return publisher
}

// Publish publishes an event synchronously
func (p *eventPublisher) Publish(ctx context.Context, event *domain.Event) error {
	p.mu.RLock()
	handlers, exists := p.handlers[event.Type]
	p.mu.RUnlock()

	if !exists || len(handlers) == 0 {
		// No handlers registered for this event type
		return nil
	}

	// Execute all handlers synchronously
	var errs []error
	for _, handler := range handlers {
		if err := handler(ctx, event); err != nil {
			errs = append(errs, err)
		}
	}

	if len(errs) > 0 {
		return fmt.Errorf("event publishing errors: %v", errs)
	}

	return nil
}

// PublishAsync publishes an event asynchronously
func (p *eventPublisher) PublishAsync(ctx context.Context, event *domain.Event) error {
	select {
	case p.asyncQueue <- &eventJob{ctx: ctx, event: event}:
		return nil
	default:
		return fmt.Errorf("async queue is full")
	}
}

// Subscribe registers a handler for a specific event pattern
func (p *eventPublisher) Subscribe(pattern string, handler domain.EventHandler) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.handlers[pattern] = append(p.handlers[pattern], handler)
	return nil
}

// Unsubscribe removes all handlers for a pattern
func (p *eventPublisher) Unsubscribe(pattern string) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	delete(p.handlers, pattern)
	return nil
}

// worker processes async events
func (p *eventPublisher) worker() {
	for job := range p.asyncQueue {
		// Ignore errors in async mode
		_ = p.Publish(job.ctx, job.event)
	}
}

// matchPattern checks if event type matches pattern
// Supports wildcard patterns like "dashboard.*"
func matchPattern(eventType, pattern string) bool {
	if pattern == "*" {
		return true
	}

	// Check for wildcard at the end
	if len(pattern) > 0 && pattern[len(pattern)-1] == '*' {
		prefix := pattern[:len(pattern)-1]
		return len(eventType) >= len(prefix) && eventType[:len(prefix)] == prefix
	}

	return eventType == pattern
}

// InMemoryEventBus is a simple in-memory event bus
type InMemoryEventBus struct {
	mu        sync.RWMutex
	subscribers map[string][]chan *domain.Event
}

// NewInMemoryEventBus creates a new in-memory event bus
func NewInMemoryEventBus() *InMemoryEventBus {
	return &InMemoryEventBus{
		subscribers: make(map[string][]chan *domain.Event),
	}
}

// Subscribe to events
func (bus *InMemoryEventBus) Subscribe(eventType string) <-chan *domain.Event {
	bus.mu.Lock()
	defer bus.mu.Unlock()

	ch := make(chan *domain.Event, 10)
	bus.subscribers[eventType] = append(bus.subscribers[eventType], ch)
	return ch
}

// Publish event to all subscribers
func (bus *InMemoryEventBus) Publish(event *domain.Event) {
	bus.mu.RLock()
	defer bus.mu.RUnlock()

	// Send to exact match subscribers
	if channels, ok := bus.subscribers[event.Type]; ok {
		for _, ch := range channels {
			select {
			case ch <- event:
			default:
				// Channel is full, skip
			}
		}
	}

	// Send to wildcard subscribers
	if channels, ok := bus.subscribers["*"]; ok {
		for _, ch := range channels {
			select {
			case ch <- event:
			default:
				// Channel is full, skip
			}
		}
	}
}
