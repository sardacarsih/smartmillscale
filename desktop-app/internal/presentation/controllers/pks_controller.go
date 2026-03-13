package controllers

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/database"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/service"
)

// PKSController handles PKS (Palm Oil Mill System) HTTP-like operations
type PKSController struct {
	pksService *service.PKSService
}

// NewPKSController creates a new PKS controller
func NewPKSController(pksService *service.PKSService) *PKSController {
	return &PKSController{
		pksService: pksService,
	}
}

// CreateTimbang1 creates a new PKS transaction (Timbang 1)
func (c *PKSController) CreateTimbang1(req *service.CreateTimbang1Request, operatorID string) (*database.TimbanganPKS, error) {
	// Parse operator ID
	operatorUUID, err := uuid.Parse(operatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid operator ID: %w", err)
	}

	// Set current user
	c.pksService.SetCurrentUser(operatorUUID)

	// Create transaction
	return c.pksService.CreateTimbang1(context.Background(), req)
}

// UpdateTimbang2 updates an existing PKS transaction (Timbang 2)
func (c *PKSController) UpdateTimbang2(req *service.UpdateTimbang2Request, operatorID string) (*database.TimbanganPKS, error) {
	// Parse operator ID
	operatorUUID, err := uuid.Parse(operatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid operator ID: %w", err)
	}

	// Set current user
	c.pksService.SetCurrentUser(operatorUUID)

	// Update transaction
	return c.pksService.UpdateTimbang2(context.Background(), req)
}

// CompleteTransaction completes a PKS transaction
func (c *PKSController) CompleteTransaction(noTransaksi string, operatorID string) (*database.TimbanganPKS, error) {
	// Parse operator ID
	operatorUUID, err := uuid.Parse(operatorID)
	if err != nil {
		return nil, fmt.Errorf("invalid operator ID: %w", err)
	}

	// Set current user
	c.pksService.SetCurrentUser(operatorUUID)

	// Complete transaction
	return c.pksService.CompleteTransaction(context.Background(), noTransaksi)
}

// GetPKSTimbanganByNoTransaksi retrieves a PKS transaction by transaction number
func (c *PKSController) GetPKSTimbanganByNoTransaksi(noTransaksi string) (*database.TimbanganPKS, error) {
	return c.pksService.GetPKSTimbanganByNoTransaksi(context.Background(), noTransaksi)
}

// GetPendingTimbang2 retrieves transactions waiting for Timbang 2
func (c *PKSController) GetPendingTimbang2(limit int) ([]database.TimbanganPKS, error) {
	return c.pksService.GetPendingTimbang2(context.Background(), limit)
}

// GetPendingCompletion retrieves transactions waiting for completion
func (c *PKSController) GetPendingCompletion(limit int) ([]database.TimbanganPKS, error) {
	return c.pksService.GetPendingCompletion(context.Background(), limit)
}

// SearchPKSTimbangans searches PKS transactions
func (c *PKSController) SearchPKSTimbangans(req *service.SearchPKSRequest) (*service.SearchPKSResponse, error) {
	return c.pksService.SearchPKSTimbangans(context.Background(), req)
}

// GetPKSStatistics retrieves PKS statistics
func (c *PKSController) GetPKSStatistics(days int) (*service.PKSStatisticsResponse, error) {
	// Convert days to duration
	duration := time.Duration(days) * 24 * time.Hour

	return c.pksService.GetPKSStatistics(context.Background(), duration)
}
