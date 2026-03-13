package persistence

import (
	"context"

	"gorm.io/gorm"
)

// BaseRepository provides common functionality for all repositories
type BaseRepository struct {
	db *gorm.DB
}

// NewBaseRepository creates a new base repository
func NewBaseRepository(db *gorm.DB) *BaseRepository {
	return &BaseRepository{db: db}
}

// GetDB returns the GORM database instance
func (r *BaseRepository) GetDB() *gorm.DB {
	return r.db
}

// WithContext returns a GORM instance with context
func (r *BaseRepository) WithContext(ctx context.Context) *gorm.DB {
	return r.db.WithContext(ctx)
}

// Transaction executes a function within a database transaction
func (r *BaseRepository) Transaction(ctx context.Context, fn func(*gorm.DB) error) error {
	return r.db.WithContext(ctx).Transaction(fn)
}

// Paginate applies pagination to a query
func (r *BaseRepository) Paginate(query *gorm.DB, page, pageSize int) *gorm.DB {
	if page <= 0 {
		page = 1
	}
	if pageSize <= 0 {
		pageSize = 10
	}
	offset := (page - 1) * pageSize
	return query.Offset(offset).Limit(pageSize)
}

// ConvertToPointerSlice converts slice of models to slice of pointers
func ConvertToPointerSlice[T any](slice []T) []*T {
	pointers := make([]*T, len(slice))
	for i := range slice {
		pointers[i] = &slice[i]
	}
	return pointers
}