package controllers

import (
	"context"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/usecases"
)

// SyncController handles Wails API calls for synchronization
type SyncController struct {
	syncUseCase *usecases.SyncUseCase
}

// NewSyncController creates a new sync controller
func NewSyncController(syncUseCase *usecases.SyncUseCase) *SyncController {
	return &SyncController{
		syncUseCase: syncUseCase,
	}
}

// TriggerManualSync triggers manual synchronization
// Wails binding method
func (c *SyncController) TriggerManualSync(syncRequestJSON string) (string, error) {
	ctx := context.Background()

	var req dto.SyncRequest
	if err := json.Unmarshal([]byte(syncRequestJSON), &req); err != nil {
		return "", err
	}

	response, err := c.syncUseCase.TriggerManualSync(ctx, &req)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// GetSyncStatus returns current sync status
// Wails binding method
func (c *SyncController) GetSyncStatus() (string, error) {
	ctx := context.Background()

	response, err := c.syncUseCase.GetSyncStatus(ctx)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// GetSyncQueue returns sync queue items
// Wails binding method
func (c *SyncController) GetSyncQueue(status string, limit int) (string, error) {
	ctx := context.Background()

	responses, err := c.syncUseCase.GetSyncQueue(ctx, status, limit)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(responses)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// GetSyncHistory returns sync history
// Wails binding method
func (c *SyncController) GetSyncHistory(limit int) (string, error) {
	ctx := context.Background()

	responses, err := c.syncUseCase.GetSyncHistory(ctx, limit)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(responses)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// GetSyncStatistics returns sync statistics
// Wails binding method
func (c *SyncController) GetSyncStatistics() (string, error) {
	ctx := context.Background()

	response, err := c.syncUseCase.GetSyncStatistics(ctx)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// QueueForSync queues an entity for synchronization
// Wails binding method
func (c *SyncController) QueueForSync(entityType string, entityID string, payloadJSON string) error {
	ctx := context.Background()

	id, err := uuid.Parse(entityID)
	if err != nil {
		return err
	}

	var payload interface{}
	if err := json.Unmarshal([]byte(payloadJSON), &payload); err != nil {
		return err
	}

	return c.syncUseCase.QueueForSync(ctx, entityType, id, payload)
}

// RetryFailedSyncs retries failed sync items
// Wails binding method
func (c *SyncController) RetryFailedSyncs() (string, error) {
	ctx := context.Background()

	response, err := c.syncUseCase.RetryFailedSyncs(ctx)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}

// UpdateSyncConfig updates sync configuration
// Wails binding method
func (c *SyncController) UpdateSyncConfig(configJSON string) error {
	var config dto.SyncConfig
	if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
		return err
	}

	c.syncUseCase.UpdateSyncConfig(&config)
	return nil
}

// GetSyncConfig returns current sync configuration
// Wails binding method
func (c *SyncController) GetSyncConfig() (string, error) {
	config := c.syncUseCase.GetSyncConfig()

	configJSON, err := json.Marshal(config)
	if err != nil {
		return "", err
	}

	return string(configJSON), nil
}

// HealthCheck performs sync system health check
// Wails binding method
func (c *SyncController) HealthCheck() (string, error) {
	ctx := context.Background()

	response, err := c.syncUseCase.HealthCheck(ctx)
	if err != nil {
		return "", err
	}

	responseJSON, err := json.Marshal(response)
	if err != nil {
		return "", err
	}

	return string(responseJSON), nil
}