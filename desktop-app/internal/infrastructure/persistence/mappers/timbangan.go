package mappers

import (
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
)

// TimbanganMapper handles mapping between domain entities and GORM models
type TimbanganMapper struct{}

// NewTimbanganMapper creates a new TimbanganMapper
func NewTimbanganMapper() *TimbanganMapper {
	return &TimbanganMapper{}
}

// ToModel maps domain entity to GORM model
func (m *TimbanganMapper) ToModel(entity *entities.Timbangan) *models.TimbanganModel {
	if entity == nil {
		return nil
	}

	return &models.TimbanganModel{
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

// ToEntity maps GORM model to domain entity
func (m *TimbanganMapper) ToEntity(model *models.TimbanganModel) *entities.Timbangan {
	if model == nil {
		return nil
	}

	return &entities.Timbangan{
		IDLocal:        model.IDLocal,
		IDPusat:        model.IDPusat,
		NomorKendaraan: model.NomorKendaraan,
		BeratKotor:     model.BeratKotor,
		BeratBersih:    model.BeratBersih,
		WeighingType:   entities.WeighingType(model.WeighingType),
		QualityGrade:   model.QualityGrade,
		SupplierID:     model.SupplierID,
		Notes:          model.Notes,
		OperatorID:     model.OperatorID,
		SessionID:      model.SessionID,
		VehicleType:    model.VehicleType,
		TareWeight:     model.TareWeight,
		PhotoPath:      model.PhotoPath,
		IsBatch:        model.IsBatch,
		BatchNumber:    model.BatchNumber,
		Tanggal:        model.Tanggal,
		CreatedAt:      model.CreatedAt,
		UpdatedAt:      model.UpdatedAt,
		SyncedAt:       model.SyncedAt,
		StatusSync:     entities.SyncStatus(model.StatusSync),
		SyncVersion:    model.SyncVersion,
		ErrorMessage:   model.ErrorMessage,
		DeviceID:       model.DeviceID,
	}
}

// ToModels maps domain entities to GORM models
func (m *TimbanganMapper) ToModels(entities []*entities.Timbangan) []*models.TimbanganModel {
	if len(entities) == 0 {
		return []*models.TimbanganModel{}
	}

	models := make([]*models.TimbanganModel, len(entities))
	for i, entity := range entities {
		models[i] = m.ToModel(entity)
	}
	return models
}

// ToEntities maps GORM models to domain entities
func (m *TimbanganMapper) ToEntities(models []*models.TimbanganModel) []*entities.Timbangan {
	if len(models) == 0 {
		return []*entities.Timbangan{}
	}

	entities := make([]*entities.Timbangan, len(models))
	for i, model := range models {
		entities[i] = m.ToEntity(model)
	}
	return entities
}