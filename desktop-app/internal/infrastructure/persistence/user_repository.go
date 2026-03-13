package persistence

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/mappers"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/infrastructure/persistence/models"
)

// UserRepositoryImpl implements the UserRepository interface
type UserRepositoryImpl struct {
	BaseRepository
	mapper *mappers.UserMapper
}

// NewUserRepository creates a new UserRepository implementation
func NewUserRepository(db *gorm.DB) repositories.UserRepository {
	return &UserRepositoryImpl{
		BaseRepository: BaseRepository{db: db},
		mapper:        mappers.NewUserMapper(),
	}
}

// Create creates a new user
func (r *UserRepositoryImpl) Create(ctx context.Context, user *entities.User) error {
	if user == nil {
		return errors.New("user cannot be nil")
	}

	model := r.mapper.ToModel(user)
	return r.WithContext(ctx).Create(model).Error
}

// GetByID retrieves a user by ID
func (r *UserRepositoryImpl) GetByID(ctx context.Context, id uuid.UUID) (*entities.User, error) {
	var model models.UserModel
	err := r.WithContext(ctx).Where("id = ?", id).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return r.mapper.ToEntity(&model), nil
}

// GetByUsername retrieves a user by username
func (r *UserRepositoryImpl) GetByUsername(ctx context.Context, username string) (*entities.User, error) {
	var model models.UserModel
	err := r.WithContext(ctx).Where("username = ?", username).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return r.mapper.ToEntity(&model), nil
}

// Update updates a user
func (r *UserRepositoryImpl) Update(ctx context.Context, user *entities.User) error {
	if user == nil {
		return errors.New("user cannot be nil")
	}

	model := r.mapper.ToModel(user)
	return r.WithContext(ctx).Save(model).Error
}

// Delete deletes a user
func (r *UserRepositoryImpl) Delete(ctx context.Context, id uuid.UUID) error {
	return r.WithContext(ctx).Where("id = ?", id).Delete(&models.UserModel{}).Error
}

// GetByUsernameWithPassword retrieves a user with password hash (for authentication)
func (r *UserRepositoryImpl) GetByUsernameWithPassword(ctx context.Context, username string) (*entities.User, error) {
	var model models.UserModel
	err := r.WithContext(ctx).Where("username = ?", username).First(&model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, err
	}
	return r.mapper.ToEntity(&model), nil
}

// Search searches users by query
func (r *UserRepositoryImpl) Search(ctx context.Context, query string, limit int) ([]*entities.User, error) {
	var models []models.UserModel
	searchQuery := r.WithContext(ctx).
		Where("username LIKE ? OR full_name LIKE ? OR email LIKE ?", "%"+query+"%", "%"+query+"%", "%"+query+"%").
		Order("username ASC")

	if limit > 0 {
		searchQuery = searchQuery.Limit(limit)
	}

	err := searchQuery.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.mapper.ToEntities(ConvertToPointerSlice(models)), nil
}

// GetByRole retrieves users by role
func (r *UserRepositoryImpl) GetByRole(ctx context.Context, role entities.UserRole, limit int) ([]*entities.User, error) {
	var models []models.UserModel
	query := r.WithContext(ctx).
		Where("role = ?", string(role)).
		Order("username ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.mapper.ToEntities(ConvertToPointerSlice(models)), nil
}

// GetActiveUsers retrieves active users
func (r *UserRepositoryImpl) GetActiveUsers(ctx context.Context, limit int) ([]*entities.User, error) {
	var models []models.UserModel
	query := r.WithContext(ctx).
		Where("is_active = ?", true).
		Order("username ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.mapper.ToEntities(ConvertToPointerSlice(models)), nil
}

// GetInactiveUsers retrieves inactive users
func (r *UserRepositoryImpl) GetInactiveUsers(ctx context.Context, limit int) ([]*entities.User, error) {
	var models []models.UserModel
	query := r.WithContext(ctx).
		Where("is_active = ?", false).
		Order("username ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	err := query.Find(&models).Error
	if err != nil {
		return nil, err
	}

	return r.mapper.ToEntities(ConvertToPointerSlice(models)), nil
}

// CountByRole counts users by role
func (r *UserRepositoryImpl) CountByRole(ctx context.Context, role entities.UserRole) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.UserModel{}).
		Where("role = ?", string(role)).
		Count(&count).Error
	return int(count), err
}

// CountActiveUsers counts active users
func (r *UserRepositoryImpl) CountActiveUsers(ctx context.Context) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.UserModel{}).
		Where("is_active = ?", true).
		Count(&count).Error
	return int(count), err
}

// CountInactiveUsers counts inactive users
func (r *UserRepositoryImpl) CountInactiveUsers(ctx context.Context) (int, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.UserModel{}).
		Where("is_active = ?", false).
		Count(&count).Error
	return int(count), err
}

// CreateBatch creates multiple users in a transaction
func (r *UserRepositoryImpl) CreateBatch(ctx context.Context, users []*entities.User) error {
	if len(users) == 0 {
		return nil
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		models := r.mapper.ToModels(users)
		if len(models) == 0 {
			return nil
		}
		return tx.CreateInBatches(models, 100).Error
	})
}

// UpdateBatch updates multiple users in a transaction
func (r *UserRepositoryImpl) UpdateBatch(ctx context.Context, users []*entities.User) error {
	if len(users) == 0 {
		return nil
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		for _, user := range users {
			model := r.mapper.ToModel(user)
			if err := tx.Save(model).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// DeleteBatch deletes multiple users in a transaction
func (r *UserRepositoryImpl) DeleteBatch(ctx context.Context, ids []uuid.UUID) error {
	if len(ids) == 0 {
		return nil
	}

	return r.Transaction(ctx, func(tx *gorm.DB) error {
		return tx.Where("id IN ?", ids).Delete(&models.UserModel{}).Error
	})
}

// UsernameExists checks if username already exists
func (r *UserRepositoryImpl) UsernameExists(ctx context.Context, username string) (bool, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.UserModel{}).
		Where("username = ?", username).
		Count(&count).Error
	return count > 0, err
}

// EmailExists checks if email already exists
func (r *UserRepositoryImpl) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	err := r.WithContext(ctx).
		Model(&models.UserModel{}).
		Where("email = ?", email).
		Count(&count).Error
	return count > 0, err
}