package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// APIKeyRepository defines the interface for API key persistence
type APIKeyRepository interface {
	Create(ctx context.Context, apiKey *entities.APIKey) error
	FindByID(ctx context.Context, id uuid.UUID) (*entities.APIKey, error)
	FindAll(ctx context.Context) ([]entities.APIKey, error)
	Update(ctx context.Context, apiKey *entities.APIKey) error
	Delete(ctx context.Context, id uuid.UUID) error
	FindByKey(ctx context.Context, key string) (*entities.APIKey, error)
}
