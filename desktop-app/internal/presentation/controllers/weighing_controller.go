package controllers

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/usecases"
)

// WeighingController handles Wails API calls for weighing operations
type WeighingController struct {
	weighingUseCase *usecases.WeighingUseCase
}

// NewWeighingController creates a new weighing controller
func NewWeighingController(weighingUseCase *usecases.WeighingUseCase) *WeighingController {
	return &WeighingController{
		weighingUseCase: weighingUseCase,
	}
}

// CreateWeighing creates a new weighing record (Timbang 1)
func (c *WeighingController) CreateWeighing(req *dto.CreateTimbanganRequest, operatorID string) (*dto.TimbanganResponse, error) {
	ctx := context.Background()

	operatorUUID, err := uuid.Parse(operatorID)
	if err != nil {
		return nil, err
	}

	return c.weighingUseCase.CreateWeighing(ctx, req, operatorUUID)
}

// UpdateWeighing updates an existing weighing record (Timbang 2)
func (c *WeighingController) UpdateWeighing(req *dto.UpdateTimbanganRequest, operatorID string) (*dto.TimbanganResponse, error) {
	ctx := context.Background()

	operatorUUID, err := uuid.Parse(operatorID)
	if err != nil {
		return nil, err
	}

	return c.weighingUseCase.UpdateWeighing(ctx, req, operatorUUID)
}

// GetWeighingByID retrieves a weighing by ID
func (c *WeighingController) GetWeighingByID(weighingID string) (*dto.TimbanganResponse, error) {
	ctx := context.Background()

	id, err := uuid.Parse(weighingID)
	if err != nil {
		return nil, err
	}

	return c.weighingUseCase.GetWeighingByID(ctx, id)
}

// GetPendingWeighings retrieves pending weighings
func (c *WeighingController) GetPendingWeighings(limit int) ([]*dto.PendingWeighingResponse, error) {
	ctx := context.Background()

	return c.weighingUseCase.GetPendingWeighings(ctx, limit)
}

// SearchWeighings searches weighings based on criteria
func (c *WeighingController) SearchWeighings(req *dto.TimbanganSearchRequest) (*dto.TimbanganListResponse, error) {
	ctx := context.Background()

	return c.weighingUseCase.SearchWeighings(ctx, req)
}

// GetRecentWeighings retrieves recent weighings
func (c *WeighingController) GetRecentWeighings(limit int) ([]*dto.TimbanganResponse, error) {
	ctx := context.Background()

	return c.weighingUseCase.GetRecentWeighings(ctx, limit)
}

// ValidateWeighing validates weighing data
func (c *WeighingController) ValidateWeighing(req *dto.TimbanganValidationRequest) (*dto.TimbanganValidationResponse, error) {
	ctx := context.Background()

	return c.weighingUseCase.ValidateWeighing(ctx, req)
}

// GetWeighingStatistics retrieves weighing statistics
func (c *WeighingController) GetWeighingStatistics() (*dto.WeighingStatisticsResponse, error) {
	ctx := context.Background()

	return c.weighingUseCase.GetWeighingStatistics(ctx)
}

// MarkWeighingAsSynced marks a weighing as synced
func (c *WeighingController) MarkWeighingAsSynced(req *dto.SyncTimbanganRequest) error {
	ctx := context.Background()

	return c.weighingUseCase.MarkWeighingAsSynced(ctx, req)
}
