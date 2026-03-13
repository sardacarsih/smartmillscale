package domain

import "errors"

// Domain errors
var (
	// Validation errors
	ErrInvalidUserID      = errors.New("invalid user ID")
	ErrInvalidRole        = errors.New("invalid role")
	ErrInvalidWidgetID    = errors.New("invalid widget ID")
	ErrNoWidgets          = errors.New("dashboard must have at least one widget")
	ErrInvalidLayout      = errors.New("invalid dashboard layout")
	ErrInvalidWidgetType  = errors.New("invalid widget type")
	ErrInvalidChartType   = errors.New("invalid chart type")

	// Repository errors
	ErrDashboardNotFound  = errors.New("dashboard not found")
	ErrUserNotFound       = errors.New("user not found")
	ErrWidgetNotFound     = errors.New("widget not found")
	ErrDuplicateDashboard = errors.New("dashboard already exists for user")
	ErrPermissionDenied   = errors.New("permission denied")

	// Use case errors
	ErrUnauthorized       = errors.New("unauthorized access")
	ErrSessionExpired     = errors.New("session expired")
	ErrInvalidCredentials = errors.New("invalid credentials")

	// Analytics errors
	ErrInvalidTimeRange   = errors.New("invalid time range")
	ErrAnalyticsDisabled  = errors.New("analytics is disabled")
	ErrInvalidEvent       = errors.New("invalid analytics event")

	// Cache errors
	ErrCacheNotFound      = errors.New("cache entry not found")
	ErrCacheExpired       = errors.New("cache entry expired")
)