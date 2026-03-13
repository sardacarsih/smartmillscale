package database

import (
	"time"

	"github.com/google/uuid"
)

// Timbangan represents a weighing record
type Timbangan struct {
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

	// PKS-specific fields
	NoTransaksi    string     `gorm:"type:varchar(50);uniqueIndex" json:"noTransaksi"`      // PKS transaction number
	IDProduk       *uint      `gorm:"index" json:"idProduk"`                                // Product FK
	IDUnit         *uint      `gorm:"index" json:"idUnit"`                                  // Unit FK
	IDTujuan       *uint      `gorm:"index" json:"idTujuan"`                                // Destination FK
	DriverName     string     `gorm:"type:varchar(100)" json:"driverName"`                 // Driver name
	Supplier       string     `gorm:"type:varchar(100)" json:"supplier"`                   // Supplier name
	IDEstate       *uint      `gorm:"index" json:"idEstate"`                                // Estate FK
	IDAfdeling     *uint      `gorm:"index" json:"idAfdeling"`                              // Afdeling FK
	IDBlok         *uint      `gorm:"index" json:"idBlok"`                                  // Block FK
	SumberTBS      string     `gorm:"type:varchar(50)" json:"sumberTbs"`                   // TBS source
	Janjang        string     `gorm:"type:varchar(20)" json:"janjang"`                      // Janjang type
	Grade          string     `gorm:"type:varchar(10)" json:"grade"`                        // PKS grade
	Bruto          float64    `gorm:"type:decimal(10,2)" json:"bruto"`                      // Gross weight
	Tara           float64    `gorm:"type:decimal(10,2)" json:"tara"`                       // Tare weight
	Netto          float64    `gorm:"type:decimal(10,2)" json:"netto"`                      // Net weight
	Bruto2         *float64   `gorm:"type:decimal(10,2)" json:"bruto2"`                    // Second weighing gross
	Tara2          *float64   `gorm:"type:decimal(10,2)" json:"tara2"`                     // Second weighing tare
	Netto2         *float64   `gorm:"type:decimal(10,2)" json:"netto2"`                    // Second weighing net
	Officer1ID     uuid.UUID  `gorm:"type:uuid;index" json:"officer1Id"`                   // First officer
	Officer2ID     *uuid.UUID `gorm:"type:uuid;index" json:"officer2Id"`                   // Second officer
	Timbang1Date   time.Time  `gorm:"not null;index" json:"timbang1Date"`                   // First weighing date
	Timbang2Date   *time.Time `gorm:"index" json:"timbang2Date"`                            // Second weighing date
	IsPKS          bool       `gorm:"default:false;index" json:"isPKS"`                     // PKS transaction flag
	StatusPKS      string     `gorm:"type:varchar(20);default:'DRAFT'" json:"statusPks"`    // DRAFT, TIMBANG1, TIMBANG2, COMPLETED

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

// TableName specifies the table name for Timbangan
func (Timbangan) TableName() string {
	return "timbangan"
}

// BeforeCreate hook to set UUID if not provided
func (t *Timbangan) BeforeCreate() error {
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

// SyncQueue represents a queue item for synchronization
type SyncQueue struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// Entity Information
	EntityType string    `gorm:"type:varchar(50);not null;index:idx_queue_entity,priority:1" json:"entityType"` // "timbangan"
	EntityID   uuid.UUID `gorm:"type:uuid;not null;index:idx_queue_entity,priority:2" json:"entityId"`          // FK to entity

	// Payload
	PayloadJSON string `gorm:"type:text;not null" json:"payloadJson"` // JSON representation of entity

	// Sync Status
	Status      string `gorm:"type:varchar(20);not null;default:'PENDING';index:idx_queue_status,priority:1" json:"status"` // PENDING | PROCESSING | SUCCESS | FAILED | ABANDONED
	RetryCount  int    `gorm:"not null;default:0;index:idx_queue_status,priority:2" json:"retryCount"`
	MaxRetries  int    `gorm:"not null;default:5" json:"maxRetries"`
	LastError   *string `gorm:"type:text" json:"lastError"`
	LastRetryAt *time.Time `gorm:"index" json:"lastRetryAt"`

	// Timestamps
	CreatedAt time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time `gorm:"not null;autoUpdateTime;index:idx_queue_status,priority:3" json:"updatedAt"`

	// Idempotency
	IdempotencyKey string `gorm:"type:varchar(255);uniqueIndex" json:"idempotencyKey"`
}

// TableName specifies the table name for SyncQueue
func (SyncQueue) TableName() string {
	return "sync_queue"
}

// BeforeCreate hook to set UUID and defaults
func (sq *SyncQueue) BeforeCreate() error {
	if sq.ID == uuid.Nil {
		sq.ID = uuid.New()
	}
	if sq.Status == "" {
		sq.Status = "PENDING"
	}
	if sq.MaxRetries == 0 {
		sq.MaxRetries = 5
	}
	return nil
}

// SyncHistory represents audit log of sync attempts
type SyncHistory struct {
	// Primary Key
	ID uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`

	// References
	QueueID    *uuid.UUID `gorm:"type:uuid;index" json:"queueId"`                                           // Reference to sync queue
	EntityType string     `gorm:"type:varchar(50);not null;index" json:"entityType"`                        // "timbangan"
	EntityID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"entityId"`                                 // FK to entity

	// Attempt Details
	AttemptNumber int    `gorm:"not null" json:"attemptNumber"` // Which retry attempt (1-based)
	Status        string `gorm:"type:varchar(20);not null" json:"status"` // SUCCESS | FAILED
	ErrorMessage  *string `gorm:"type:text" json:"errorMessage"`

	// Request/Response
	RequestPayload  *string `gorm:"type:text" json:"requestPayload"`
	ResponsePayload *string `gorm:"type:text" json:"responsePayload"`

	// Performance
	DurationMs int `gorm:"not null" json:"durationMs"` // Request duration in milliseconds

	// Timestamp
	AttemptedAt time.Time `gorm:"not null;autoCreateTime;index" json:"attemptedAt"`
}

// TableName specifies the table name for SyncHistory
func (SyncHistory) TableName() string {
	return "sync_history"
}

// BeforeCreate hook to set UUID
func (sh *SyncHistory) BeforeCreate() error {
	if sh.ID == uuid.Nil {
		sh.ID = uuid.New()
	}
	return nil
}

// DeviceInfo represents device configuration (stored locally)
type DeviceInfo struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	DeviceName  string    `gorm:"type:varchar(255);not null" json:"deviceName"`
	Location    string    `gorm:"type:varchar(255)" json:"location"`
	APIKey      string    `gorm:"type:varchar(500);not null" json:"apiKey"` // Stored in OS keyring, this is just device ID reference
	ServerURL   string    `gorm:"type:varchar(500);not null" json:"serverUrl"`
	IsActive    bool      `gorm:"default:true" json:"isActive"`
	CreatedAt   time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt   time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	LastSeenAt  *time.Time `gorm:"" json:"lastSeenAt"`
}

// TableName specifies the table name for DeviceInfo
func (DeviceInfo) TableName() string {
	return "device_info"
}

// BeforeCreate hook to set UUID
func (di *DeviceInfo) BeforeCreate() error {
	if di.ID == uuid.Nil {
		di.ID = uuid.New()
	}
	return nil
}

// VehicleTemplate represents templates for quick vehicle data entry
type VehicleTemplate struct {
	ID               uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	VehicleType      string    `gorm:"type:varchar(50);not null;index" json:"vehicleType"` // TRUK, PICKUP, MOTOR, etc.
	ExpectedMinWeight *int     `gorm:"" json:"expectedMinWeight"`
	ExpectedMaxWeight *int     `gorm:"" json:"expectedMaxWeight"`
	DefaultTareWeight int      `gorm:"default:0" json:"defaultTareWeight"`
	Notes            string    `gorm:"type:text" json:"notes"`
	CreatedBy        uuid.UUID `gorm:"type:uuid;not null;index" json:"createdBy"`
	CreatedAt        time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt        time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
	IsActive         bool      `gorm:"default:true" json:"isActive"`
}

// TableName specifies the table name for VehicleTemplate
func (VehicleTemplate) TableName() string {
	return "vehicle_templates"
}

// BeforeCreate hook to set UUID
func (vt *VehicleTemplate) BeforeCreate() error {
	if vt.ID == uuid.Nil {
		vt.ID = uuid.New()
	}
	return nil
}

// WeightValidationRule represents configurable weight validation rules
type WeightValidationRule struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	RuleName          string    `gorm:"type:varchar(100);not null" json:"ruleName"`
	VehicleType       string    `gorm:"type:varchar(50);index" json:"vehicleType"` // Empty for all types
	MinWeight         *int      `gorm:"" json:"minWeight"`
	MaxWeight         *int      `gorm:"" json:"maxWeight"`
	TolerancePercent  float64   `gorm:"type:decimal(5,2);default:0.00" json:"tolerancePercent"`
	WeighingType      string    `gorm:"type:varchar(20);default:'ALL'" json:"weighingType"` // GROSS, TARE, NET, ALL
	IsActive          bool      `gorm:"default:true" json:"isActive"`
	WarningMessage    string    `gorm:"type:varchar(255)" json:"warningMessage"`
	CreatedBy         uuid.UUID `gorm:"type:uuid;not null;index" json:"createdBy"`
	CreatedAt         time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt         time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`
}

// TableName specifies the table name for WeightValidationRule
func (WeightValidationRule) TableName() string {
	return "weight_validation_rules"
}

// BeforeCreate hook to set UUID
func (wvr *WeightValidationRule) BeforeCreate() error {
	if wvr.ID == uuid.Nil {
		wvr.ID = uuid.New()
	}
	return nil
}

// WeighingSession represents operator sessions for tracking performance
type WeighingSession struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	OperatorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"operatorId"`
	SessionStart  time.Time  `gorm:"not null" json:"sessionStart"`
	SessionEnd    *time.Time `gorm:"" json:"sessionEnd"`
	TotalWeighings int       `gorm:"default:0" json:"totalWeighings"`
	TotalWeight   int        `gorm:"default:0" json:"totalWeight"`
	AverageWeight float64    `gorm:"" json:"averageWeight"`
	BreakCount    int        `gorm:"default:0" json:"breakCount"`
	LastBreakAt   *time.Time `gorm:"" json:"lastBreakAt"`
	Notes         string     `gorm:"type:text" json:"notes"`
	DeviceID      string     `gorm:"type:varchar(100);not null;index" json:"deviceId"`
	CreatedAt     time.Time  `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt     time.Time  `gorm:"not null;autoUpdateTime" json:"updatedAt"`
}

// TableName specifies the table name for WeighingSession
func (WeighingSession) TableName() string {
	return "weighing_sessions"
}

// BeforeCreate hook to set UUID
func (ws *WeighingSession) BeforeCreate() error {
	if ws.ID == uuid.Nil {
		ws.ID = uuid.New()
	}
	return nil
}

// PKSTicket represents printed tickets for PKS transactions
type PKSTicket struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	NoTransaksi  string    `gorm:"type:varchar(50);not null;index" json:"noTransaksi"`      // Transaction number
	TimbanganID  uuid.UUID `gorm:"type:uuid;not null;index" json:"timbanganId"`             // Timbangan FK
	TicketNumber string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"ticketNumber"` // Ticket number
	PrintedAt    time.Time `gorm:"not null;autoCreateTime" json:"printedAt"`                // Print timestamp
	PrintedBy    uuid.UUID `gorm:"type:uuid;not null;index" json:"printedBy"`               // Operator who printed
	Copies       int       `gorm:"default:1" json:"copies"`                                 // Number of copies
	ReprintCount int       `gorm:"default:0" json:"reprintCount"`                           // Reprint counter
	LastReprintAt *time.Time `gorm:"" json:"lastReprintAt"`                                // Last reprint timestamp
	IsActive     bool      `gorm:"default:true" json:"isActive"`                           // Active status
	CreatedAt    time.Time `gorm:"not null;autoCreateTime" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"not null;autoUpdateTime" json:"updatedAt"`

	// Relationships
	Timbangan Timbangan `gorm:"foreignKey:TimbanganID" json:"timbangan"`
}

// TableName specifies the table name for PKSTicket
func (PKSTicket) TableName() string {
	return "pks_tickets"
}

// WeightHistoryEntry represents historical weight data for monitoring
type WeightHistoryEntry struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	Weight    int       `json:"weight"`
	Stable    bool      `json:"stable"`
	Unit      string    `json:"unit"`
	Timestamp time.Time `json:"timestamp"`
}

// TableName for WeightHistoryEntry
func (WeightHistoryEntry) TableName() string {
	return "weight_history"
}

// BeforeCreate hook for WeightHistoryEntry
func (w *WeightHistoryEntry) BeforeCreate() error {
	if w.ID == uuid.Nil {
		w.ID = uuid.New()
	}
	return nil
}



