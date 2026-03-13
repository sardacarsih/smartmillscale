package main

import (
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
)

// Weighing operations

// Legacy JSON-based method (for backward compatibility)
func (a *App) CreateWeighing(requestJSON string, operatorID string) (string, error) {
	// Ensure authenticated services are initialized
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	var req dto.CreateTimbanganRequest
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.WeighingController.CreateWeighing(&req, operatorID)
	})
}

func (a *App) UpdateWeighing(requestJSON string, operatorID string) (string, error) {
	var req dto.UpdateTimbanganRequest
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.WeighingController.UpdateWeighing(&req, operatorID)
	})
}

func (a *App) GetWeighingByID(weighingID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeighingController.GetWeighingByID(weighingID)
	})
}

func (a *App) GetPendingWeighings(limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeighingController.GetPendingWeighings(limit)
	})
}

func (a *App) SearchWeighings(searchRequestJSON string) (string, error) {
	var req dto.TimbanganSearchRequest
	return a.handler.HandleWithRequest(searchRequestJSON, &req, func() (interface{}, error) {
		return a.application.Container.WeighingController.SearchWeighings(&req)
	})
}

func (a *App) GetRecentWeighings(limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeighingController.GetRecentWeighings(limit)
	})
}

func (a *App) ValidateWeighing(validationRequestJSON string) (string, error) {
	var req dto.TimbanganValidationRequest
	return a.handler.HandleWithRequest(validationRequestJSON, &req, func() (interface{}, error) {
		return a.application.Container.WeighingController.ValidateWeighing(&req)
	})
}

func (a *App) GetWeighingStatistics() (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.WeighingController.GetWeighingStatistics()
	})
}

func (a *App) MarkWeighingAsSynced(syncRequestJSON string) error {
	var req dto.SyncTimbanganRequest
	return a.handler.HandleWithRequestVoid(syncRequestJSON, &req, func() error {
		return a.application.Container.WeighingController.MarkWeighingAsSynced(&req)
	})
}
