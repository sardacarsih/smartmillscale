package service

import (
	"context"
	"sync"
	"testing"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
	"gorm.io/gorm"
)

// MockSerialReader for testing
type MockSerialReader struct {
	dataChan  chan serial.WeightData
	errorChan chan error
}

func (m *MockSerialReader) Start() error                             { return nil }
func (m *MockSerialReader) Stop() error                              { return nil }
func (m *MockSerialReader) IsConnected() bool                        { return true }
func (m *MockSerialReader) GetDataChannel() <-chan serial.WeightData { return m.dataChan }
func (m *MockSerialReader) GetErrorChannel() <-chan error            { return m.errorChan }
func (m *MockSerialReader) SendCommand(cmd string) error             { return nil }

func TestBroadcastEventRaceCondition(t *testing.T) {
	// Setup
	svc := NewWeightMonitoringService(&gorm.DB{}, context.Background())

	// Subscribe with a small buffer to easily fill it up
	subID := "test-subscriber"
	svc.Subscribe(subID)

	// Fill the channel
	svc.subscriberMu.RLock()
	ch := svc.subscribers[subID]
	svc.subscriberMu.RUnlock()

	for i := 0; i < 100; i++ {
		select {
		case ch <- WeightEvent{}:
		default:
		}
	}

	// Run concurrent broadcasts to trigger the race condition
	var wg sync.WaitGroup
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			// This should trigger the "channel full" logic in broadcastEvent
			// which attempts to close the channel and delete the subscriber.
			// If RLock is used, multiple goroutines can enter the "close" block simultaneously.
			svc.broadcastEvent(WeightEvent{Type: "test"})
		}()
	}

	wg.Wait()
}
