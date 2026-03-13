package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// TimbanganModel represents the GORM model for timbangan
type TimbanganModel struct {
	// Primary Key
	IDLocal uuid.UUID `gorm:"type:uuid;primaryKey" json:"idLocal"`

	// Server sync ID (null until synced)
	IDPusat *uuid.UUID `gorm:"type:uuid;index" json:"idPusat"`

	// Business Data
	NomorKendaraan string `gorm:"type:varchar(50);not null;index:idx_unique_weighing,priority:3" json:"nomorKendaraan"`
	BeratKotor     int    `gorm:"not null;index:idx_unique_weighing,priority:4" json:"beratKotor"`
	BeratBersih    int    `gorm:"not null" json:"beratBersih"`

	// Enhanced TIMBANGAN fields
	WeighingType string `gorm:"type:varchar(20);default:'NET'" json:"weighingType"` // GROSS, TARE, NET
	QualityGrade string `gorm:"type:varchar(10)" json:"qualityGrade"`             // A, B, C, etc.
	SupplierID   *uuid.UUID `gorm:"type:uuid" json:"supplierId"`
	Notes        string `gorm:"type:text" json:"notes"`
	OperatorID   uuid.UUID `gorm:"type:uuid;not null;index" json:"operatorId"`
	SessionID    *uuid.UUID `gorm:"type:uuid" json:"sessionId"`
	VehicleType  string `gorm:"type:varchar(50)" json:"vehicleType"`
	TareWeight   int    `gorm:"default:0" json:"tareWeight"`
	PhotoPath    string `gorm:"type:varchar(500)" json:"photoPath"`
	IsBatch      bool   `gorm:"default:false" json:"isBatch"`
	BatchNumber  string `gorm:"type:varchar(50)" json:"batchNumber"`

	// Timestamps
	Tanggal   time.Time `gorm:"not null;index;index:idx_unique_weighing,priority:2" json:"tanggal"`       // Business timestamp (when weighing occurred)
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`                                 // Record creation time
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`                                 // Last update time
	SyncedAt  *time.Time `gorm:"index" json:"syncedAt"`                                                    // When successfully synced

	// Sync Metadata
	StatusSync   string `gorm:"type:varchar(20);not null;default:'PENDING';index:idx_sync_status" json:"statusSync"` // PENDING | SYNCED | FAILED
	SyncVersion  int    `gorm:"default:1" json:"syncVersion"`                                                         // For conflict detection
	ErrorMessage *string `gorm:"type:text" json:"errorMessage"`                                                        // Error details if sync failed

	// Device Metadata
	DeviceID string `gorm:"type:varchar(100);not null;index;index:idx_unique_weighing,priority:1" json:"deviceId"` // Which device created this
}

// TableName specifies the table name for TimbanganModel
func (TimbanganModel) TableName() string {
	return "timbangan"
}

// BeforeCreate hook to set UUID if not provided
func (t *TimbanganModel) BeforeCreate(tx *gorm.DB) error {
	if t.IDLocal == uuid.Nil {
		t.IDLocal = uuid.New()
	}
	if t.StatusSync == "" {
		t.StatusSync = "PENDING"
	}
	if t.SyncVersion == 0 {
		t.SyncVersion = 1
	}
	return nil
}