package usecases

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
)

// APIKeyUseCase handles business logic for API keys
type APIKeyUseCase struct {
	apiKeyRepo repositories.APIKeyRepository
}

// NewAPIKeyUseCase creates a new API key use case
func NewAPIKeyUseCase(apiKeyRepo repositories.APIKeyRepository) *APIKeyUseCase {
	return &APIKeyUseCase{
		apiKeyRepo: apiKeyRepo,
	}
}

// CreateAPIKey creates a new API key
func (uc *APIKeyUseCase) CreateAPIKey(ctx context.Context, name, description, serverURL string, createdBy uuid.UUID) (*entities.APIKey, error) {
	// Generate a random key
	keyBytes := make([]byte, 32)
	if _, err := rand.Read(keyBytes); err != nil {
		return nil, err
	}
	key := hex.EncodeToString(keyBytes)

	apiKey := &entities.APIKey{
		ID:          uuid.New(),
		Name:        name,
		Key:         key,
		Description: description,
		ServerURL:   serverURL,
		IsActive:    true,
		CreatedBy:   createdBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := uc.apiKeyRepo.Create(ctx, apiKey); err != nil {
		return nil, err
	}

	return apiKey, nil
}

// GetAPIKeys returns all API keys
func (uc *APIKeyUseCase) GetAPIKeys(ctx context.Context) ([]entities.APIKey, error) {
	return uc.apiKeyRepo.FindAll(ctx)
}

// UpdateAPIKey updates an API key
func (uc *APIKeyUseCase) UpdateAPIKey(ctx context.Context, id uuid.UUID, name, description, serverURL string) (*entities.APIKey, error) {
	apiKey, err := uc.apiKeyRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	apiKey.Name = name
	apiKey.Description = description
	apiKey.ServerURL = serverURL
	apiKey.UpdatedAt = time.Now()

	if err := uc.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, err
	}

	return apiKey, nil
}

// DeleteAPIKey deletes an API key
func (uc *APIKeyUseCase) DeleteAPIKey(ctx context.Context, id uuid.UUID) error {
	return uc.apiKeyRepo.Delete(ctx, id)
}

// ToggleAPIKeyStatus toggles the active status of an API key
func (uc *APIKeyUseCase) ToggleAPIKeyStatus(ctx context.Context, id uuid.UUID, isActive bool) (*entities.APIKey, error) {
	apiKey, err := uc.apiKeyRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	apiKey.IsActive = isActive
	apiKey.UpdatedAt = time.Now()

	if err := uc.apiKeyRepo.Update(ctx, apiKey); err != nil {
		return nil, err
	}

	return apiKey, nil
}

// ValidateAPIKey validates an API key
func (uc *APIKeyUseCase) ValidateAPIKey(ctx context.Context, key string) (*entities.APIKey, error) {
	apiKey, err := uc.apiKeyRepo.FindByKey(ctx, key)
	if err != nil {
		return nil, errors.New("invalid API key")
	}

	if !apiKey.IsActive {
		return nil, errors.New("API key is inactive")
	}

	// Update last used timestamp
	now := time.Now()
	apiKey.LastUsedAt = &now
	_ = uc.apiKeyRepo.Update(ctx, apiKey) // Ignore error for updating timestamp

	return apiKey, nil
}
