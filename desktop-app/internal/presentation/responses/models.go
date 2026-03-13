package responses

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// APIResponse represents the standard response format for all API endpoints
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   *ErrorInfo  `json:"error,omitempty"`
	Meta    *MetaInfo   `json:"meta,omitempty"`
}

// ErrorInfo represents structured error information
type ErrorInfo struct {
	Code      string                 `json:"code"`
	Message   string                 `json:"message"`
	Details   map[string]interface{} `json:"details,omitempty"`
	Timestamp string                 `json:"timestamp"`
	RequestID string                 `json:"request_id,omitempty"`
}

// MetaInfo contains metadata about the response
type MetaInfo struct {
	Version    string          `json:"version,omitempty"`
	DeviceID   string          `json:"device_id,omitempty"`
	Timestamp  string          `json:"timestamp,omitempty"`
	RequestID  string          `json:"request_id,omitempty"`
	Pagination *PaginationInfo `json:"pagination,omitempty"`
}

// PaginationInfo contains pagination metadata for list responses
type PaginationInfo struct {
	Page       int `json:"page"`
	PerPage    int `json:"per_page"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

// Constants for error codes
const (
	// Validation errors
	ErrorCodeValidationFailed   = "VALIDATION_ERROR"
	ErrorCodeInvalidInput       = "INVALID_INPUT"
	ErrorCodeInvalidCredentials = "INVALID_CREDENTIALS"
	ErrorCodeUserNotFound       = "USER_NOT_FOUND"
	ErrorCodeUserInactive       = "USER_INACTIVE"
	ErrorCodeAccountLocked      = "ACCOUNT_LOCKED"

	// Authentication errors
	ErrorCodeNotAuthenticated = "NOT_AUTHENTICATED"
	ErrorCodeSessionExpired   = "SESSION_EXPIRED"
	ErrorCodeSessionInvalid   = "SESSION_INVALID"

	// Authorization errors
	ErrorCodeAccessDenied       = "ACCESS_DENIED"
	ErrorCodeInsufficientRights = "INSUFFICIENT_RIGHTS"

	// Business logic errors
	ErrorCodeDeviceNotFound = "DEVICE_NOT_FOUND"
	ErrorCodeWeighingActive = "WEIGHING_ALREADY_ACTIVE"
	ErrorCodeInvalidWeight  = "INVALID_WEIGHT"
	ErrorCodeSyncFailed     = "SYNC_FAILED"

	// System errors
	ErrorCodeInternalServer = "INTERNAL_SERVER_ERROR"
	ErrorCodeDatabaseError  = "DATABASE_ERROR"
	ErrorCodeNetworkError   = "NETWORK_ERROR"
	ErrorCodeTimeout        = "TIMEOUT_ERROR"
)

// NewSuccessResponse creates a new success response
func NewSuccessResponse(message string, data interface{}, deviceID string) *APIResponse {
	return &APIResponse{
		Success: true,
		Message: message,
		Data:    data,
		Meta: &MetaInfo{
			Version:   "1.0.0",
			DeviceID:  deviceID,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			RequestID: generateRequestID(),
		},
	}
}

// NewErrorResponse creates a new error response
func NewErrorResponse(code, message string, details map[string]interface{}, requestID string) *APIResponse {
	return &APIResponse{
		Success: false,
		Message: message,
		Error: &ErrorInfo{
			Code:      code,
			Message:   message,
			Details:   details,
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			RequestID: requestID,
		},
		Meta: &MetaInfo{
			Version:   "1.0.0",
			Timestamp: time.Now().UTC().Format(time.RFC3339),
			RequestID: requestID,
		},
	}
}

// NewValidationErrorResponse creates a validation error response
func NewValidationErrorResponse(details map[string]interface{}, requestID string) *APIResponse {
	return NewErrorResponse(
		ErrorCodeValidationFailed,
		"Input validation failed",
		details,
		requestID,
	)
}

// NewPaginatedResponse creates a paginated success response
func NewPaginatedResponse(message string, data interface{}, pagination PaginationInfo, deviceID string) *APIResponse {
	response := NewSuccessResponse(message, data, deviceID)
	response.Meta.Pagination = &pagination
	return response
}

// generateRequestID generates a unique request ID for tracking
func generateRequestID() string {
	return "req_" + uuid.New().String()[:8]
}

// GenerateRequestID generates a unique request ID for tracking (public)
func GenerateRequestID() string {
	return generateRequestID()
}

// ValidationErrorDetail represents a single validation error
type ValidationErrorDetail struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   string `json:"value,omitempty"`
}

// NewValidationErrorDetails creates validation error details from a map
func NewValidationErrorDetails(errors map[string]string) map[string]interface{} {
	details := make(map[string]interface{})
	for field, message := range errors {
		details[field] = ValidationErrorDetail{
			Field:   field,
			Message: message,
		}
	}
	return details
}

// AddPaginationToMeta adds pagination info to response meta
func (r *APIResponse) AddPaginationToMeta(page, perPage, total int) {
	totalPages := (total + perPage - 1) / perPage
	if r.Meta == nil {
		r.Meta = &MetaInfo{}
	}
	r.Meta.Pagination = &PaginationInfo{
		Page:       page,
		PerPage:    perPage,
		Total:      total,
		TotalPages: totalPages,
	}
}

// UnmarshalRequest unmarshals a JSON request string into a target struct
func UnmarshalRequest(requestJSON string, target interface{}) error {
	return json.Unmarshal([]byte(requestJSON), target)
}
