package wails

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/bootstrap"
)

// Logger interface for structured logging
type Logger interface {
	Info(msg string, fields map[string]interface{})
	Error(msg string, err error, fields map[string]interface{})
	Debug(msg string, fields map[string]interface{})
}

// WailsHandler handles common patterns for Wails method bindings
// This eliminates repetitive code for JSON marshaling, error handling, and validation
type WailsHandler struct {
	app    *bootstrap.Application
	logger Logger
}

// NewWailsHandler creates a new Wails handler with application and logger
func NewWailsHandler(app *bootstrap.Application, logger Logger) *WailsHandler {
	return &WailsHandler{
		app:    app,
		logger: logger,
	}
}

// Handle executes a function and marshals the result to JSON string
// This is for methods that return data without request parameters
//
// Example:
//
//	handler.Handle(func() (interface{}, error) {
//	    return controller.GetAllUsers()
//	})
func (h *WailsHandler) Handle(fn func() (interface{}, error)) (string, error) {
	// Validate application is initialized
	if h.app == nil || h.app.Container == nil {
		err := fmt.Errorf("application not initialized")
		h.logError("Application check failed", err)
		return "", err
	}

	// Execute the function
	result, err := fn()
	if err != nil {
		h.logError("Handler execution failed", err)
		return "", err
	}

	// Marshal result to JSON
	responseJSON, err := json.Marshal(result)
	if err != nil {
		err = fmt.Errorf("failed to marshal response: %w", err)
		h.logError("JSON marshal failed", err)
		return "", err
	}

	return string(responseJSON), nil
}

// HandleWithRequest unmarshals request JSON, executes function, and marshals result
// This is for methods that accept JSON request parameters
//
// Example:
//
//	var req CreateUserRequest
//	handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
//	    return controller.CreateUser(&req)
//	})
func (h *WailsHandler) HandleWithRequest(
	requestJSON string,
	target interface{},
	fn func() (interface{}, error),
) (string, error) {
	// Validate application is initialized
	if h.app == nil || h.app.Container == nil {
		err := fmt.Errorf("application not initialized")
		h.logError("Application check failed", err)
		return "", err
	}

	// Unmarshal request
	if err := json.Unmarshal([]byte(requestJSON), target); err != nil {
		err = fmt.Errorf("failed to unmarshal request: %w", err)
		h.logError("JSON unmarshal failed", err)
		return "", err
	}

	// Execute with Handle
	return h.Handle(fn)
}

// HandleVoid executes a void function that returns only an error
// This is for methods that don't return data
//
// Example:
//
//	handler.HandleVoid(func() error {
//	    return controller.DeleteUser(userID)
//	})
func (h *WailsHandler) HandleVoid(fn func() error) error {
	// Validate application is initialized
	if h.app == nil || h.app.Container == nil {
		err := fmt.Errorf("application not initialized")
		h.logError("Application check failed", err)
		return err
	}

	// Execute the function
	if err := fn(); err != nil {
		h.logError("Handler void execution failed", err)
		return err
	}

	return nil
}

// HandleWithRequestVoid unmarshals request and executes void function
// This is for methods that accept JSON but return no data
//
// Example:
//
//	var req DeleteRequest
//	handler.HandleWithRequestVoid(requestJSON, &req, func() error {
//	    return controller.DeleteItem(&req)
//	})
func (h *WailsHandler) HandleWithRequestVoid(
	requestJSON string,
	target interface{},
	fn func() error,
) error {
	// Validate application is initialized
	if h.app == nil || h.app.Container == nil {
		err := fmt.Errorf("application not initialized")
		h.logError("Application check failed", err)
		return err
	}

	// Unmarshal request
	if err := json.Unmarshal([]byte(requestJSON), target); err != nil {
		err = fmt.Errorf("failed to unmarshal request: %w", err)
		h.logError("JSON unmarshal failed", err)
		return err
	}

	// Execute void function
	return h.HandleVoid(fn)
}

// logError logs an error with context if logger is available, otherwise uses standard log
func (h *WailsHandler) logError(msg string, err error) {
	if h.logger != nil {
		h.logger.Error(msg, err, map[string]interface{}{
			"error": err.Error(),
		})
	} else {
		log.Printf("ERROR: %s: %v", msg, err)
	}
}
