package mappers

import (
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
)

// UserMapper handles mapping between domain entities and GORM models
type UserMapper struct{}

// NewUserMapper creates a new UserMapper
func NewUserMapper() *UserMapper {
	return &UserMapper{}
}

// ToModel maps domain entity to GORM model
func (m *UserMapper) ToModel(entity *entities.User) *models.UserModel {
	if entity == nil {
		return nil
	}

	return &models.UserModel{
		ID:                 entity.ID,
		Username:           entity.Username,
		PasswordHash:       entity.PasswordHash,
		FullName:           entity.FullName,
		Email:              entity.Email,
		Role:               string(entity.Role),
		IsActive:           entity.IsActive,
		MustChangePassword: entity.MustChangePassword,
		CreatedAt:          entity.CreatedAt,
		UpdatedAt:          entity.UpdatedAt,
		LastLoginAt:        entity.LastLoginAt,
		CreatedBy:          entity.CreatedBy,
	}
}

// ToEntity maps GORM model to domain entity
func (m *UserMapper) ToEntity(model *models.UserModel) *entities.User {
	if model == nil {
		return nil
	}

	return &entities.User{
		ID:                 model.ID,
		Username:           model.Username,
		PasswordHash:       model.PasswordHash,
		FullName:           model.FullName,
		Email:              model.Email,
		Role:               entities.UserRole(model.Role),
		IsActive:           model.IsActive,
		MustChangePassword: model.MustChangePassword,
		CreatedAt:          model.CreatedAt,
		UpdatedAt:          model.UpdatedAt,
		LastLoginAt:        model.LastLoginAt,
		CreatedBy:          model.CreatedBy,
	}
}

// ToModels maps domain entities to GORM models
func (m *UserMapper) ToModels(entities []*entities.User) []*models.UserModel {
	if len(entities) == 0 {
		return []*models.UserModel{}
	}

	models := make([]*models.UserModel, len(entities))
	for i, entity := range entities {
		models[i] = m.ToModel(entity)
	}
	return models
}

// ToEntities maps GORM models to domain entities
func (m *UserMapper) ToEntities(models []*models.UserModel) []*entities.User {
	if len(models) == 0 {
		return []*entities.User{}
	}

	entities := make([]*entities.User, len(models))
	for i, model := range models {
		entities[i] = m.ToEntity(model)
	}
	return entities
}