package service

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
)

// WeightMonitoringService handles real-time weight monitoring and event broadcasting
type WeightMonitoringService struct {
	db           *gorm.DB
	ctx          context.Context
	serialReader serial.SerialReaderInterface

	// State management
	isMonitoring  bool
	currentWeight WeightReading
	mu            sync.RWMutex

	// Subscribers for real-time events
	subscribers  map[string]chan WeightEvent
	subscriberMu sync.RWMutex

	// Connection recovery
	connectionRecoveryActive bool
	lastConnectionCheck      time.Time
	consecutiveFailures      int
	recoveryTicker           *time.Ticker
}

// WeightReading represents current weight reading
type WeightReading struct {
	Weight    int       `json:"weight"`
	Stable    bool      `json:"stable"`
	Unit      string    `json:"unit"`
	Timestamp time.Time `json:"timestamp"`
}

// WeightEvent represents weight change event
type WeightEvent struct {
	Type      string         `json:"type"` // "weight_change", "stability_change", "connection_change"
	Reading   WeightReading  `json:"reading"`
	Previous  *WeightReading `json:"previous,omitempty"`
	Timestamp time.Time      `json:"timestamp"`
}

// WeightHistoryEntry represents a historical weight reading
type WeightHistoryEntry struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Weight    int       `gorm:"not null" json:"weight"`
	Stable    bool      `gorm:"not null" json:"stable"`
	Unit      string    `gorm:"type:varchar(10);not null" json:"unit"`
	Timestamp time.Time `gorm:"not null;index" json:"timestamp"`
}

// TableName specifies the table name for WeightHistoryEntry
func (WeightHistoryEntry) TableName() string {
	return "weight_history"
}

// NewWeightMonitoringService creates a new weight monitoring service
func NewWeightMonitoringService(db *gorm.DB, ctx context.Context) *WeightMonitoringService {
	return &WeightMonitoringService{
		db:          db,
		ctx:         ctx,
		subscribers: make(map[string]chan WeightEvent),
	}
}

// SetSerialReader sets the serial reader for weight monitoring
func (s *WeightMonitoringService) SetSerialReader(reader serial.SerialReaderInterface) {
	s.serialReader = reader
}

// StartSerialReader starts the configured serial reader without enabling monitoring.
func (s *WeightMonitoringService) StartSerialReader() error {
	s.mu.RLock()
	reader := s.serialReader
	s.mu.RUnlock()

	if reader == nil {
		return fmt.Errorf("serial reader not configured")
	}
	if reader.IsConnected() {
		return nil
	}

	if err := reader.Start(); err != nil {
		return fmt.Errorf("failed to start serial reader: %w", err)
	}
	return nil
}

// StopSerialReader stops the configured serial reader without changing monitoring state.
func (s *WeightMonitoringService) StopSerialReader() error {
	s.mu.RLock()
	reader := s.serialReader
	s.mu.RUnlock()

	if reader == nil {
		return nil
	}
	if !reader.IsConnected() {
		return nil
	}

	if err := reader.Stop(); err != nil {
		return fmt.Errorf("failed to stop serial reader: %w", err)
	}
	return nil
}

// StartMonitoring begins real-time weight monitoring
func (s *WeightMonitoringService) StartMonitoring() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.isMonitoring {
		return fmt.Errorf("monitoring is already active")
	}

	if s.serialReader == nil {
		return fmt.Errorf("serial reader not configured")
	}

	s.isMonitoring = true
	s.consecutiveFailures = 0
	s.lastConnectionCheck = time.Now()

	// Start the serial reader if not already running
	if !s.serialReader.IsConnected() {
		if err := s.serialReader.Start(); err != nil {
			s.isMonitoring = false
			return fmt.Errorf("failed to start serial reader: %w", err)
		}
	}

	// Start monitoring goroutines
	go s.monitorWeightChanges()
	go s.monitorConnectionStatus()
	go s.startConnectionRecovery()

	log.Println("Weight monitoring started with connection recovery")

	// Broadcast initial status
	s.broadcastEvent(WeightEvent{
		Type:      "connection_change",
		Reading:   s.currentWeight,
		Timestamp: time.Now(),
	})

	return nil
}

// StopMonitoring stops real-time weight monitoring
func (s *WeightMonitoringService) StopMonitoring() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.isMonitoring {
		return nil
	}

	s.isMonitoring = false

	// Stop connection recovery
	if s.recoveryTicker != nil {
		s.recoveryTicker.Stop()
		s.recoveryTicker = nil
	}
	s.connectionRecoveryActive = false

	// Stop the serial reader
	if s.serialReader != nil {
		if err := s.serialReader.Stop(); err != nil {
			log.Printf("Warning: failed to stop serial reader: %v", err)
		}
	}

	log.Println("Weight monitoring stopped")

	// Broadcast final status
	s.broadcastEvent(WeightEvent{
		Type:      "connection_change",
		Reading:   s.currentWeight,
		Timestamp: time.Now(),
	})

	return nil
}

// IsMonitoring returns the current monitoring status
func (s *WeightMonitoringService) IsMonitoring() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isMonitoring
}

// GetCurrentWeight returns the current weight reading
func (s *WeightMonitoringService) GetCurrentWeight() WeightReading {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.currentWeight
}

// IsConnected returns the connection status
func (s *WeightMonitoringService) IsConnected() bool {
	if s.serialReader == nil {
		return false
	}
	return s.serialReader.IsConnected()
}

// Subscribe to weight events
func (s *WeightMonitoringService) Subscribe(id string) <-chan WeightEvent {
	s.subscriberMu.Lock()
	defer s.subscriberMu.Unlock()

	// Close existing channel if any to prevent leaks
	if oldChan, exists := s.subscribers[id]; exists {
		close(oldChan)
	}

	eventChan := make(chan WeightEvent, 100)
	s.subscribers[id] = eventChan

	// Send current status immediately
	go func() {
		eventChan <- WeightEvent{
			Type:      "connection_change",
			Reading:   s.GetCurrentWeight(),
			Timestamp: time.Now(),
		}
	}()

	return eventChan
}

// Unsubscribe from weight events
func (s *WeightMonitoringService) Unsubscribe(id string) {
	s.subscriberMu.Lock()
	defer s.subscriberMu.Unlock()

	if eventChan, exists := s.subscribers[id]; exists {
		close(eventChan)
		delete(s.subscribers, id)
	}
}

// GetWeightHistory retrieves weight history
func (s *WeightMonitoringService) GetWeightHistory(limit int, since time.Time) ([]WeightHistoryEntry, error) {
	var history []WeightHistoryEntry

	query := s.db.WithContext(s.ctx).Order("timestamp DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	if !since.IsZero() {
		query = query.Where("timestamp >= ?", since)
	}

	if err := query.Find(&history).Error; err != nil {
		return nil, fmt.Errorf("failed to get weight history: %w", err)
	}

	return history, nil
}

// SaveWeightToHistory saves current weight to history
func (s *WeightMonitoringService) SaveWeightToHistory() error {
	s.mu.RLock()
	reading := s.currentWeight
	s.mu.RUnlock()

	entry := WeightHistoryEntry{
		Weight:    reading.Weight,
		Stable:    reading.Stable,
		Unit:      reading.Unit,
		Timestamp: reading.Timestamp,
	}

	if err := s.db.WithContext(s.ctx).Create(&entry).Error; err != nil {
		return fmt.Errorf("failed to save weight history: %w", err)
	}

	// Cleanup old history (keep only last 10000 entries)
	if err := s.cleanupOldHistory(); err != nil {
		log.Printf("Warning: failed to cleanup old history: %v", err)
	}

	return nil
}

// Private methods

func (s *WeightMonitoringService) monitorWeightChanges() {
	dataChan := s.serialReader.GetDataChannel()
	reconnectChan := s.serialReader.GetReconnectChannel()

	log.Printf("📡 [WeightMonitoring] Monitoring weight changes on channel %p", dataChan)

	for s.isMonitoring {
		select {
		case weightData, ok := <-dataChan:
			if !ok {
				// This should NEVER happen with current implementation
				log.Println("❌ [WeightMonitoring] ERROR: Weight data channel unexpectedly closed!")
				log.Println("⚠️  [WeightMonitoring] This indicates a serious bug in the serial reader")

				// Attempt recovery by re-fetching channel after a delay
				log.Println("🔄 [WeightMonitoring] Attempting to recover in 1 second...")
				time.Sleep(1 * time.Second)

				newChan := s.serialReader.GetDataChannel()
				if newChan != dataChan {
					log.Printf("✅ [WeightMonitoring] Channel changed from %p to %p, resuming monitoring", dataChan, newChan)
					dataChan = newChan
					continue
				} else {
					log.Println("🛑 [WeightMonitoring] Channel unchanged, stopping monitoring")
					return
				}
			}

			s.handleWeightData(weightData)

		case <-reconnectChan:
			// Reconnection event detected
			log.Println("🔄 [WeightMonitoring] Reconnection event detected")
			log.Println("✅ [WeightMonitoring] Serial connection reestablished, continuing monitoring")
			// Data channel remains the same, no action needed
			// This case ensures we're aware of reconnection events for logging/debugging

		case <-s.ctx.Done():
			return
		}
	}
}

func (s *WeightMonitoringService) monitorConnectionStatus() {
	errorChan := s.serialReader.GetErrorChannel()

	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for s.isMonitoring {
		select {
		case err, ok := <-errorChan:
			if !ok {
				return
			}

			// Handle nil error as reconnection success
			if err == nil {
				log.Println("Serial connection reestablished successfully")
				s.handleConnectionRecovery()
			} else {
				log.Printf("Serial error: %v", err)
				s.handleConnectionError(err)
			}

		case <-ticker.C:
			// Periodic connection check
			if s.serialReader != nil && !s.serialReader.IsConnected() {
				s.handleConnectionError(fmt.Errorf("connection lost"))
			}

		case <-s.ctx.Done():
			return
		}
	}
}

func (s *WeightMonitoringService) handleWeightData(weightData serial.WeightData) {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Validate data consistency
	if weightData.Weight < 0 {
		log.Printf("WARNING: Negative weight received: %d", weightData.Weight)
		return
	}

	previous := s.currentWeight
	current := WeightReading{
		Weight:    weightData.Weight,
		Stable:    weightData.Stable,
		Unit:      weightData.Unit,
		Timestamp: weightData.Timestamp,
	}

	// Check for unusual weight jumps (data consistency validation)
	if previous.Timestamp.IsZero() {
		// First reading, skip jump detection
	} else {
		weightDiff := current.Weight - previous.Weight
		if weightDiff < 0 {
			weightDiff = -weightDiff // Absolute value
		}

		// If weight change is too drastic (>50kg in 1 second), log warning
		timeDiff := current.Timestamp.Sub(previous.Timestamp)
		if weightDiff > 5000 && timeDiff < time.Second {
			log.Printf("WARNING: Unusual weight jump detected: %d -> %d in %v",
				previous.Weight, current.Weight, timeDiff)
		}
	}

	// Check if weight actually changed or stability changed
	weightChanged := previous.Weight != current.Weight
	stabilityChanged := previous.Stable != current.Stable

	if weightChanged || stabilityChanged {
		s.currentWeight = current

		// Determine event type
		eventType := "weight_change"
		if stabilityChanged && !weightChanged {
			eventType = "stability_change"
		}

		// Broadcast event
		event := WeightEvent{
			Type:      eventType,
			Reading:   current,
			Previous:  &previous,
			Timestamp: time.Now(),
		}

		s.broadcastEvent(event)

		// TODO: Automatic history saving disabled - data real-time hanya untuk ditampilkan
		// Penyimpanan hasil timbangan harus melalui aksi user
		/*
			// Save to history if stable
			if current.Stable {
				go s.SaveWeightToHistory()
			}
		*/
	}
}

func (s *WeightMonitoringService) handleConnectionError(err error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	previous := s.currentWeight
	s.currentWeight = WeightReading{
		Weight:    0,
		Stable:    false,
		Unit:      "kg",
		Timestamp: time.Now(),
	}

	// Broadcast connection change event
	event := WeightEvent{
		Type:      "connection_change",
		Reading:   s.currentWeight,
		Previous:  &previous,
		Timestamp: time.Now(),
	}

	s.broadcastEvent(event)
}

func (s *WeightMonitoringService) handleConnectionRecovery() {
	s.mu.Lock()
	defer s.mu.Unlock()

	previous := s.currentWeight
	// Don't change weight reading on recovery, just update connection status

	// Broadcast connection recovery event
	event := WeightEvent{
		Type:      "connection_change",
		Reading:   s.currentWeight,
		Previous:  &previous,
		Timestamp: time.Now(),
	}

	s.broadcastEvent(event)
}

func (s *WeightMonitoringService) broadcastEvent(event WeightEvent) {
	s.subscriberMu.Lock()
	defer s.subscriberMu.Unlock()

	// Send to internal subscribers
	for id, eventChan := range s.subscribers {
		select {
		case eventChan <- event:
			// Event sent successfully
		default:
			// Channel is full, remove subscriber
			log.Printf("Removing subscriber %s due to full channel", id)
			close(eventChan)
			delete(s.subscribers, id)
		}
	}
}

func (s *WeightMonitoringService) cleanupOldHistory() error {
	// Keep only the last 10000 records
	var oldestID uuid.UUID

	err := s.db.WithContext(s.ctx).
		Raw(`
			SELECT id FROM weight_history
			ORDER BY timestamp DESC
			LIMIT 1 OFFSET 10000
		`).Scan(&oldestID).Error

	if err != nil {
		return err
	}

	if oldestID != uuid.Nil {
		return s.db.WithContext(s.ctx).
			Where("timestamp < (SELECT timestamp FROM weight_history WHERE id = ?)", oldestID).
			Delete(&WeightHistoryEntry{}).Error
	}

	return nil
}

// ============================================
// CONNECTION RECOVERY FUNCTIONS
// ============================================

// startConnectionRecovery begins connection recovery monitoring
func (s *WeightMonitoringService) startConnectionRecovery() {
	s.mu.Lock()
	if s.connectionRecoveryActive {
		s.mu.Unlock()
		return
	}
	s.connectionRecoveryActive = true
	s.mu.Unlock()

	// Check every 5 seconds with exponential backoff
	s.recoveryTicker = time.NewTicker(5 * time.Second)
	defer s.recoveryTicker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-s.recoveryTicker.C:
			if !s.isMonitoring {
				return
			}

			if !s.checkAndRecoverConnection() {
				// If recovery failed, increase backoff
				s.consecutiveFailures++
				backoffDuration := time.Duration(s.consecutiveFailures) * 2 * time.Second
				if backoffDuration > 30*time.Second {
					backoffDuration = 30 * time.Second
				}

				log.Printf("Connection recovery failed %d times, waiting %v before next attempt",
					s.consecutiveFailures, backoffDuration)

				// Temporarily adjust ticker for backoff
				s.recoveryTicker.Reset(backoffDuration)
			} else {
				// Recovery successful, reset failures and restore normal interval
				s.consecutiveFailures = 0
				s.recoveryTicker.Reset(5 * time.Second)
			}
		}
	}
}

// checkAndRecoverConnection attempts to recover connection if needed
func (s *WeightMonitoringService) checkAndRecoverConnection() bool {
	now := time.Now()

	s.mu.Lock()
	isMonitoring := s.isMonitoring
	s.mu.Unlock()

	if !isMonitoring {
		return true // Not monitoring, so connection is "good"
	}

	// Check if serial reader is connected
	isConnected := s.serialReader.IsConnected()

	if !isConnected {
		log.Printf("Connection lost, attempting recovery...")

		// Attempt recovery
		if err := s.serialReader.Start(); err != nil {
			log.Printf("Connection recovery failed: %v", err)
			s.lastConnectionCheck = now
			return false
		}

		log.Println("Connection recovery successful")

		// Broadcast recovery event
		s.broadcastEvent(WeightEvent{
			Type:      "connection_change",
			Reading:   s.currentWeight,
			Timestamp: now,
		})
	}

	s.lastConnectionCheck = now
	return true
}
