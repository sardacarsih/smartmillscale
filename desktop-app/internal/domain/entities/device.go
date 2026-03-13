package entities

import (
	"time"

	"github.com/google/uuid"
)

// DeviceInfo represents device configuration - pure domain entity
type DeviceInfo struct {
	ID         uuid.UUID
	DeviceName string
	Location   string
	APIKey     string
	ServerURL  string
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
	LastSeenAt *time.Time
}

// NewDeviceInfo creates a new DeviceInfo entity
func NewDeviceInfo(deviceName, location, serverURL string) *DeviceInfo {
	now := time.Now()
	return &DeviceInfo{
		ID:         uuid.New(),
		DeviceName: deviceName,
		Location:   location,
		ServerURL:  serverURL,
		APIKey:     uuid.New().String(), // Generate API key
		IsActive:   true,
		CreatedAt:  now,
		UpdatedAt:  now,
	}
}

// UpdateLastSeen updates the last seen timestamp
func (d *DeviceInfo) UpdateLastSeen() {
	now := time.Now()
	d.LastSeenAt = &now
	d.UpdatedAt = now
}

// Activate activates the device
func (d *DeviceInfo) Activate() {
	d.IsActive = true
	d.UpdatedAt = time.Now()
}

// Deactivate deactivates the device
func (d *DeviceInfo) Deactivate() {
	d.IsActive = false
	d.UpdatedAt = time.Now()
}

// UpdateLocation updates the device location
func (d *DeviceInfo) UpdateLocation(location string) {
	d.Location = location
	d.UpdatedAt = time.Now()
}

// UpdateServer updates the server configuration
func (d *DeviceInfo) UpdateServer(serverURL string) {
	d.ServerURL = serverURL
	d.UpdatedAt = time.Now()
}

// RegenerateAPIKey generates a new API key
func (d *DeviceInfo) RegenerateAPIKey() {
	d.APIKey = uuid.New().String()
	d.UpdatedAt = time.Now()
}

// IsOnline checks if device is considered online (last seen within 5 minutes)
func (d *DeviceInfo) IsOnline() bool {
	if d.LastSeenAt == nil {
		return false
	}
	return time.Since(*d.LastSeenAt) <= 5*time.Minute
}

// WeighingSession represents operator sessions for tracking performance
type WeighingSession struct {
	ID            uuid.UUID
	OperatorID    uuid.UUID
	SessionStart  time.Time
	SessionEnd    *time.Time
	TotalWeighings int
	TotalWeight   int
	AverageWeight float64
	BreakCount    int
	LastBreakAt   *time.Time
	Notes         string
	DeviceID      string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// NewWeighingSession creates a new weighing session
func NewWeighingSession(operatorID uuid.UUID, deviceID string) *WeighingSession {
	now := time.Now()
	return &WeighingSession{
		ID:            uuid.New(),
		OperatorID:    operatorID,
		SessionStart:  now,
		DeviceID:      deviceID,
		TotalWeighings: 0,
		TotalWeight:   0,
		BreakCount:    0,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
}

// EndSession ends the weighing session
func (ws *WeighingSession) EndSession() {
	now := time.Now()
	ws.SessionEnd = &now
	ws.UpdatedAt = now
}

// AddWeighing adds a weighing record to the session
func (ws *WeighingSession) AddWeighing(weight int) {
	ws.TotalWeighings++
	ws.TotalWeight += weight
	if ws.TotalWeighings > 0 {
		ws.AverageWeight = float64(ws.TotalWeight) / float64(ws.TotalWeighings)
	}
	ws.UpdatedAt = time.Now()
}

// TakeBreak records a break in the session
func (ws *WeighingSession) TakeBreak() {
	now := time.Now()
	ws.BreakCount++
	ws.LastBreakAt = &now
	ws.UpdatedAt = now
}

// IsActive checks if the session is currently active
func (ws *WeighingSession) IsActive() bool {
	return ws.SessionEnd == nil
}

// GetDuration returns the session duration
func (ws *WeighingSession) GetDuration() time.Duration {
	end := time.Now()
	if ws.SessionEnd != nil {
		end = *ws.SessionEnd
	}
	return end.Sub(ws.SessionStart)
}

// UpdateNotes updates session notes
func (ws *WeighingSession) UpdateNotes(notes string) {
	ws.Notes = notes
	ws.UpdatedAt = time.Now()
}