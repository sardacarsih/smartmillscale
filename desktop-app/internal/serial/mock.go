package serial

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"github.com/yourusername/gosmartmillscale/shared/types"
)

// MockSerialReader simulates a weighing scale for testing
type MockSerialReader struct {
	config        types.WeighingConfig
	dataChan      chan WeightData
	errorChan     chan error
	reconnectChan chan struct{} // Notifies subscribers of reconnection events
	stopChan      chan struct{}
	running       bool
}

// NewMockSerialReader creates a mock serial reader for testing
func NewMockSerialReader(config types.WeighingConfig) *MockSerialReader {
	return &MockSerialReader{
		config:        config,
		dataChan:      make(chan WeightData, 10),
		errorChan:     make(chan error, 10),
		reconnectChan: make(chan struct{}, 10), // Buffered to prevent blocking
		stopChan:      make(chan struct{}),
		running:       false,
	}
}

// Connect simulates connection
func (m *MockSerialReader) Connect() error {
	log.Println("[MOCK] Connecting to virtual weighing scale...")
	time.Sleep(500 * time.Millisecond)
	log.Println("[MOCK] Connected to virtual weighing scale")
	return nil
}

// Disconnect simulates disconnection
func (m *MockSerialReader) Disconnect() error {
	log.Println("[MOCK] Disconnecting from virtual weighing scale...")
	return nil
}

// IsConnected always returns true for mock
func (m *MockSerialReader) IsConnected() bool {
	return m.running
}

// Start begins generating mock weight data
func (m *MockSerialReader) Start() error {
	if err := m.Connect(); err != nil {
		return err
	}

	m.running = true
	go m.generateMockData()

	log.Println("[MOCK] Mock serial reader started")
	return nil
}

// Stop stops generating mock data
func (m *MockSerialReader) Stop() error {
	m.running = false
	close(m.stopChan)
	return m.Disconnect()
}

// GetDataChannel returns the data channel
func (m *MockSerialReader) GetDataChannel() <-chan WeightData {
	return m.dataChan
}

// GetErrorChannel returns the error channel
func (m *MockSerialReader) GetErrorChannel() <-chan error {
	return m.errorChan
}

// GetReconnectChannel returns the channel for reconnection notifications
func (m *MockSerialReader) GetReconnectChannel() <-chan struct{} {
	return m.reconnectChan
}

// generateMockData generates random weight readings
func (m *MockSerialReader) generateMockData() {
	// Use configured interval from .env (default: 1 second)
	interval := time.Duration(m.config.MockInterval) * time.Millisecond
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	rand.Seed(time.Now().UnixNano())

	// Get configured weight range from .env
	minWeight := m.config.MockMinWeight   // centesimal (e.g., 0)
	maxWeight := m.config.MockMaxWeight   // centesimal (e.g., 1,500,000 = 15000 kg)
	variance := m.config.MockVariance     // centesimal (e.g., 5000 = 50 kg)

	log.Printf("[MOCK] Configuration: interval=%v, minWeight=%d, maxWeight=%d, variance=%d",
		interval, minWeight, maxWeight, variance)

	// Simulate weighing cycle: unstable -> stable -> reset
	var currentWeight int
	var cyclePhase int // 0=idle, 1=loading, 2=stable
	var tickCounter int

	// Calculate ticks based on configured interval
	// We want: ~2s idle, ~2s unstable, ~5s stable
	idleTicks := int(2000 / m.config.MockInterval)      // 2 seconds
	unstableTicks := int(2000 / m.config.MockInterval)  // 2 seconds
	stableTicks := int(5000 / m.config.MockInterval)    // 5 seconds

	for {
		select {
		case <-m.stopChan:
			return
		case <-ticker.C:
			var data WeightData
			tickCounter++

			switch cyclePhase {
			case 0: // Idle/Reset - minimum weight
				currentWeight = minWeight
				data = WeightData{
					Weight:    minWeight,
					Unit:      "kg",
					Stable:    true,
					Timestamp: time.Now(),
				}
				// Stay idle for configured time then start loading
				if tickCounter > idleTicks {
					cyclePhase = 1
					tickCounter = 0
					// Generate random weight between min and max
					weightRange := maxWeight - minWeight
					if weightRange > 0 {
						currentWeight = minWeight + rand.Intn(weightRange)
					} else {
						currentWeight = maxWeight
					}
				}

			case 1: // Loading - unstable weight
				// Add fluctuation based on configured variance
				// Variance defines the ± fluctuation range
				fluctuation := rand.Intn(variance*2) - variance
				displayWeight := currentWeight + fluctuation
				if displayWeight < minWeight {
					displayWeight = minWeight
				}
				if displayWeight > maxWeight {
					displayWeight = maxWeight
				}

				data = WeightData{
					Weight:    displayWeight,
					Unit:      "kg",
					Stable:    false,
					Timestamp: time.Now(),
				}

				// Stay unstable for configured time then stabilize
				if tickCounter > unstableTicks {
					cyclePhase = 2
					tickCounter = 0
				}

			case 2: // Stable weight
				data = WeightData{
					Weight:    currentWeight,
					Unit:      "kg",
					Stable:    true,
					Timestamp: time.Now(),
				}

				// Stay stable for configured time then reset
				if tickCounter > stableTicks {
					cyclePhase = 0
					tickCounter = 0
				}
			}

			// Send data
			select {
			case m.dataChan <- data:
				// Log based on interval - every 10th tick or every second, whichever is less frequent
				logInterval := 10
				if m.config.MockInterval >= 100 {
					logInterval = max(1, 1000/m.config.MockInterval)
				}
				if tickCounter%logInterval == 0 {
					log.Printf("[MOCK] Weight: %.2f kg (Stable: %v, Phase: %d)",
						float64(data.Weight)/100.0, data.Stable, cyclePhase)
				}
			default:
				// Channel full
			}

			// Occasionally simulate an error (very rare, 0.1% chance)
			if rand.Float32() < 0.001 {
				select {
				case m.errorChan <- fmt.Errorf("mock communication error"):
				default:
				}
			}
		}
	}
}

// max returns the larger of two integers
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
