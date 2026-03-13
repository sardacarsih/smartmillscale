package main

import (
	"encoding/json"
	"fmt"
)

// Synchronization operations

func (a *App) TriggerManualSync(syncRequestJSON string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.TriggerManualSync(syncRequestJSON)
	})
}

func (a *App) GetSyncStatus() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.GetSyncStatus()
	})
}

func (a *App) GetSyncQueue(status string, limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.GetSyncQueue(status, limit)
	})
}

func (a *App) GetSyncHistory(limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.GetSyncHistory(limit)
	})
}

func (a *App) GetSyncStatistics() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.GetSyncStatistics()
	})
}

func (a *App) QueueForSync(entityType string, entityID string, payloadJSON string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.SyncController.QueueForSync(entityType, entityID, payloadJSON)
	})
}

func (a *App) RetryFailedSyncs() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.RetryFailedSyncs()
	})
}

func (a *App) UpdateSyncConfig(configJSON string) error {
	return a.handler.HandleVoid(func() error {
		return a.application.Container.SyncController.UpdateSyncConfig(configJSON)
	})
}

func (a *App) GetSyncConfig() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.GetSyncConfig()
	})
}

func (a *App) HealthCheck() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.SyncController.HealthCheck()
	})
}

// GetSyncStatusTyped returns type-safe sync status
func (a *App) GetSyncStatusTyped() (*SyncStatusResponse, error) {
	if a.application == nil || a.application.Container == nil {
		return nil, fmt.Errorf("application not initialized")
	}

	responseJSON, err := a.GetSyncStatus()
	if err != nil {
		return nil, err
	}

	var response SyncStatusResponse
	if err := json.Unmarshal([]byte(responseJSON), &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal sync status: %w", err)
	}

	return &response, nil
}
