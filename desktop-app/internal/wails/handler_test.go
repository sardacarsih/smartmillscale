package wails

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/bootstrap"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/logger"
)

type mockLogger struct {
	infoMessages  []string
	errorMessages []string
	debugMessages []string
}

func (m *mockLogger) Info(msg string, fields map[string]interface{}) {
	m.infoMessages = append(m.infoMessages, msg)
}

func (m *mockLogger) Error(msg string, err error, fields map[string]interface{}) {
	m.errorMessages = append(m.errorMessages, msg)
}

func (m *mockLogger) Debug(msg string, fields map[string]interface{}) {
	m.debugMessages = append(m.debugMessages, msg)
}

func (m *mockLogger) Warning(msg string, fields map[string]interface{}) {
}

func TestNewWailsHandler(t *testing.T) {
	app := &bootstrap.Application{}
	log := logger.NewNoOpLogger()

	handler := NewWailsHandler(app, log)

	assert.NotNil(t, handler)
	assert.Equal(t, app, handler.app)
	assert.NotNil(t, handler.logger)
}

func TestHandle_Success(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{}, // Empty container is fine for this test
	}
	log := logger.NewNoOpLogger()
	handler := NewWailsHandler(app, log)

	// Execute
	result, err := handler.Handle(func() (interface{}, error) {
		return map[string]string{"status": "success"}, nil
	})

	// Assert
	assert.NoError(t, err)
	assert.Contains(t, result, "success")
	assert.Contains(t, result, "status")
}

func TestHandle_ApplicationNotInitialized(t *testing.T) {
	// Setup - nil application
	handler := NewWailsHandler(nil, logger.NewNoOpLogger())

	// Execute
	result, err := handler.Handle(func() (interface{}, error) {
		return "should not execute", nil
	})

	// Assert
	assert.Error(t, err)
	assert.Equal(t, "", result)
	assert.Contains(t, err.Error(), "not initialized")
}

func TestHandle_FunctionError(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	mockLog := &mockLogger{}
	handler := NewWailsHandler(app, mockLog)

	// Execute
	result, err := handler.Handle(func() (interface{}, error) {
		return nil, assert.AnError
	})

	// Assert
	assert.Error(t, err)
	assert.Equal(t, "", result)
	assert.Len(t, mockLog.errorMessages, 1)
}

func TestHandleWithRequest_Success(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	handler := NewWailsHandler(app, logger.NewNoOpLogger())

	requestJSON := `{"name": "Test User", "age": 30}`
	var target map[string]interface{}

	// Execute
	result, err := handler.HandleWithRequest(requestJSON, &target, func() (interface{}, error) {
		return map[string]interface{}{
			"received_name": target["name"],
			"received_age":  target["age"],
		}, nil
	})

	// Assert
	assert.NoError(t, err)
	assert.Contains(t, result, "Test User")
	assert.Contains(t, result, "30")
}

func TestHandleWithRequest_InvalidJSON(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	mockLog := &mockLogger{}
	handler := NewWailsHandler(app, mockLog)

	invalidJSON := `{invalid json}`
	var target map[string]interface{}

	// Execute
	result, err := handler.HandleWithRequest(invalidJSON, &target, func() (interface{}, error) {
		return "should not execute", nil
	})

	// Assert
	assert.Error(t, err)
	assert.Equal(t, "", result)
	assert.Contains(t, err.Error(), "unmarshal")
	assert.Len(t, mockLog.errorMessages, 1)
}

func TestHandleVoid_Success(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	handler := NewWailsHandler(app, logger.NewNoOpLogger())

	executed := false

	// Execute
	err := handler.HandleVoid(func() error {
		executed = true
		return nil
	})

	// Assert
	assert.NoError(t, err)
	assert.True(t, executed)
}

func TestHandleVoid_FunctionError(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	mockLog := &mockLogger{}
	handler := NewWailsHandler(app, mockLog)

	// Execute
	err := handler.HandleVoid(func() error {
		return assert.AnError
	})

	// Assert
	assert.Error(t, err)
	assert.Len(t, mockLog.errorMessages, 1)
}

func TestHandleWithRequestVoid_Success(t *testing.T) {
	// Setup
	app := &bootstrap.Application{
		Container: &bootstrap.Container{},
	}
	handler := NewWailsHandler(app, logger.NewNoOpLogger())

	requestJSON := `{"id": "123"}`
	var target map[string]interface{}
	executed := false

	// Execute
	err := handler.HandleWithRequestVoid(requestJSON, &target, func() error {
		executed = true
		assert.Equal(t, "123", target["id"])
		return nil
	})

	// Assert
	assert.NoError(t, err)
	assert.True(t, executed)
}
