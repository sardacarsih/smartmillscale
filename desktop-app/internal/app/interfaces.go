package app

import (
	"context"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/shared/types"
)

// Application represents the main application interface
type Application interface {
	Start(ctx context.Context) error
	Stop(ctx context.Context) error
	Health(ctx context.Context) error

	// Get services for external access
	WeighingService() WeighingService
	AuthService() AuthService
	SyncService() SyncService
	UserService() UserService
	DashboardService() DashboardService
}

// WeighingService handles weighing operations
type WeighingService interface {
	CreateWeighing(ctx context.Context, req *dto.CreateTimbanganRequest) (*dto.TimbanganResponse, error)
	UpdateWeighing(ctx context.Context, req *dto.UpdateTimbanganRequest) (*dto.TimbanganResponse, error)
	GetWeighingByID(ctx context.Context, weighingID string) (*dto.TimbanganResponse, error)
	SearchWeighings(ctx context.Context, filters *dto.TimbanganSearchRequest) (*dto.TimbanganListResponse, error)
	GetRecentWeighings(ctx context.Context, limit int) ([]*dto.TimbanganResponse, error)
	ValidateWeighing(ctx context.Context, weighingID string) (*dto.TimbanganValidationResponse, error)
	GetWeighingStatistics(ctx context.Context) (*dto.WeighingStatisticsResponse, error)
	MarkWeighingAsSynced(ctx context.Context, weighingID string) error
}

// AuthService handles authentication and authorization
type AuthService interface {
	Login(ctx context.Context, req *dto.LoginRequest) (*dto.LoginResponse, error)
	Logout(ctx context.Context, token string) error
	CheckSession(ctx context.Context, req *dto.SessionCheckRequest) (*dto.SessionCheckResponse, error)
	RefreshSession(ctx context.Context, refreshToken string) (*dto.LoginResponse, error)
	ValidateToken(ctx context.Context, token string) (*dto.UserSessionResponse, error)
	ChangePassword(ctx context.Context, req *dto.ChangePasswordRequest) error
	ResetPassword(ctx context.Context, req *dto.ResetPasswordRequest) error
	IsSetupRequired(ctx context.Context) (bool, error)
}

// UserService handles user management
type UserService interface {
	CreateUser(ctx context.Context, req *dto.CreateUserRequest) (*dto.UserResponse, error)
	UpdateUser(ctx context.Context, req *dto.UpdateUserRequest) (*dto.UserResponse, error)
	GetUserByID(ctx context.Context, userID string) (*dto.UserResponse, error)
	GetUserByUsername(ctx context.Context, username string) (*dto.UserResponse, error)
	SearchUsers(ctx context.Context, filters *dto.UserSearchRequest) (*dto.UserListResponse, error)
	DeleteUser(ctx context.Context, userID string, deleterID string) error
	GetUserStatistics(ctx context.Context) (*dto.UserStatisticsResponse, error)
	DeactivateUser(ctx context.Context, userID string, deactivatedBy string) error
	ReactivateUser(ctx context.Context, userID string, reactivatedBy string) error
}

// SyncService handles data synchronization
type SyncService interface {
	TriggerManualSync(ctx context.Context, req *dto.SyncTimbanganRequest) error
	// GetSyncStatus(ctx context.Context) (*dto.SyncStatusResponse, error)
	// GetSyncQueue(ctx context.Context, status string, limit int) ([]*types.SyncQueueItem, error)
	// GetSyncHistory(ctx context.Context, limit int) ([]*types.SyncHistoryItem, error)
	GetUserStatistics(ctx context.Context) (*dto.UserStatisticsResponse, error)
	RetryFailedSyncs(ctx context.Context) error
	QueueForSync(ctx context.Context, entityType string, entityID string, payload interface{}) error
	UpdateSyncConfig(ctx context.Context, config *types.SyncConfig) error
	HealthCheck(ctx context.Context) error
}

// DashboardService handles dashboard operations
type DashboardService interface {
	// GetDashboardData(ctx context.Context, userID string, role string) (*types.DashboardData, error)
	// UpdateDashboardLayout(ctx context.Context, userID string, layout *types.DashboardLayout) error
	// AddDashboardWidget(ctx context.Context, userID string, widget *types.DashboardWidget) error
	// UpdateDashboardWidget(ctx context.Context, userID string, widgetID string, widget *types.DashboardWidget) error
	// RemoveDashboardWidget(ctx context.Context, userID string, widgetID string) error
	// RefreshDashboard(ctx context.Context, userID string) (*types.DashboardData, error)
	// GetMetricsData(ctx context.Context, userID string, role string) (*types.MetricsData, error)
}

// WeightMonitoringService handles real-time weight monitoring
type WeightMonitoringService interface {
	// StartMonitoring(ctx context.Context) error
	// StopMonitoring(ctx context.Context) error
	// IsMonitoringActive() bool
	// GetCurrentWeight(ctx context.Context) (*types.WeightData, error)
	// GetConnectionStatus(ctx context.Context) (*types.ConnectionStatus, error)
	// GetWeightHistory(ctx context.Context, limit int, sinceTimestamp int64) ([]*types.WeightData, error)
	// SubscribeToWeightUpdates(ctx context.Context, subscriberID string) (<-chan *types.WeightEvent, error)
	// UnsubscribeFromWeightUpdates(ctx context.Context, subscriberID string) error
}

// MasterDataService handles PKS master data operations
type MasterDataService interface {
	// Products
	// CreateProduct(ctx context.Context, req *dto.ProductRequest) (*dto.ProductResponse, error)
	// UpdateProduct(ctx context.Context, productID string, req *dto.ProductRequest) (*dto.ProductResponse, error)
	// GetProductByID(ctx context.Context, productID string) (*dto.ProductResponse, error)
	// GetProductsPaginated(ctx context.Context, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
	// SearchProducts(ctx context.Context, filters *dto.SearchFilters) (*dto.PaginatedResponse, error)
	DeleteProduct(ctx context.Context, productID string, deleterID string) error

	// Units
	// CreateUnit(ctx context.Context, req *dto.UnitRequest) (*dto.UnitResponse, error)
	// UpdateUnit(ctx context.Context, unitID string, req *dto.UnitRequest) (*dto.UnitResponse, error)
	// GetUnitByID(ctx context.Context, unitID string) (*dto.UnitResponse, error)
	// GetUnitsPaginated(ctx context.Context, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
	// SearchUnits(ctx context.Context, filters *dto.SearchFilters) (*dto.PaginatedResponse, error)
	DeleteUnit(ctx context.Context, unitID string, deleterID string) error

	// Suppliers
	// CreateSupplier(ctx context.Context, req *dto.SupplierRequest) (*dto.SupplierResponse, error)
	// UpdateSupplier(ctx context.Context, supplierID string, req *dto.SupplierRequest) (*dto.SupplierResponse, error)
	// GetSupplierByID(ctx context.Context, supplierID string) (*dto.SupplierResponse, error)
	// GetSuppliersPaginated(ctx context.Context, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
	// SearchSuppliers(ctx context.Context, filters *dto.SearchFilters) (*dto.PaginatedResponse, error)
	DeleteSupplier(ctx context.Context, supplierID string, deleterID string) error

	// Estates, Afdelings, Bloks
	// GetEstatesPaginated(ctx context.Context, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
	// GetAfdelingsByEstate(ctx context.Context, estateID string, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
	// GetBlokByAfdeling(ctx context.Context, afdelingID string, req *dto.PaginationRequest) (*dto.PaginatedResponse, error)
}

// TicketService handles ticket printing operations
type TicketService interface {
	// PrintTicket(ctx context.Context, req *dto.PrintTicketRequest) (*dto.PrintTicketResponse, error)
	// GetTicketHistory(ctx context.Context, limit int, offset int) ([]*types.Ticket, error)
	// GetTicketByNumber(ctx context.Context, ticketNumber string) (*types.Ticket, error)
	// GetPrintStatistics(ctx context.Context, days int) (*types.PrintStats, error)
	// GenerateTicketPreview(ctx context.Context, timbanganID string) (*types.TicketPreview, error)
}

// EventService handles application events
type EventService interface {
	// Publish(ctx context.Context, event *types.AppEvent) error
	// Subscribe(eventType string, handler types.EventHandler) error
	// Unsubscribe(eventType string, handlerID string) error
	// GetEventHistory(ctx context.Context, eventType string, limit int) ([]*types.AppEvent, error)
}

// Logger interface for structured logging
type Logger interface {
	Debug(ctx context.Context, message string, fields ...map[string]interface{})
	Info(ctx context.Context, message string, fields ...map[string]interface{})
	Warn(ctx context.Context, message string, fields ...map[string]interface{})
	Error(ctx context.Context, message string, err error, fields ...map[string]interface{})
	Fatal(ctx context.Context, message string, err error, fields ...map[string]interface{})
	With(fields ...map[string]interface{}) Logger
}

// Metrics interface for observability
type Metrics interface {
	Counter(name string, labels map[string]string) MetricCounter
	Gauge(name string, labels map[string]string) MetricGauge
	Histogram(name string, labels map[string]string) MetricHistogram
	IncrementCounter(name string, labels map[string]string)
	SetGauge(name string, value float64, labels map[string]string)
	RecordDuration(name string, duration float64, labels map[string]string)
}

type MetricCounter interface {
	Add(delta float64)
}

type MetricGauge interface {
	Set(value float64)
	Add(delta float64)
}

type MetricHistogram interface {
	Observe(value float64)
}

// Validator interface for request validation
type Validator interface {
	Validate(ctx context.Context, req interface{}) error
	ValidateStruct(ctx context.Context, s interface{}) error
	ValidateField(ctx context.Context, field interface{}, rules string) error
	AddCustomValidator(name string, validator func(interface{}) error)
}
