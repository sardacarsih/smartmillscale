package main

import (
	"encoding/json"
	"fmt"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/serial"
)

// Weight monitoring operations

func (a *App) StartWeightMonitoring() error {
	// Ensure authenticated services are initialized
	if err := a.RequireAuthenticatedServices(); err != nil {
		return err
	}

	return a.handler.HandleVoid(func() error {
		return a.application.Container.WeightMonitoringController.StartMonitoring()
	})
}

func (a *App) StopWeightMonitoring() error {
	// If services are not ready (e.g., after logout), gracefully return
	if !a.servicesReady || a.application == nil {
		a.logger.Info("StopWeightMonitoring called but services not ready - skipping", nil)
		return nil
	}

	return a.handler.HandleVoid(func() error {
		return a.application.Container.WeightMonitoringController.StopMonitoring()
	})
}

func (a *App) IsWeightMonitoringActive() (string, error) {
	// If services are not ready, return false
	if !a.servicesReady || a.application == nil {
		return a.handler.Handle(func() (interface{}, error) {
			return map[string]interface{}{
				"isMonitoring": false,
			}, nil
		})
	}

	return a.handler.Handle(func() (interface{}, error) {
		isActive := a.application.Container.WeightMonitoringController.IsMonitoring()
		return map[string]interface{}{
			"isMonitoring": isActive,
		}, nil
	})
}

func (a *App) GetCurrentWeight() (string, error) {
	// If services are not ready, return error
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeightMonitoringController.GetCurrentWeight()
	})
}

func (a *App) IsWeightScaleConnected() (string, error) {
	// If services are not ready, return disconnected
	if !a.servicesReady || a.application == nil {
		return a.handler.Handle(func() (interface{}, error) {
			return map[string]interface{}{
				"isConnected": false,
			}, nil
		})
	}

	return a.handler.Handle(func() (interface{}, error) {
		isConnected := a.application.Container.WeightMonitoringController.IsConnected()
		return map[string]interface{}{
			"isConnected": isConnected,
		}, nil
	})
}

func (a *App) GetWeightHistory(limit int, sinceTimestamp int64) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeightMonitoringController.GetWeightHistory(limit, sinceTimestamp)
	})
}

func (a *App) SubscribeToWeightEvents(subscriberID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeightMonitoringController.SubscribeToWeightEvents(subscriberID)
	})
}

func (a *App) UnsubscribeFromWeightEvents(subscriberID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeightMonitoringController.UnsubscribeFromWeightEvents(subscriberID)
	})
}

func (a *App) GetNextWeightEvent(subscriberID string) (string, error) {
	if a.application == nil || a.application.Container == nil {
		return "", fmt.Errorf("application not initialized")
	}

	result, err := a.application.Container.WeightMonitoringController.GetNextWeightEvent(subscriberID)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(result)
	if err != nil {
		return "", fmt.Errorf("failed to marshal response: %w", err)
	}

	return string(responseJSON), nil
}

// Event-driven real-time updates

// startWeightEventStream starts a goroutine to stream weight updates to frontend
func (a *App) startWeightEventStream() {
	a.logger.Info("Starting weight event stream", nil)

	ticker := time.NewTicker(500 * time.Millisecond) // Update every 500ms
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			// Check if services are still ready and context is valid
			if !a.servicesReady || a.weightStreamCtx == nil {
				a.logger.Info("Weight stream stopping - services not ready", nil)
				return
			}

			if a.application != nil && a.application.Container != nil {
				// Get current weight directly from controller
				reading, err := a.application.Container.WeightMonitoringController.GetCurrentWeight()
				if err != nil {
					wailsruntime.LogError(a.ctx, fmt.Sprintf("Failed to get current weight: %v", err))
					continue
				}

				// Get connection status directly from controller
				isConnected := a.application.Container.WeightMonitoringController.IsConnected()

				// Create weight event using typed struct
				// Note: Mapping service.WeightReading to api_types.WeightEvent
				event := WeightEvent{
					Weight:    float64(reading.Weight),
					Stable:    reading.Stable,
					Phase:     0, // Phase not available in WeightReading
					Timestamp: time.Now(),
					DeviceID:  getDeviceID(),
					Unit:      reading.Unit,
				}
				if event.Unit == "" {
					event.Unit = "kg"
				}

				// Create connection status event using typed struct
				connectionEvent := ConnectionStatus{
					IsConnected: isConnected,
					DeviceID:    getDeviceID(),
				}

				// Emit events to frontend
				wailsruntime.EventsEmit(a.ctx, "weight_update", event)
				wailsruntime.EventsEmit(a.ctx, "connection_status", connectionEvent)
			}
		case <-a.weightStreamCtx.Done():
			// Context cancelled - logout occurred
			a.logger.Info("Weight event stream stopped - logout/cleanup", nil)
			return
		case <-a.ctx.Done():
			// Application shutdown
			a.logger.Info("Weight event stream stopped - application shutdown", nil)
			return
		}
	}
}

// StartWeightMonitoringTyped starts weight monitoring with proper error handling
func (a *App) StartWeightMonitoringTyped() error {
	if a.application == nil || a.application.Container == nil {
		return fmt.Errorf("application not initialized")
	}

	if err := a.StartWeightMonitoring(); err != nil {
		return err
	}

	wailsruntime.EventsEmit(a.ctx, "weight_monitoring_started", map[string]interface{}{
		"timestamp": time.Now(),
		"deviceId":  getDeviceID(),
	})

	return nil
}

// StopWeightMonitoringTyped stops weight monitoring with proper error handling
func (a *App) StopWeightMonitoringTyped() error {
	if a.application == nil || a.application.Container == nil {
		return fmt.Errorf("application not initialized")
	}

	if err := a.StopWeightMonitoring(); err != nil {
		return err
	}

	wailsruntime.EventsEmit(a.ctx, "weight_monitoring_stopped", map[string]interface{}{
		"timestamp": time.Now(),
		"deviceId":  getDeviceID(),
	})

	return nil
}

// ================== COM Port Management Bindings ==================

// TestCOMPortConnection tests if a COM port can be opened successfully
func (a *App) TestCOMPortConnection(portName string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		diagnostics := serial.NewWindowsSerialDiagnostics()

		// Test port accessibility
		test := diagnostics.TestPortAccessibility(portName)

		return map[string]interface{}{
			"portName":      portName,
			"canRead":       test.CanRead,
			"canWrite":      test.CanWrite,
			"requiresAdmin": test.RequiresAdmin,
			"errorMessage":  test.ErrorMessage,
			"testTime":      test.TestTime,
		}, nil
	})
}
