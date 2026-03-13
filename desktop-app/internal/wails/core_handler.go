package wails

import (
	"encoding/json"
	"fmt"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/bootstrap"
)

// WailsCoreHandler handles authentication-related operations before full application initialization
// This handler only provides access to authentication services during login phase
type WailsCoreHandler struct {
	coreApp *bootstrap.CoreApplication
	logger  Logger
}

// NewWailsCoreHandler creates a new core Wails handler with core application and logger
func NewWailsCoreHandler(coreApp *bootstrap.CoreApplication, logger Logger) *WailsCoreHandler {
	return &WailsCoreHandler{
		coreApp: coreApp,
		logger:  logger,
	}
}

// HandleCore executes a function and marshals the result to JSON string for core operations
// This is for authentication-related methods that work before full application initialization
func (h *WailsCoreHandler) HandleCore(fn func() (interface{}, error)) (string, error) {
	// Validate core application is initialized
	if h.coreApp == nil || h.coreApp.Container == nil {
		err := fmt.Errorf("core application not initialized")
		h.logError("Core application check failed", err)
		return "", err
	}

	// Execute the function
	result, err := fn()
	if err != nil {
		h.logError("Core operation failed", err)
		return "", err
	}

	// Marshal result to JSON
	jsonResult, err := json.Marshal(result)
	if err != nil {
		h.logError("Failed to marshal core result", err)
		return "", fmt.Errorf("failed to marshal result: %w", err)
	}

	return string(jsonResult), nil
}

// GetCoreServices returns the core application services
func (h *WailsCoreHandler) GetCoreServices() *bootstrap.CoreContainer {
	if h.coreApp == nil {
		return nil
	}
	return h.coreApp.Container
}

// logError logs error with context for core operations
func (h *WailsCoreHandler) logError(message string, err error) {
	if h.logger != nil {
		h.logger.Error(message, err, map[string]interface{}{
			"handler_type": "core",
		})
	}
}