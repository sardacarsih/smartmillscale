package repositories

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
)

// UserRepository defines the interface for user data access
type UserRepository interface {
	// Basic CRUD operations
	Create(ctx context.Context, user *entities.User) error
	GetByID(ctx context.Context, id uuid.UUID) (*entities.User, error)
	GetByUsername(ctx context.Context, username string) (*entities.User, error)
	Update(ctx context.Context, user *entities.User) error
	Delete(ctx context.Context, id uuid.UUID) error

	// Authentication
	GetByUsernameWithPassword(ctx context.Context, username string) (*entities.User, error)

	// Search and filtering
	Search(ctx context.Context, query string, limit int) ([]*entities.User, error)
	GetByRole(ctx context.Context, role entities.UserRole, limit int) ([]*entities.User, error)
	GetActiveUsers(ctx context.Context, limit int) ([]*entities.User, error)
	GetInactiveUsers(ctx context.Context, limit int) ([]*entities.User, error)

	// Statistics
	CountByRole(ctx context.Context, role entities.UserRole) (int, error)
	CountActiveUsers(ctx context.Context) (int, error)
	CountInactiveUsers(ctx context.Context) (int, error)

	// Batch operations
	CreateBatch(ctx context.Context, users []*entities.User) error
	UpdateBatch(ctx context.Context, users []*entities.User) error
	DeleteBatch(ctx context.Context, ids []uuid.UUID) error

	// Existence checks
	UsernameExists(ctx context.Context, username string) (bool, error)
	EmailExists(ctx context.Context, email string) (bool, error)
}