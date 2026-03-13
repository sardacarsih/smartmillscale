package sqlite

import (
	"database/sql"
	"fmt"
)

// Migration represents a database migration
type Migration struct {
	Version int
	Name    string
	SQL     string
}

// GetMigrations returns all dashboard-related migrations
func GetMigrations() []Migration {
	return []Migration{
		{
			Version: 1,
			Name:    "create_dashboards_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS dashboards (
					id TEXT PRIMARY KEY,
					user_id TEXT NOT NULL,
					role TEXT NOT NULL,
					layout TEXT NOT NULL,
					widgets TEXT NOT NULL,
					is_active BOOLEAN DEFAULT TRUE,
					created_at TIMESTAMP NOT NULL,
					updated_at TIMESTAMP NOT NULL,
					last_viewed TIMESTAMP,
					FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
				);

				CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON dashboards(user_id);
				CREATE INDEX IF NOT EXISTS idx_dashboards_role ON dashboards(role);
			`,
		},
		{
			Version: 2,
			Name:    "create_dashboard_templates_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS dashboard_templates (
					id TEXT PRIMARY KEY,
					role TEXT NOT NULL UNIQUE,
					layout TEXT NOT NULL,
					widgets TEXT NOT NULL,
					is_default BOOLEAN DEFAULT TRUE,
					created_at TIMESTAMP NOT NULL,
					updated_at TIMESTAMP NOT NULL
				);

				CREATE INDEX IF NOT EXISTS idx_dashboard_templates_role ON dashboard_templates(role);
			`,
		},
		{
			Version: 3,
			Name:    "insert_default_dashboard_templates",
			SQL: `
				-- Admin dashboard template
				INSERT OR REPLACE INTO dashboard_templates (id, role, layout, widgets, is_default, created_at, updated_at)
				VALUES (
					'template-admin',
					'ADMIN',
					'{"columns":12,"widget_map":{},"theme":"dark"}',
					'[]',
					TRUE,
					datetime('now'),
					datetime('now')
				);

				-- Supervisor dashboard template
				INSERT OR REPLACE INTO dashboard_templates (id, role, layout, widgets, is_default, created_at, updated_at)
				VALUES (
					'template-supervisor',
					'SUPERVISOR',
					'{"columns":12,"widget_map":{},"theme":"dark"}',
					'[]',
					TRUE,
					datetime('now'),
					datetime('now')
				);

				-- Timbangan dashboard template
				INSERT OR REPLACE INTO dashboard_templates (id, role, layout, widgets, is_default, created_at, updated_at)
				VALUES (
					'template-timbangan',
					'TIMBANGAN',
					'{"columns":12,"widget_map":{},"theme":"dark"}',
					'[]',
					TRUE,
					datetime('now'),
					datetime('now')
				);

				-- Grading dashboard template
				INSERT OR REPLACE INTO dashboard_templates (id, role, layout, widgets, is_default, created_at, updated_at)
				VALUES (
					'template-grading',
					'GRADING',
					'{"columns":12,"widget_map":{},"theme":"dark"}',
					'[]',
					TRUE,
					datetime('now'),
					datetime('now')
				);
			`,
		},
	}
}

// RunMigrations executes all dashboard migrations
func RunMigrations(db *sql.DB) error {
	// Create migrations table if it doesn't exist
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at TIMESTAMP NOT NULL
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Get current version
	var currentVersion int
	err = db.QueryRow("SELECT COALESCE(MAX(version), 0) FROM schema_migrations").Scan(&currentVersion)
	if err != nil {
		return fmt.Errorf("failed to get current version: %w", err)
	}

	migrations := GetMigrations()

	// Apply pending migrations
	for _, migration := range migrations {
		if migration.Version <= currentVersion {
			continue
		}

		fmt.Printf("Applying migration %d: %s\n", migration.Version, migration.Name)

		// Start transaction
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction: %w", err)
		}

		// Execute migration SQL
		_, err = tx.Exec(migration.SQL)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %d: %w", migration.Version, err)
		}

		// Record migration
		_, err = tx.Exec(
			"INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
			migration.Version,
			migration.Name,
			sql.NullTime{Time: sql.NullTime{}.Time, Valid: true},
		)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %d: %w", migration.Version, err)
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit migration %d: %w", migration.Version, err)
		}

		fmt.Printf("Migration %d applied successfully\n", migration.Version)
	}

	return nil
}
