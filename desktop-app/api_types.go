package main

import (
	"time"
)

// API Request/Response Types for type-safe Wails bindings

// CreateWeighingRequest represents a request to create a new weighing record
type CreateWeighingRequest struct {
	Weight       float64   `json:"weight"`
	VehicleID    string    `json:"vehicleId,omitempty"`
	ProductID    string    `json:"productId"`
	UnitID       string    `json:"unitId"`
	SupplierID   string    `json:"supplierId"`
	TransportID  string    `json:"transportId,omitempty"`
	DriverName   string    `json:"driverName,omitempty"`
	TicketNumber string    `json:"ticketNumber,omitempty"`
	Notes        string    `json:"notes,omitempty"`
	Timestamp    time.Time `json:"timestamp"`
	DeviceID     string    `json:"deviceId"`
}

// CreateWeighingResponse represents the response after creating a weighing record
type CreateWeighingResponse struct {
	WeighingID   string    `json:"weighingId"`
	TicketNumber string    `json:"ticketNumber"`
	Success      bool      `json:"success"`
	Message      string    `json:"message"`
	CreatedAt    time.Time `json:"createdAt"`
	Weight       float64   `json:"weight"`
}

// UpdateWeighingRequest represents a request to update an existing weighing record
type UpdateWeighingRequest struct {
	WeighingID  string    `json:"weighingId"`
	Weight      float64   `json:"weight"`
	VehicleID   string    `json:"vehicleId,omitempty"`
	ProductID   string    `json:"productId"`
	UnitID      string    `json:"unitId"`
	SupplierID  string    `json:"supplierId"`
	TransportID string    `json:"transportId,omitempty"`
	DriverName  string    `json:"driverName,omitempty"`
	Notes       string    `json:"notes,omitempty"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// UpdateWeighingResponse represents the response after updating a weighing record
type UpdateWeighingResponse struct {
	WeighingID string    `json:"weighingId"`
	Success    bool      `json:"success"`
	Message    string    `json:"message"`
	UpdatedAt  time.Time `json:"updatedAt"`
	Weight     float64   `json:"weight"`
}

// WeighingFilters represents search filters for weighing records
type WeighingFilters struct {
	StartDate    *time.Time `json:"startDate,omitempty"`
	EndDate      *time.Time `json:"endDate,omitempty"`
	VehicleID    string     `json:"vehicleId,omitempty"`
	ProductID    string     `json:"productId,omitempty"`
	SupplierID   string     `json:"supplierId,omitempty"`
	OperatorID   string     `json:"operatorId,omitempty"`
	SyncStatus   string     `json:"syncStatus,omitempty"`
	TicketNumber string     `json:"ticketNumber,omitempty"`
	Limit        int        `json:"limit"`
	Offset       int        `json:"offset"`
}

// WeighingResponse represents a single weighing record response
type WeighingResponse struct {
	WeighingID   string     `json:"weighingId"`
	Weight       float64    `json:"weight"`
	VehicleID    string     `json:"vehicleId,omitempty"`
	ProductID    string     `json:"productId"`
	ProductName  string     `json:"productName"`
	UnitID       string     `json:"unitId"`
	UnitName     string     `json:"unitName"`
	SupplierID   string     `json:"supplierId,omitempty"`
	SupplierName string     `json:"supplierName,omitempty"`
	TransportID  string     `json:"transportId,omitempty"`
	DriverName   string     `json:"driverName,omitempty"`
	TicketNumber string     `json:"ticketNumber,omitempty"`
	OperatorID   string     `json:"operatorId"`
	OperatorName string     `json:"operatorName"`
	Notes        string     `json:"notes,omitempty"`
	Timestamp    time.Time  `json:"timestamp"`
	CreatedAt    time.Time  `json:"createdAt"`
	UpdatedAt    *time.Time `json:"updatedAt,omitempty"`
	SyncStatus   string     `json:"syncStatus"`
	SyncedAt     *time.Time `json:"syncedAt,omitempty"`
	DeviceID     string     `json:"deviceId"`
}

// WeighingListResponse represents a paginated list of weighing records
type WeighingListResponse struct {
	Weighings []WeighingResponse `json:"weighings"`
	Total     int64              `json:"total"`
	Limit     int                `json:"limit"`
	Offset    int                `json:"offset"`
	HasMore   bool               `json:"hasMore"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	DeviceID string `json:"deviceId,omitempty"`
}

// LoginResponse represents the response after successful login
type LoginResponse struct {
	Success      bool      `json:"success"`
	Token        string    `json:"token"`
	RefreshToken string    `json:"refreshToken"`
	User         User      `json:"user"`
	ExpiresAt    time.Time `json:"expiresAt"`
	Message      string    `json:"message"`
}

// User represents a user in the system
type User struct {
	UserID    string     `json:"userId"`
	Username  string     `json:"username"`
	FullName  string     `json:"fullName"`
	Email     string     `json:"email,omitempty"`
	Role      string     `json:"role"`
	IsActive  bool       `json:"isActive"`
	LastLogin *time.Time `json:"lastLogin,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatedAt,omitempty"`
}

// SessionCheckRequest represents a session validation request
type SessionCheckRequest struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refreshToken,omitempty"`
}

// SessionCheckResponse represents the response after session validation
type SessionCheckResponse struct {
	Valid   bool   `json:"valid"`
	Message string `json:"message"`
	User    *User  `json:"user,omitempty"`
}

// SyncStatusRequest represents a request to check sync status
type SyncStatusRequest struct {
	EntityType string `json:"entityType,omitempty"`
	EntityID   string `json:"entityId,omitempty"`
}

// SyncStatusResponse represents the current sync status
type SyncStatusResponse struct {
	IsSyncing       bool    `json:"isSyncing"`
	PendingCount    int64   `json:"pendingCount"`
	SuccessCount    int64   `json:"successCount"`
	FailedCount     int64   `json:"failedCount"`
	LastSyncAt      string  `json:"lastSyncAt,omitempty"`
	LastSyncSuccess bool    `json:"lastSyncSuccess"`
	NextSyncAt      string  `json:"nextSyncAt,omitempty"`
	ErrorRate       float64 `json:"errorRate"`
	LastError       string  `json:"lastError,omitempty"`
}

// WeightEvent represents a real-time weight update event
type WeightEvent struct {
	Weight    float64   `json:"weight"`
	Stable    bool      `json:"stable"`
	Phase     int       `json:"phase"`
	Timestamp time.Time `json:"timestamp"`
	DeviceID  string    `json:"deviceId"`
	Unit      string    `json:"unit"`
	Trend     string    `json:"trend,omitempty"`
}

// ConnectionStatus represents the device connection status
type ConnectionStatus struct {
	IsConnected    bool       `json:"isConnected"`
	DeviceID       string     `json:"deviceId,omitempty"`
	Port           string     `json:"port,omitempty"`
	LastConnected  *time.Time `json:"lastConnected,omitempty"`
	LastDisconnect *time.Time `json:"lastDisconnect,omitempty"`
	ErrorMessage   string     `json:"errorMessage,omitempty"`
}

// APIError represents a structured error response
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// PaginationRequest represents a generic pagination request
type PaginationRequest struct {
	Limit  int    `json:"limit"`
	Offset int    `json:"offset"`
	SortBy string `json:"sortBy,omitempty"`
	Order  string `json:"order,omitempty"` // "asc" or "desc"
}

// SearchFilters represents generic search filters
type SearchFilters struct {
	Query      string                 `json:"query,omitempty"`
	Filters    map[string]interface{} `json:"filters,omitempty"`
	Pagination PaginationRequest      `json:"pagination"`
}

// Master Data Types

// ProductRequest represents a product creation/update request
type ProductRequest struct {
	KodeProduk string  `json:"kodeProduk"`
	NamaProduk string  `json:"namaProduk"`
	Satuan     string  `json:"satuan"`
	Harga      float64 `json:"harga,omitempty"`
	Keterangan string  `json:"keterangan,omitempty"`
	IsActive   bool    `json:"isActive"`
}

// ProductResponse represents a product response
type ProductResponse struct {
	ID         int       `json:"id"`
	KodeProduk string    `json:"kodeProduk"`
	NamaProduk string    `json:"namaProduk"`
	Satuan     string    `json:"satuan"`
	Harga      float64   `json:"harga"`
	Keterangan string    `json:"keterangan"`
	IsActive   bool      `json:"isActive"`
	CreatedBy  string    `json:"createdBy"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

// UnitRequest represents a unit creation/update request
type UnitRequest struct {
	NomorPolisi string  `json:"nomorPolisi"`
	Kapasitas   float64 `json:"kapasitas"`
	Jenis       string  `json:"jenis,omitempty"`
	Merk        string  `json:"merk,omitempty"`
	Tahun       int     `json:"tahun,omitempty"`
	IsActive    bool    `json:"isActive"`
}

// UnitResponse represents a unit response
type UnitResponse struct {
	ID          int       `json:"id"`
	NomorPolisi string    `json:"nomorPolisi"`
	Kapasitas   float64   `json:"kapasitas"`
	Jenis       string    `json:"jenis"`
	Merk        string    `json:"merk"`
	Tahun       int       `json:"tahun"`
	IsActive    bool      `json:"isActive"`
	CreatedBy   string    `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PaginatedResponse represents a generic paginated response
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"perPage"`
	TotalPages int         `json:"totalPages"`
	HasMore    bool        `json:"hasMore"`
}
