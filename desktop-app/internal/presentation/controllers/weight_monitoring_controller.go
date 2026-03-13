package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// WeightMonitoringController handles real-time weight monitoring operations
type WeightMonitoringController struct {
	monitoringService *service.WeightMonitoringService
	ctx               context.Context
	subscribers       map[string]chan string
}

// NewWeightMonitoringController creates a new weight monitoring controller
func NewWeightMonitoringController(monitoringService *service.WeightMonitoringService) *WeightMonitoringController {
	return &WeightMonitoringController{
		monitoringService: monitoringService,
		subscribers:       make(map[string]chan string),
	}
}

// SetContext sets the Wails context for the controller
func (c *WeightMonitoringController) SetContext(ctx context.Context) {
	c.ctx = ctx
}

// StartMonitoring begins real-time weight monitoring
func (c *WeightMonitoringController) StartMonitoring() error {
	if err := c.monitoringService.StartMonitoring(); err != nil {
		return fmt.Errorf("failed to start monitoring: %w", err)
	}

	// Start event broadcasting to frontend
	go c.broadcastEvents()

	return nil
}

// StopMonitoring stops real-time weight monitoring
func (c *WeightMonitoringController) StopMonitoring() error {
	log.Println("🛑 [Controller] StopMonitoring called!")
	return c.monitoringService.StopMonitoring()
}

// IsMonitoring returns the current monitoring status
func (c *WeightMonitoringController) IsMonitoring() bool {
	return c.monitoringService.IsMonitoring()
}

// GetCurrentWeight returns the current weight reading
func (c *WeightMonitoringController) GetCurrentWeight() (*service.WeightReading, error) {
	reading := c.monitoringService.GetCurrentWeight()
	return &reading, nil
}

// IsConnected returns the connection status
func (c *WeightMonitoringController) IsConnected() bool {
	return c.monitoringService.IsConnected()
}

// GetWeightHistory retrieves weight history
func (c *WeightMonitoringController) GetWeightHistory(limit int, sinceTimestamp int64) ([]service.WeightHistoryEntry, error) {
	var since time.Time
	if sinceTimestamp > 0 {
		since = time.Unix(sinceTimestamp, 0)
	}

	return c.monitoringService.GetWeightHistory(limit, since)
}

// SubscriptionResponse represents the response for subscription operations
type SubscriptionResponse struct {
	Subscribed   bool   `json:"subscribed,omitempty"`
	Unsubscribed bool   `json:"unsubscribed,omitempty"`
	SubscriberID string `json:"subscriberID"`
}

// SubscribeToWeightEvents subscribes to weight change events
func (c *WeightMonitoringController) SubscribeToWeightEvents(subscriberID string) (*SubscriptionResponse, error) {
	eventChan := c.monitoringService.Subscribe(subscriberID)

	// Start goroutine to forward events to this subscriber
	go func() {
		for event := range eventChan {
			eventJSON, err := json.Marshal(event)
			if err != nil {
				continue
			}

			// Send event to subscriber
			if subscriberChan, exists := c.subscribers[subscriberID]; exists {
				select {
				case subscriberChan <- string(eventJSON):
					// Event sent successfully
				default:
					// Channel is full, skip this event
				}
			}
		}

		// Clean up subscriber channel
		if subscriberChan, exists := c.subscribers[subscriberID]; exists {
			close(subscriberChan)
			delete(c.subscribers, subscriberID)
		}
	}()

	return &SubscriptionResponse{
		Subscribed:   true,
		SubscriberID: subscriberID,
	}, nil
}

// UnsubscribeFromWeightEvents unsubscribes from weight change events
func (c *WeightMonitoringController) UnsubscribeFromWeightEvents(subscriberID string) (*SubscriptionResponse, error) {
	c.monitoringService.Unsubscribe(subscriberID)

	// Clean up subscriber channel
	if subscriberChan, exists := c.subscribers[subscriberID]; exists {
		close(subscriberChan)
		delete(c.subscribers, subscriberID)
	}

	return &SubscriptionResponse{
		Unsubscribed: true,
		SubscriberID: subscriberID,
	}, nil
}

// GetNextWeightEvent gets the next weight event for a subscriber (blocking)
func (c *WeightMonitoringController) GetNextWeightEvent(subscriberID string) (*service.WeightEvent, error) {
	subscriberChan, exists := c.subscribers[subscriberID]
	if !exists {
		return nil, fmt.Errorf("subscriber not found")
	}

	select {
	case eventJSON := <-subscriberChan:
		var event service.WeightEvent
		if err := json.Unmarshal([]byte(eventJSON), &event); err != nil {
			return nil, fmt.Errorf("failed to unmarshal event: %w", err)
		}
		return &event, nil
	case <-time.After(30 * time.Second):
		// Timeout after 30 seconds
		return nil, fmt.Errorf("timeout waiting for event")
	}
}

// Private methods

func (c *WeightMonitoringController) broadcastEvents() {
	// Subscribe to weight monitoring events
	subscriberID := "controller-broadcaster"
	eventChan := c.monitoringService.Subscribe(subscriberID)

	defer c.monitoringService.Unsubscribe(subscriberID)

	for event := range eventChan {
		// Broadcast event to all connected subscribers via Wails runtime
		if c.monitoringService != nil && c.ctx != nil {
			eventJSON, err := json.Marshal(event)
			if err != nil {
				log.Printf("Warning: failed to marshal weight event in controller: %v", err)
				continue
			}

			// Use safe event emission with context validation
			if c.validateWailsContext(c.ctx) {
				defer func() {
					if r := recover(); r != nil {
						log.Printf("Error: panic during event emission for 'weight_event': %v", r)
					}
				}()
				runtime.EventsEmit(c.ctx, "weight_event", string(eventJSON))
			} else {
				log.Printf("Warning: failed to emit weight event to frontend from controller - invalid context")
			}
		}
	}
}

// validateWailsContext checks if the context is valid for Wails runtime operations
func (c *WeightMonitoringController) validateWailsContext(ctx context.Context) bool {
	if ctx == nil {
		log.Println("Warning: nil context provided to Wails runtime operation")
		return false
	}

	// Check if context is cancelled
	select {
	case <-ctx.Done():
		log.Printf("Warning: cancelled context provided to Wails runtime operation: %v", ctx.Err())
		return false
	default:
		// Context is still valid
	}

	return true
}
