package types

import (
	"time"

	"github.com/google/uuid"
)

// TimbanganData represents weighing data in a portable format
type TimbanganData struct {
	IDLocal        uuid.UUID `json:"idLocal"`
	IDPusat        *uuid.UUID `json:"idPusat,omitempty"`
	NomorKendaraan string    `json:"nomorKendaraan"`
	BeratKotor     int       `json:"beratKotor"`
	BeratBersih    int       `json:"beratBersih"`
	WeighingType   string    `json:"weighingType,omitempty"`
	VehicleType    string    `json:"vehicleType,omitempty"`
	QualityGrade   string    `json:"qualityGrade,omitempty"`
	OperatorID     uuid.UUID `json:"operatorId,omitempty"`
	TareWeight     int       `json:"tareWeight,omitempty"`
	SupplierID     *uuid.UUID `json:"supplierId,omitempty"`
	Notes          string    `json:"notes,omitempty"`
	SessionID      *uuid.UUID `json:"sessionId,omitempty"`
	Tanggal        time.Time `json:"tanggal"`
	IdempotencyKey string    `json:"idempotencyKey"`
	ClientVersion  int       `json:"clientVersion"`
	DeviceID       string    `json:"deviceId"`
}

// PKSWeighingData represents PKS weighing data in a portable format
type PKSWeighingData struct {
	IDLocal        string     `json:"idLocal"`
	NoTransaksi    string     `json:"noTransaksi"`
	IDProduk       uint       `json:"idProduk"`
	IDUnit         uint       `json:"idUnit"`
	IDSupplier     uint       `json:"idSupplier"`
	DriverName     string     `json:"driverName"`
	Supplier       string     `json:"supplier,omitempty"`
	IDEstate       *uint      `json:"idEstate,omitempty"`
	IDAfdeling     *uint      `json:"idAfdeling,omitempty"`
	IDBlok         *uint      `json:"idBlok,omitempty"`
	SumberTBS      string     `json:"sumberTbs,omitempty"`
	Janjang        string     `json:"janjang,omitempty"`
	Grade          string     `json:"grade,omitempty"`
	Bruto          float64    `json:"bruto"`
	Tara           float64    `json:"tara"`
	Netto          float64    `json:"netto"`
	Bruto2         float64    `json:"bruto2,omitempty"`
	Tara2          float64    `json:"tara2,omitempty"`
	Netto2         float64    `json:"netto2,omitempty"`
	Status         string     `json:"status"`
	Timbang1Date   time.Time  `json:"timbang1Date"`
	Timbang2Date   *time.Time `json:"timbang2Date,omitempty"`
	Officer1ID     uuid.UUID  `json:"officer1Id"`
	Officer2ID     *uuid.UUID `json:"officer2Id,omitempty"`
	IdempotencyKey string     `json:"idempotencyKey"`
	ClientVersion  int        `json:"clientVersion"`
	DeviceID       string     `json:"deviceId"`
}

// SyncStatus represents the synchronization status
type SyncStatus string

const (
	SyncStatusPending    SyncStatus = "PENDING"
	SyncStatusProcessing SyncStatus = "PROCESSING"
	SyncStatusSynced     SyncStatus = "SYNCED"
	SyncStatusFailed     SyncStatus = "FAILED"
	SyncStatusAbandoned  SyncStatus = "ABANDONED"
)

// QueueStatus represents the status of items in sync queue
type QueueStatus string

const (
	QueueStatusPending    QueueStatus = "PENDING"
	QueueStatusProcessing QueueStatus = "PROCESSING"
	QueueStatusSuccess    QueueStatus = "SUCCESS"
	QueueStatusFailed     QueueStatus = "FAILED"
	QueueStatusAbandoned  QueueStatus = "ABANDONED"
)

// DeviceStatus represents the status of a device
type DeviceStatus string

const (
	DeviceStatusActive    DeviceStatus = "ACTIVE"
	DeviceStatusSuspended DeviceStatus = "SUSPENDED"
)

// SyncRequest represents a sync request from client to server
type SyncRequest struct {
	DeviceID  uuid.UUID       `json:"deviceId"`
	Records   []TimbanganData `json:"records"`
	Timestamp int64           `json:"timestamp"` // Unix timestamp for signature verification
	Signature string          `json:"signature"` // HMAC signature
}

// SyncResponse represents the server response to a sync request
type SyncResponse struct {
	TotalReceived int          `json:"totalReceived"`
	SuccessCount  int          `json:"successCount"`
	FailedCount   int          `json:"failedCount"`
	Results       []SyncResult `json:"results"`
	ServerTime    time.Time    `json:"serverTime"`
}

// SyncResult represents the result of syncing a single record
type SyncResult struct {
	IDLocal  uuid.UUID  `json:"idLocal"`
	IDPusat  *uuid.UUID `json:"idPusat,omitempty"`
	Status   string     `json:"status"` // SUCCESS | FAILED
	Error    *string    `json:"error,omitempty"`
}

// DeviceCredentials represents credentials returned after device registration
type DeviceCredentials struct {
	DeviceID uuid.UUID `json:"deviceId"`
	APIKey   string    `json:"apiKey"` // Only returned once during registration
	Message  string    `json:"message"`
}

// WeighingConfig represents weighing scale configuration
type WeighingConfig struct {
	COMPort           string `json:"comPort"`
	BaudRate          int    `json:"baudRate"`
	DataBits          int    `json:"dataBits"`
	StopBits          int    `json:"stopBits"`
	Parity            string `json:"parity"`
	ReadTimeout       int    `json:"readTimeout"`  // milliseconds
	WriteTimeout      int    `json:"writeTimeout"` // milliseconds
	MockSerialEnabled bool   `json:"mockSerialEnabled"`

	// Mock Serial Configuration
	MockInterval  int `json:"mockInterval"`  // milliseconds between updates
	MockMinWeight int `json:"mockMinWeight"` // minimum weight in grams (centesimal)
	MockMaxWeight int `json:"mockMaxWeight"` // maximum weight in grams (centesimal)
	MockVariance  int `json:"mockVariance"`  // weight fluctuation variance in grams (centesimal)
}

// DefaultWeighingConfig returns default configuration for weighing scale
func DefaultWeighingConfig() WeighingConfig {
	return WeighingConfig{
		COMPort:           "COM1",
		BaudRate:          9600,
		DataBits:          8,
		StopBits:          1,
		Parity:            "N", // None
		ReadTimeout:       5000,
		WriteTimeout:      5000,
		MockSerialEnabled: true, // Default to mock mode for development

		// Mock Configuration Defaults (matching .env)
		MockInterval:  1000,      // 1 second between updates (MOCK_SERIAL_INTERVAL=1s)
		MockMinWeight: 0,         // 0 kg minimum (MOCK_SERIAL_MIN_WEIGHT=0)
		MockMaxWeight: 1500000,   // 15000 kg maximum in centesimal (MOCK_SERIAL_MAX_WEIGHT=15000)
		MockVariance:  5000,      // 50 kg variance in centesimal (MOCK_SERIAL_VARIANCE=50)
	}
}

// SyncConfig represents synchronization configuration
type SyncConfig struct {
	ServerURL      string        `json:"serverUrl"`
	SyncInterval   time.Duration `json:"syncInterval"`   // How often to sync
	MaxRetries     int           `json:"maxRetries"`     // Maximum retry attempts
	RetryBackoff   time.Duration `json:"retryBackoff"`   // Initial backoff duration
	BatchSize      int           `json:"batchSize"`      // Records per batch
	RequestTimeout time.Duration `json:"requestTimeout"` // HTTP request timeout
}

// DefaultSyncConfig returns default synchronization configuration
func DefaultSyncConfig() SyncConfig {
	return SyncConfig{
		ServerURL:      "https://localhost:8443/graphql",
		SyncInterval:   5 * time.Minute,
		MaxRetries:     5,
		RetryBackoff:   1 * time.Second,
		BatchSize:      50,
		RequestTimeout: 30 * time.Second,
	}
}

// AppConfig represents complete application configuration
type AppConfig struct {
	DeviceID      uuid.UUID      `json:"deviceId"`
	DeviceName    string         `json:"deviceName"`
	Location      string         `json:"location"`
	DatabasePath  string         `json:"databasePath"`
	Weighing      WeighingConfig `json:"weighing"`
	Sync          SyncConfig     `json:"sync"`
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// Error implements the error interface
func (v ValidationError) Error() string {
	return v.Field + ": " + v.Message
}
