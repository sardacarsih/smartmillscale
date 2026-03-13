package entities

import (
	"time"

	"github.com/google/uuid"
)

// WeighingType represents the type of weighing operation
type WeighingType string

const (
	WeighingTypeGross WeighingType = "GROSS"
	WeighingTypeTare  WeighingType = "TARE"
	WeighingTypeNet   WeighingType = "NET"
)

// SyncStatus represents the synchronization status
type SyncStatus string

const (
	SyncStatusPending SyncStatus = "PENDING"
	SyncStatusSynced  SyncStatus = "SYNCED"
	SyncStatusFailed  SyncStatus = "FAILED"
)

// Timbangan represents a weighing record - pure domain entity
type Timbangan struct {
	// Primary Key
	IDLocal uuid.UUID

	// Server sync ID (null until synced)
	IDPusat *uuid.UUID

	// Business Data
	NomorKendaraan string
	BeratKotor     int
	BeratBersih    int

	// Enhanced TIMBANGAN fields
	WeighingType WeighingType
	QualityGrade string
	SupplierID   *uuid.UUID
	Notes        string
	OperatorID   uuid.UUID
	SessionID    *uuid.UUID
	VehicleType  string
	TareWeight   int
	PhotoPath    string
	IsBatch      bool
	BatchNumber  string

	// Timestamps
	Tanggal   time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
	SyncedAt  *time.Time

	// Sync Metadata
	StatusSync   SyncStatus
	SyncVersion  int
	ErrorMessage *string

	// Device Metadata
	DeviceID string
}

// NewTimbangan creates a new Timbangan entity with proper initialization
func NewTimbangan(nomorKendaraan string, beratKotor, beratBersih int, operatorID uuid.UUID, deviceID string) *Timbangan {
	now := time.Now()
	return &Timbangan{
		IDLocal:       uuid.New(),
		NomorKendaraan: nomorKendaraan,
		BeratKotor:    beratKotor,
		BeratBersih:   beratBersih,
		WeighingType:  WeighingTypeNet,
		OperatorID:    operatorID,
		DeviceID:      deviceID,
		Tanggal:       now,
		CreatedAt:     now,
		UpdatedAt:     now,
		StatusSync:    SyncStatusPending,
		SyncVersion:   1,
	}
}

// MarkAsSynced marks the timbangan as successfully synced
func (t *Timbangan) MarkAsSynced(serverID uuid.UUID) {
	t.IDPusat = &serverID
	t.StatusSync = SyncStatusSynced
	t.SyncedAt = &[]time.Time{time.Now()}[0]
	t.ErrorMessage = nil
}

// MarkAsSyncFailed marks the timbangan as failed to sync
func (t *Timbangan) MarkAsSyncFailed(err error) {
	t.StatusSync = SyncStatusFailed
	if err != nil {
		errMsg := err.Error()
		t.ErrorMessage = &errMsg
	}
}

// IsPendingSync checks if the timbangan is pending synchronization
func (t *Timbangan) IsPendingSync() bool {
	return t.StatusSync == SyncStatusPending
}

// IsSynced checks if the timbangan is successfully synced
func (t *Timbangan) IsSynced() bool {
	return t.StatusSync == SyncStatusSynced
}

// UpdateWeight updates the weight information
func (t *Timbangan) UpdateWeight(beratKotor, beratBersih int, weighingType WeighingType) {
	t.BeratKotor = beratKotor
	t.BeratBersih = beratBersih
	t.WeighingType = weighingType
	t.UpdatedAt = time.Now()
}

// SetSession sets the weighing session
func (t *Timbangan) SetSession(sessionID uuid.UUID) {
	t.SessionID = &sessionID
}

// SetQualityInfo sets quality-related information
func (t *Timbangan) SetQualityInfo(grade string, notes string) {
	t.QualityGrade = grade
	t.Notes = notes
	t.UpdatedAt = time.Now()
}