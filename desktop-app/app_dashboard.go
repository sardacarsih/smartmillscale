package main

import (
	"encoding/json"
	"fmt"
	"time"
)

// DashboardData represents the structure of dashboard data
type DashboardData struct {
	ID        string        `json:"id"`
	UserID    string        `json:"user_id"`
	Layout    string        `json:"layout"`
	Widgets   []interface{} `json:"widgets"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// MetricsData represents the structure of metrics data
type MetricsData struct {
	Metrics map[string]interface{} `json:"metrics"`
}

// SystemHealth represents the structure of system health data
type SystemHealth struct {
	Status      string                 `json:"status"`
	Score       int                    `json:"score"`
	LastChecked time.Time              `json:"last_checked"`
	Services    map[string]interface{} `json:"services"`
}

// ServiceHealth represents the structure of a single service health
type ServiceHealth struct {
	Name      string      `json:"name"`
	Status    string      `json:"status"`
	LastCheck time.Time   `json:"last_check"`
	LastError interface{} `json:"last_error"`
}

// GetDashboardData retrieves dashboard configuration for a user
func (a *App) GetDashboardData(userId string) string {
	// Ensure authenticated services are initialized
	if err := a.RequireAuthenticatedServices(); err != nil {
		a.logger.Error("Dashboard access denied - not authenticated", err, map[string]interface{}{
			"user_id": userId,
		})
		return "{\"error\": \"Authentication required\"}"
	}

	// Mock data for now as we don't have a dashboard table yet
	data := DashboardData{
		ID:        userId,
		UserID:    userId,
		Layout:    "default",
		Widgets:   []interface{}{},
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error marshaling dashboard data: %v", err), err, nil)
		return "{}"
	}
	return string(jsonData)
}

// UpdateDashboardData updates dashboard configuration
func (a *App) UpdateDashboardData(dashboardId string, updates string) string {
	a.logger.Info(fmt.Sprintf("UpdateDashboardData called for %s", dashboardId), nil)
	// Mock success
	return updates // Return the updates as if they were applied
}

// AddDashboardWidget adds a widget to the dashboard
func (a *App) AddDashboardWidget(userId string, widgetJSON string) string {
	a.logger.Info(fmt.Sprintf("AddDashboardWidget called for user %s", userId), nil)
	// Mock success - return the widget with an ID
	return widgetJSON
}

// UpdateDashboardWidget updates a widget
func (a *App) UpdateDashboardWidget(userId string, widgetId string, widgetJSON string) string {
	a.logger.Info(fmt.Sprintf("UpdateDashboardWidget called for widget %s", widgetId), nil)
	// Mock success
	return widgetJSON
}

// RemoveDashboardWidget removes a widget
func (a *App) RemoveDashboardWidget(userId string, widgetId string) string {
	a.logger.Info(fmt.Sprintf("RemoveDashboardWidget called for widget %s", widgetId), nil)
	// Mock success
	return `{"success": true}`
}

// UpdateDashboardLayout updates the dashboard layout
func (a *App) UpdateDashboardLayout(userId string, layoutJSON string) string {
	a.logger.Info(fmt.Sprintf("UpdateDashboardLayout called for user %s", userId), nil)
	// Mock success
	return layoutJSON
}

// RefreshDashboard refreshes dashboard data
func (a *App) RefreshDashboard(userId string) string {
	a.logger.Info(fmt.Sprintf("RefreshDashboard called for user %s", userId), nil)
	return a.GetDashboardData(userId)
}

// GetMetricsData retrieves metrics for a user/role
func (a *App) GetMetricsData(userId string, role string) string {
	if a.application == nil || a.application.Container == nil || a.application.Container.PKSService == nil {
		a.logger.Error("PKSService not initialized", nil, nil)
		return "{}"
	}

	// Get PKS statistics for the last 30 days
	stats, err := a.application.Container.PKSService.GetPKSStatistics(a.ctx, 30*24*time.Hour)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error getting PKS statistics: %v", err), err, nil)
		return "{}"
	}

	// Map PKS stats to generic metrics format expected by frontend
	metrics := map[string]interface{}{
		"totalWeighings": stats.TotalTransactions,
		"todayWeighings": stats.TodayTransactions,
		"averageWeight":  0, // Calculate if needed
		"systemUptime":   "N/A",
		"storageUsed":    "N/A",
		"lastSync":       "N/A",
		// Add specific PKS stats
		"timbang1Count":  stats.Timbang1Count,
		"timbang2Count":  stats.Timbang2Count,
		"completedCount": stats.CompletedCount,
		"totalWeight":    stats.TotalWeight,
	}

	if stats.CompletedCount > 0 {
		metrics["averageWeight"] = stats.TotalWeight / float64(stats.CompletedCount)
	}

	data := MetricsData{
		Metrics: metrics,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error marshaling metrics data: %v", err), err, nil)
		return "{}"
	}
	return string(jsonData)
}

// GetSyncMetrics retrieves sync-specific metrics
func (a *App) GetSyncMetrics() string {
	if a.application == nil || a.application.Container == nil || a.application.Container.SyncController == nil {
		a.logger.Error("SyncController not initialized", nil, nil)
		return "{}"
	}

	// Use SyncController to get stats
	// Note: SyncController.GetSyncStatistics returns a JSON string directly
	statsJSON, err := a.application.Container.SyncController.GetSyncStatistics()
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error getting sync statistics: %v", err), err, nil)
		return "{}"
	}

	// Wrap in MetricsData structure if needed, but SyncController likely returns the right structure
	// Let's check if we need to wrap it. The frontend expects { metrics: { ... } }
	// If SyncController returns just { ... }, we might need to wrap it.
	// Assuming SyncController returns the raw stats object, let's parse and wrap.

	var syncStats map[string]interface{}
	if err := json.Unmarshal([]byte(statsJSON), &syncStats); err != nil {
		a.logger.Error(fmt.Sprintf("Error unmarshaling sync stats: %v", err), err, nil)
		return "{}"
	}

	data := MetricsData{
		Metrics: syncStats,
	}

	jsonData, err := json.Marshal(data)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error marshaling sync metrics: %v", err), err, nil)
		return "{}"
	}
	return string(jsonData)
}

// GetSystemHealth retrieves overall system health
func (a *App) GetSystemHealth() string {
	dbStatus := "healthy"
	if a.application == nil || a.application.Container == nil || a.application.Container.DB == nil {
		dbStatus = "down"
	} else {
		sqlDB, err := a.application.Container.DB.DB()
		if err != nil || sqlDB.Ping() != nil {
			dbStatus = "down"
		}
	}

	// Mock other services for now, or check them if possible
	health := SystemHealth{
		Status:      dbStatus,
		Score:       100, // Calculate based on services
		LastChecked: time.Now(),
		Services: map[string]interface{}{
			"database":          map[string]interface{}{"status": dbStatus, "last_check": time.Now()},
			"serial":            map[string]interface{}{"status": "healthy", "last_check": time.Now()}, // TODO: Check real serial status
			"sync":              map[string]interface{}{"status": "healthy", "last_check": time.Now()},
			"weight_monitoring": map[string]interface{}{"status": "healthy", "last_check": time.Now()},
		},
	}

	if dbStatus != "healthy" {
		health.Status = "critical"
		health.Score = 50
	}

	jsonData, err := json.Marshal(health)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error marshaling system health: %v", err), err, nil)
		return "{}"
	}
	return string(jsonData)
}

// GetServiceHealth retrieves health for a specific service
func (a *App) GetServiceHealth(serviceName string) string {
	status := "healthy"
	// Simple check for database
	if serviceName == "database" {
		if a.application == nil || a.application.Container == nil || a.application.Container.DB == nil {
			status = "down"
		} else {
			sqlDB, err := a.application.Container.DB.DB()
			if err != nil || sqlDB.Ping() != nil {
				status = "down"
			}
		}
	}

	health := ServiceHealth{
		Name:      serviceName,
		Status:    status,
		LastCheck: time.Now(),
		LastError: nil,
	}

	jsonData, err := json.Marshal(health)
	if err != nil {
		a.logger.Error(fmt.Sprintf("Error marshaling service health: %v", err), err, nil)
		return "{}"
	}
	return string(jsonData)
}
