package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// userRepository implements domain.UserRepository using SQLite
type userRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new SQLite user repository
func NewUserRepository(db *sql.DB) domain.UserRepository {
	return &userRepository{db: db}
}

// GetByID retrieves a user by ID
func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `
		SELECT id, username, full_name, email, role, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE id = ?
		LIMIT 1
	`

	var user domain.User
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, id.String()).Scan(
		&user.ID,
		&user.Username,
		&user.FullName,
		&user.Email,
		&user.Role,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return &user, nil
}

// GetByUsername retrieves a user by username
func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, full_name, email, role, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE username = ?
		LIMIT 1
	`

	var user domain.User
	var lastLoginAt sql.NullTime

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.FullName,
		&user.Email,
		&user.Role,
		&user.IsActive,
		&lastLoginAt,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if err == sql.ErrNoRows {
		return nil, domain.ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	if lastLoginAt.Valid {
		user.LastLoginAt = &lastLoginAt.Time
	}

	return &user, nil
}

// UpdateLastLogin updates the last login timestamp for a user
func (r *userRepository) UpdateLastLogin(ctx context.Context, id uuid.UUID) error {
	query := `
		UPDATE users
		SET last_login_at = ?, updated_at = ?
		WHERE id = ?
	`

	now := time.Now()
	result, err := r.db.ExecContext(ctx, query, now, now, id.String())
	if err != nil {
		return fmt.Errorf("failed to update last login: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rows == 0 {
		return domain.ErrUserNotFound
	}

	return nil
}

// GetActiveUsers retrieves all active users
func (r *userRepository) GetActiveUsers(ctx context.Context) ([]*domain.User, error) {
	query := `
		SELECT id, username, full_name, email, role, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE is_active = TRUE
		ORDER BY username
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to query active users: %w", err)
	}
	defer rows.Close()

	var users []*domain.User

	for rows.Next() {
		var user domain.User
		var lastLoginAt sql.NullTime

		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.FullName,
			&user.Email,
			&user.Role,
			&user.IsActive,
			&lastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		if lastLoginAt.Valid {
			user.LastLoginAt = &lastLoginAt.Time
		}

		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return users, nil
}

// GetUsersByRole retrieves all users with a specific role
func (r *userRepository) GetUsersByRole(ctx context.Context, role domain.Role) ([]*domain.User, error) {
	query := `
		SELECT id, username, full_name, email, role, is_active, last_login_at, created_at, updated_at
		FROM users
		WHERE role = ?
		ORDER BY username
	`

	rows, err := r.db.QueryContext(ctx, query, role)
	if err != nil {
		return nil, fmt.Errorf("failed to query users by role: %w", err)
	}
	defer rows.Close()

	var users []*domain.User

	for rows.Next() {
		var user domain.User
		var lastLoginAt sql.NullTime

		err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.FullName,
			&user.Email,
			&user.Role,
			&user.IsActive,
			&lastLoginAt,
			&user.CreatedAt,
			&user.UpdatedAt,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan user: %w", err)
		}

		if lastLoginAt.Valid {
			user.LastLoginAt = &lastLoginAt.Time
		}

		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return users, nil
}
