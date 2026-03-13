package usecases

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/dto"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
)

var (
	ErrTimbanganNotFound      = errors.New("timbangan not found")
	ErrInvalidWeight          = errors.New("invalid weight value")
	ErrVehicleAlreadyWeighed  = errors.New("vehicle already weighed today")
	ErrUnauthorized           = errors.New("unauthorized to perform weighing")
	ErrInvalidWeighingType    = errors.New("invalid weighing type")
)

// WeighingUseCase handles weighing operations business logic
type WeighingUseCase struct {
	timbanganRepo repositories.TimbanganRepository
	deviceRepo    repositories.DeviceRepository
	sessionRepo   repositories.WeighingSessionRepository
	currentDevice string
}

// NewWeighingUseCase creates a new weighing use case
func NewWeighingUseCase(
	timbanganRepo repositories.TimbanganRepository,
	deviceRepo repositories.DeviceRepository,
	sessionRepo repositories.WeighingSessionRepository,
	deviceID string,
) *WeighingUseCase {
	return &WeighingUseCase{
		timbanganRepo: timbanganRepo,
		deviceRepo:    deviceRepo,
		sessionRepo:   sessionRepo,
		currentDevice: deviceID,
	}
}

// CreateWeighing creates a new weighing record (Timbang 1 - Insert)
func (uc *WeighingUseCase) CreateWeighing(ctx context.Context, req *dto.CreateTimbanganRequest, operatorID uuid.UUID) (*dto.TimbanganResponse, error) {
	// Validate request
	if err := uc.validateCreateRequest(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Check if vehicle already weighed today (prevent duplicate weighing for same day)
	existing, err := uc.timbanganRepo.GetByNomorKendaraanAndTanggal(ctx, req.NomorKendaraan, time.Now())
	if err == nil && existing != nil {
		return nil, ErrVehicleAlreadyWeighed
	}

	// Create domain entity
	weighingType := entities.WeighingTypeNet
	if req.WeighingType != "" {
		weighingType = entities.WeighingType(req.WeighingType)
	}

	timbangan := entities.NewTimbangan(req.NomorKendaraan, req.BeratKotor, req.BeratBersih, operatorID, uc.currentDevice)

	// Set additional fields
	timbangan.WeighingType = weighingType
	timbangan.QualityGrade = req.QualityGrade
	timbangan.SupplierID = req.SupplierID
	timbangan.Notes = req.Notes
	timbangan.SessionID = req.SessionID
	timbangan.VehicleType = req.VehicleType
	timbangan.TareWeight = req.TareWeight
	timbangan.PhotoPath = req.PhotoPath
	timbangan.IsBatch = req.IsBatch
	timbangan.BatchNumber = req.BatchNumber

	// Save to repository
	if err := uc.timbanganRepo.Create(ctx, timbangan); err != nil {
		return nil, fmt.Errorf("failed to create timbangan: %w", err)
	}

	// Update weighing session if session ID provided
	if req.SessionID != nil {
		if err := uc.updateWeighingSession(ctx, *req.SessionID, req.BeratBersih); err != nil {
			// Log error but don't fail the operation
			fmt.Printf("Warning: failed to update weighing session: %v\n", err)
		}
	}

	return uc.entityToResponse(timbangan), nil
}

// UpdateWeighing updates an existing weighing record (Timbang 2 - Update)
func (uc *WeighingUseCase) UpdateWeighing(ctx context.Context, req *dto.UpdateTimbanganRequest, operatorID uuid.UUID) (*dto.TimbanganResponse, error) {
	// Validate request
	if err := uc.validateUpdateRequest(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Get existing timbangan
	existing, err := uc.timbanganRepo.GetByID(ctx, req.IDLocal)
	if err != nil {
		return nil, ErrTimbanganNotFound
	}

	// Validate operator permission
	if existing.OperatorID != operatorID {
		return nil, ErrUnauthorized
	}

	// Update entity fields
	weighingType := entities.WeighingTypeNet
	if req.WeighingType != "" {
		weighingType = entities.WeighingType(req.WeighingType)
	}

	existing.UpdateWeight(req.BeratKotor, req.BeratBersih, weighingType)
	existing.QualityGrade = req.QualityGrade
	existing.SupplierID = req.SupplierID
	existing.Notes = req.Notes
	existing.VehicleType = req.VehicleType
	existing.TareWeight = req.TareWeight
	existing.PhotoPath = req.PhotoPath
	existing.IsBatch = req.IsBatch
	existing.BatchNumber = req.BatchNumber

	// Save changes
	if err := uc.timbanganRepo.Update(ctx, existing); err != nil {
		return nil, fmt.Errorf("failed to update timbangan: %w", err)
	}

	// Update weighing session if session ID exists
	if existing.SessionID != nil {
		if err := uc.updateWeighingSession(ctx, *existing.SessionID, req.BeratBersih); err != nil {
			// Log error but don't fail the operation
			fmt.Printf("Warning: failed to update weighing session: %v\n", err)
		}
	}

	return uc.entityToResponse(existing), nil
}

// GetWeighingByID retrieves a weighing by ID
func (uc *WeighingUseCase) GetWeighingByID(ctx context.Context, id uuid.UUID) (*dto.TimbanganResponse, error) {
	timbangan, err := uc.timbanganRepo.GetByID(ctx, id)
	if err != nil {
		return nil, ErrTimbanganNotFound
	}

	return uc.entityToResponse(timbangan), nil
}

// GetPendingWeighings retrieves pending weighings for completion
func (uc *WeighingUseCase) GetPendingWeighings(ctx context.Context, limit int) ([]*dto.PendingWeighingResponse, error) {
	timbangans, err := uc.timbanganRepo.GetPendingWeighings(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get pending weighings: %w", err)
	}

	responses := make([]*dto.PendingWeighingResponse, len(timbangans))
	for i, t := range timbangans {
		responses[i] = &dto.PendingWeighingResponse{
			IDLocal:        t.IDLocal,
			NomorKendaraan: t.NomorKendaraan,
			BeratKotor:     t.BeratKotor,
			BeratBersih:    t.BeratBersih,
			Tanggal:        t.Tanggal,
			CreatedAt:      t.CreatedAt,
			StatusSync:     string(t.StatusSync),
			WeighingType:   string(t.WeighingType),
			QualityGrade:   t.QualityGrade,
			VehicleType:    t.VehicleType,
			OperatorID:     t.OperatorID,
			DeviceID:       t.DeviceID,
		}
	}

	return responses, nil
}

// SearchWeighings searches weighings based on criteria
func (uc *WeighingUseCase) SearchWeighings(ctx context.Context, req *dto.TimbanganSearchRequest) (*dto.TimbanganListResponse, error) {
	// For now, implement basic search by query
	// In a real implementation, you would build complex queries based on all search criteria
	timbangans, err := uc.timbanganRepo.Search(ctx, req.Query, req.Limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search weighings: %w", err)
	}

	responses := make([]dto.TimbanganResponse, len(timbangans))
	for i, t := range timbangans {
		responses[i] = *uc.entityToResponse(t)
	}

	return &dto.TimbanganListResponse{
		Data:       responses,
		Total:      len(responses),
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: 1, // Simplified for now
	}, nil
}

// GetRecentWeighings retrieves recent weighings
func (uc *WeighingUseCase) GetRecentWeighings(ctx context.Context, limit int) ([]*dto.TimbanganResponse, error) {
	timbangans, err := uc.timbanganRepo.GetRecentWeighings(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent weighings: %w", err)
	}

	responses := make([]*dto.TimbanganResponse, len(timbangans))
	for i, t := range timbangans {
		responses[i] = uc.entityToResponse(t)
	}

	return responses, nil
}

// ValidateWeighing validates weighing data before processing
func (uc *WeighingUseCase) ValidateWeighing(ctx context.Context, req *dto.TimbanganValidationRequest) (*dto.TimbanganValidationResponse, error) {
	response := &dto.TimbanganValidationResponse{
		IsValid:    true,
		Warnings:   []string{},
		Errors:     []string{},
		CanProceed: true,
	}

	// Basic weight validation
	if req.BeratKotor < 0 || req.BeratBersih < 0 {
		response.IsValid = false
		response.Errors = append(response.Errors, "Weight cannot be negative")
		response.CanProceed = false
	}

	if req.BeratBersih > req.BeratKotor && req.TareWeight == 0 {
		response.Warnings = append(response.Warnings, "Net weight exceeds gross weight without tare weight specified")
	}

	// Vehicle type validation
	if req.VehicleType != "" {
		// In a real implementation, you would validate against known vehicle types
		// For now, just check if it's not empty
	}

	// Check if vehicle already weighed today
	existing, err := uc.timbanganRepo.GetByNomorKendaraanAndTanggal(ctx, req.NomorKendaraan, time.Now())
	if err == nil && existing != nil {
		response.Warnings = append(response.Warnings, "Vehicle already weighed today")
	}

	return response, nil
}

// GetWeighingStatistics retrieves weighing statistics
func (uc *WeighingUseCase) GetWeighingStatistics(ctx context.Context) (*dto.WeighingStatisticsResponse, error) {
	// Get counts
	totalCount, _ := uc.timbanganRepo.CountByDateRange(ctx, time.Now().AddDate(0, 0, -30), time.Now())
	pendingCount, _ := uc.timbanganRepo.CountPendingSync(ctx)
	todayCount, _ := uc.timbanganRepo.CountByDate(ctx, time.Now())
	todayWeight, _ := uc.timbanganRepo.GetTotalWeightByDate(ctx, time.Now())

	// Calculate success rate (simplified)
	successCount := totalCount - pendingCount
	successRate := 0.0
	if totalCount > 0 {
		successRate = float64(successCount) / float64(totalCount) * 100
	}

	// Average weight calculation (simplified)
	averageWeight := 0
	if todayCount > 0 {
		averageWeight = todayWeight / todayCount
	}

	return &dto.WeighingStatisticsResponse{
		TotalWeighings:  totalCount,
		PendingWeighings: pendingCount,
		FailedWeighings: 0, // Would need separate query
		TotalWeight:      todayWeight,
		AverageWeight:    averageWeight,
		TodayWeighings:   todayCount,
		TodayWeight:      todayWeight,
		SuccessRate:      successRate,
	}, nil
}

// MarkWeighingAsSynced marks a weighing as successfully synced
func (uc *WeighingUseCase) MarkWeighingAsSynced(ctx context.Context, req *dto.SyncTimbanganRequest) error {
	if req.IsSuccess {
		return uc.timbanganRepo.MarkAsSynced(ctx, req.IDLocal, req.ServerID)
	} else {
		var err error
		if req.ErrorMessage != nil {
			err = errors.New(*req.ErrorMessage)
		}
		return uc.timbanganRepo.MarkAsSyncFailed(ctx, req.IDLocal, err)
	}
}

// Private helper methods

func (uc *WeighingUseCase) validateCreateRequest(req *dto.CreateTimbanganRequest) error {
	if req.NomorKendaraan == "" {
		return errors.New("nomor kendaraan is required")
	}
	if req.BeratKotor < 0 {
		return ErrInvalidWeight
	}
	if req.BeratBersih < 0 {
		return ErrInvalidWeight
	}
	return nil
}

func (uc *WeighingUseCase) validateUpdateRequest(req *dto.UpdateTimbanganRequest) error {
	if req.NomorKendaraan == "" {
		return errors.New("nomor kendaraan is required")
	}
	if req.BeratKotor < 0 {
		return ErrInvalidWeight
	}
	if req.BeratBersih < 0 {
		return ErrInvalidWeight
	}
	return nil
}

func (uc *WeighingUseCase) entityToResponse(entity *entities.Timbangan) *dto.TimbanganResponse {
	return &dto.TimbanganResponse{
		IDLocal:        entity.IDLocal,
		IDPusat:        entity.IDPusat,
		NomorKendaraan: entity.NomorKendaraan,
		BeratKotor:     entity.BeratKotor,
		BeratBersih:    entity.BeratBersih,
		WeighingType:   string(entity.WeighingType),
		QualityGrade:   entity.QualityGrade,
		SupplierID:     entity.SupplierID,
		Notes:          entity.Notes,
		OperatorID:     entity.OperatorID,
		SessionID:      entity.SessionID,
		VehicleType:    entity.VehicleType,
		TareWeight:     entity.TareWeight,
		PhotoPath:      entity.PhotoPath,
		IsBatch:        entity.IsBatch,
		BatchNumber:    entity.BatchNumber,
		Tanggal:        entity.Tanggal,
		CreatedAt:      entity.CreatedAt,
		UpdatedAt:      entity.UpdatedAt,
		SyncedAt:       entity.SyncedAt,
		StatusSync:     string(entity.StatusSync),
		SyncVersion:    entity.SyncVersion,
		ErrorMessage:   entity.ErrorMessage,
		DeviceID:       entity.DeviceID,
	}
}

func (uc *WeighingUseCase) updateWeighingSession(ctx context.Context, sessionID uuid.UUID, weight int) error {
	// Get session and update with new weighing
	session, err := uc.sessionRepo.GetByID(ctx, sessionID)
	if err != nil {
		return fmt.Errorf("failed to get weighing session: %w", err)
	}

	session.AddWeighing(weight)
	return uc.sessionRepo.Update(ctx, session)
}