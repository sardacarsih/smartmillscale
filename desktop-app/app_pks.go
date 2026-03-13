package main

import (
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// PKS Operations

// CreateTimbang1 creates a new PKS transaction (Timbang 1)
func (a *App) CreateTimbang1(requestJSON string, operatorID string) (string, error) {
	var req service.CreateTimbang1Request
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.PKSController.CreateTimbang1(&req, operatorID)
	})
}

// UpdateTimbang2 updates an existing PKS transaction (Timbang 2)
func (a *App) UpdateTimbang2(requestJSON string, operatorID string) (string, error) {
	var req service.UpdateTimbang2Request
	return a.handler.HandleWithRequest(requestJSON, &req, func() (interface{}, error) {
		return a.application.Container.PKSController.UpdateTimbang2(&req, operatorID)
	})
}

// CompleteTransaction completes a PKS transaction
func (a *App) CompleteTransaction(noTransaksi string, operatorID string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSController.CompleteTransaction(noTransaksi, operatorID)
	})
}

// GetPKSTimbanganByNoTransaksi retrieves a PKS transaction by transaction number
func (a *App) GetPKSTimbanganByNoTransaksi(noTransaksi string) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSController.GetPKSTimbanganByNoTransaksi(noTransaksi)
	})
}

// GetPendingTimbang2 retrieves transactions waiting for Timbang 2
func (a *App) GetPendingTimbang2(limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSController.GetPendingTimbang2(limit)
	})
}

// GetPendingCompletion retrieves transactions waiting for completion
func (a *App) GetPendingCompletion(limit int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSController.GetPendingCompletion(limit)
	})
}

// SearchPKSTimbangans searches PKS transactions
func (a *App) SearchPKSTimbangans(searchRequestJSON string) (string, error) {
	var req service.SearchPKSRequest
	return a.handler.HandleWithRequest(searchRequestJSON, &req, func() (interface{}, error) {
		return a.application.Container.PKSController.SearchPKSTimbangans(&req)
	})
}

// GetPKSStatistics retrieves PKS statistics
func (a *App) GetPKSStatistics(days int) (string, error) {
	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.PKSController.GetPKSStatistics(days)
	})
}
