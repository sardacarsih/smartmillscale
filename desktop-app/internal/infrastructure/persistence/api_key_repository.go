package persistence

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"gorm.io/gorm"
)

// APIKeyRepositoryImpl implements the APIKeyRepository interface
type APIKeyRepositoryImpl struct {
	db *gorm.DB
}

// NewAPIKeyRepository creates a new API key repository
func NewAPIKeyRepository(db *gorm.DB) repositories.APIKeyRepository {
	return &APIKeyRepositoryImpl{
		db: db,
	}
}

// Create creates a new API key
func (r *APIKeyRepositoryImpl) Create(ctx context.Context, apiKey *entities.APIKey) error {
	return r.db.WithContext(ctx).Create(apiKey).Error
}

// FindByID finds an API key by ID
func (r *APIKeyRepositoryImpl) FindByID(ctx context.Context, id uuid.UUID) (*entities.APIKey, error) {
	var apiKey entities.APIKey
	if err := r.db.WithContext(ctx).Preload("CreatorUser").First(&apiKey, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &apiKey, nil
}

// FindAll finds all API keys
func (r *APIKeyRepositoryImpl) FindAll(ctx context.Context) ([]entities.APIKey, error) {
	var apiKeys []entities.APIKey
	if err := r.db.WithContext(ctx).Preload("CreatorUser").Order("created_at desc").Find(&apiKeys).Error; err != nil {
		return nil, err
	}
	return apiKeys, nil
}

// Update updates an API key
func (r *APIKeyRepositoryImpl) Update(ctx context.Context, apiKey *entities.APIKey) error {
	return r.db.WithContext(ctx).Save(apiKey).Error
}

// Delete deletes an API key
func (r *APIKeyRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&entities.APIKey{}, "id = ?", id).Error
}

// FindByKey finds an API key by key string
func (r *APIKeyRepositoryImpl) FindByKey(ctx context.Context, key string) (*entities.APIKey, error) {
	var apiKey entities.APIKey
	if err := r.db.WithContext(ctx).First(&apiKey, "api_key = ?", key).Error; err != nil {
		return nil, err
	}
	return &apiKey, nil
}
