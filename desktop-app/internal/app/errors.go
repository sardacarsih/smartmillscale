package app

import (
	"context"
	"fmt"
	"net/http"
	"runtime"
	"time"

	"github.com/google/uuid"
)

// ErrorCode represents application error codes
type ErrorCode string

const (
	// System errors
	ErrCodeInternal ErrorCode = "INTERNAL_ERROR"
	ErrCodeDatabase ErrorCode = "DATABASE_ERROR"
	ErrCodeNetwork  ErrorCode = "NETWORK_ERROR"
	ErrCodeTimeout  ErrorCode = "TIMEOUT_ERROR"
	ErrCodeConfig   ErrorCode = "CONFIG_ERROR"

	// Validation errors
	ErrCodeValidation    ErrorCode = "VALIDATION_ERROR"
	ErrCodeInvalidInput  ErrorCode = "INVALID_INPUT"
	ErrCodeRequiredField ErrorCode = "REQUIRED_FIELD"

	// Authentication errors
	ErrCodeUnauthorized ErrorCode = "UNAUTHORIZED"
	ErrCodeForbidden    ErrorCode = "FORBIDDEN"
	ErrCodeTokenExpired ErrorCode = "TOKEN_EXPIRED"
	ErrCodeInvalidToken ErrorCode = "INVALID_TOKEN"
	ErrCodeInvalidCreds ErrorCode = "INVALID_CREDENTIALS"

	// Business logic errors
	ErrCodeNotFound     ErrorCode = "NOT_FOUND"
	ErrCodeConflict     ErrorCode = "CONFLICT"
	ErrCodeDuplicate    ErrorCode = "DUPLICATE"
	ErrCodeBusinessRule ErrorCode = "BUSINESS_RULE"

	// Weighing specific errors
	ErrCodeWeighingFailed    ErrorCode = "WEIGHING_FAILED"
	ErrCodeScaleDisconnected ErrorCode = "SCALE_DISCONNECTED"
	ErrCodeWeightUnstable    ErrorCode = "WEIGHT_UNSTABLE"
	ErrCodeInvalidWeight     ErrorCode = "INVALID_WEIGHT"

	// Sync errors
	ErrCodeSyncFailed   ErrorCode = "SYNC_FAILED"
	ErrCodeSyncConflict ErrorCode = "SYNC_CONFLICT"
	ErrCodeSyncTimeout  ErrorCode = "SYNC_TIMEOUT"
)

// HTTP status code mappings
var errorCodeHTTPStatus = map[ErrorCode]int{
	ErrCodeInternal: http.StatusInternalServerError,
	ErrCodeDatabase: http.StatusInternalServerError,
	ErrCodeNetwork:  http.StatusServiceUnavailable,
	ErrCodeTimeout:  http.StatusRequestTimeout,
	ErrCodeConfig:   http.StatusInternalServerError,

	ErrCodeValidation:    http.StatusBadRequest,
	ErrCodeInvalidInput:  http.StatusBadRequest,
	ErrCodeRequiredField: http.StatusBadRequest,

	ErrCodeUnauthorized: http.StatusUnauthorized,
	ErrCodeForbidden:    http.StatusForbidden,
	ErrCodeTokenExpired: http.StatusUnauthorized,
	ErrCodeInvalidToken: http.StatusUnauthorized,
	ErrCodeInvalidCreds: http.StatusUnauthorized,

	ErrCodeNotFound:     http.StatusNotFound,
	ErrCodeConflict:     http.StatusConflict,
	ErrCodeDuplicate:    http.StatusConflict,
	ErrCodeBusinessRule: http.StatusUnprocessableEntity,

	ErrCodeWeighingFailed:    http.StatusServiceUnavailable,
	ErrCodeScaleDisconnected: http.StatusServiceUnavailable,
	ErrCodeWeightUnstable:    http.StatusConflict,
	ErrCodeInvalidWeight:     http.StatusBadRequest,

	ErrCodeSyncFailed:   http.StatusInternalServerError,
	ErrCodeSyncConflict: http.StatusConflict,
	ErrCodeSyncTimeout:  http.StatusRequestTimeout,
}

// AppError represents a structured application error
type AppError struct {
	Code      ErrorCode    `json:"code"`
	Message   string       `json:"message"`
	Details   string       `json:"details,omitempty"`
	Cause     error        `json:"-"`
	Timestamp time.Time    `json:"timestamp"`
	TraceID   string       `json:"traceId"`
	RequestID string       `json:"requestId,omitempty"`
	UserID    string       `json:"userId,omitempty"`
	Operation string       `json:"operation,omitempty"`
	Stack     []StackFrame `json:"stack,omitempty"`
}

// StackFrame represents a stack frame for debugging
type StackFrame struct {
	File     string `json:"file"`
	Line     int    `json:"line"`
	Function string `json:"function"`
}

// NewAppError creates a new application error
func NewAppError(code ErrorCode, message string, cause error) *AppError {
	return &AppError{
		Code:      code,
		Message:   message,
		Cause:     cause,
		Timestamp: time.Now(),
		TraceID:   uuid.New().String(),
		Stack:     captureStack(),
	}
}

// NewValidationError creates a validation error
func NewValidationError(message string, cause error) *AppError {
	return NewAppError(ErrCodeValidation, message, cause)
}

// NewDatabaseError creates a database error
func NewDatabaseError(operation string, cause error) *AppError {
	return NewAppError(ErrCodeDatabase, fmt.Sprintf("Database operation failed: %s", operation), cause)
}

// NewNotFoundError creates a not found error
func NewNotFoundError(resource string, id string) *AppError {
	return NewAppError(ErrCodeNotFound, fmt.Sprintf("%s with ID '%s' not found", resource, id), nil)
}

// NewUnauthorizedError creates an unauthorized error
func NewUnauthorizedError(message string) *AppError {
	return NewAppError(ErrCodeUnauthorized, message, nil)
}

// NewBusinessRuleError creates a business rule violation error
func NewBusinessRuleError(rule string, message string) *AppError {
	return NewAppError(ErrCodeBusinessRule, fmt.Sprintf("Business rule '%s' violated: %s", rule, message), nil)
}

// NewWeighingError creates a weighing-specific error
func NewWeighingError(operation string, cause error) *AppError {
	return NewAppError(ErrCodeWeighingFailed, fmt.Sprintf("Weighing operation '%s' failed", operation), cause)
}

// NewSyncError creates a synchronization error
func NewSyncError(operation string, cause error) *AppError {
	return NewAppError(ErrCodeSyncFailed, fmt.Sprintf("Sync operation '%s' failed", operation), cause)
}

// WithContext adds context information to the error
func (e *AppError) WithContext(requestID, userID, operation string) *AppError {
	e.RequestID = requestID
	e.UserID = userID
	e.Operation = operation
	return e
}

// WithDetails adds additional details to the error
func (e *AppError) WithDetails(details string) *AppError {
	e.Details = details
	return e
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Cause)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Unwrap returns the underlying cause
func (e *AppError) Unwrap() error {
	return e.Cause
}

// HTTPStatus returns the appropriate HTTP status code
func (e *AppError) HTTPStatus() int {
	if status, exists := errorCodeHTTPStatus[e.Code]; exists {
		return status
	}
	return http.StatusInternalServerError
}

// IsClientError returns true if the error is a client-side error (4xx)
func (e *AppError) IsClientError() bool {
	status := e.HTTPStatus()
	return status >= 400 && status < 500
}

// IsServerError returns true if the error is a server-side error (5xx)
func (e *AppError) IsServerError() bool {
	status := e.HTTPStatus()
	return status >= 500
}

// IsRetryable returns true if the error might be resolved by retrying
func (e *AppError) IsRetryable() bool {
	retryableCodes := map[ErrorCode]bool{
		ErrCodeNetwork:    true,
		ErrCodeTimeout:    true,
		ErrCodeSyncFailed: true,
		ErrCodeInternal:   true,
	}
	return retryableCodes[e.Code]
}

// captureStack captures the current stack trace
func captureStack() []StackFrame {
	var pcs [32]uintptr
	n := runtime.Callers(3, pcs[:])
	frames := make([]StackFrame, 0, n)

	for _, pc := range pcs[:n] {
		fn := runtime.FuncForPC(pc)
		if fn == nil {
			continue
		}

		file, line := fn.FileLine(pc)
		frames = append(frames, StackFrame{
			File:     file,
			Line:     line,
			Function: fn.Name(),
		})
	}

	return frames
}

// ErrorHandler interface for centralized error handling
type ErrorHandler interface {
	Handle(ctx context.Context, err error) *AppError
	Report(ctx context.Context, err *AppError) error
	Recover(ctx context.Context) error
}

// DefaultErrorHandler provides default error handling implementation
type DefaultErrorHandler struct {
	logger Logger
}

// NewErrorHandler creates a new error handler
func NewErrorHandler(logger Logger) ErrorHandler {
	return &DefaultErrorHandler{logger: logger}
}

// Handle converts any error to an AppError
func (h *DefaultErrorHandler) Handle(ctx context.Context, err error) *AppError {
	if err == nil {
		return nil
	}

	// If it's already an AppError, return it
	if appErr, ok := err.(*AppError); ok {
		return appErr
	}

	// Convert common error types to AppError
	switch err.Error() {
	case "record not found":
		return NewNotFoundError("record", "unknown")
	case "duplicate key":
		return NewAppError(ErrCodeDuplicate, "Duplicate entry", err)
	case "timeout":
		return NewAppError(ErrCodeTimeout, "Operation timed out", err)
	default:
		return NewAppError(ErrCodeInternal, "Internal server error", err)
	}
}

// Report logs the error for monitoring
func (h *DefaultErrorHandler) Report(ctx context.Context, err *AppError) error {
	fields := map[string]interface{}{
		"error_code":   err.Code,
		"error_msg":    err.Message,
		"trace_id":     err.TraceID,
		"request_id":   err.RequestID,
		"user_id":      err.UserID,
		"operation":    err.Operation,
		"http_status":  err.HTTPStatus(),
		"is_client":    err.IsClientError(),
		"is_retryable": err.IsRetryable(),
	}

	if err.Details != "" {
		fields["details"] = err.Details
	}

	if err.IsServerError() {
		h.logger.Error(ctx, "Server error occurred", err, fields)
	} else {
		h.logger.Warn(ctx, "Client error occurred", fields)
	}

	return nil
}

// Recover handles panics and converts them to errors
func (h *DefaultErrorHandler) Recover(ctx context.Context) error {
	if r := recover(); r != nil {
		var err error
		switch x := r.(type) {
		case error:
			err = x
		case string:
			err = fmt.Errorf(x)
		default:
			err = fmt.Errorf("panic: %v", x)
		}

		appErr := NewAppError(ErrCodeInternal, "Application panic occurred", err)
		appErr.Details = fmt.Sprintf("Panic recovered: %v", r)

		h.Report(ctx, appErr)
		return appErr
	}
	return nil
}
