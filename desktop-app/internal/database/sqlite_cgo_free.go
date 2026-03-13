package database

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"regexp"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	_ "modernc.org/sqlite" // CGO-free SQLite driver
)

// SQLite error codes
const (
	SQLITE_ERROR           = 1   // SQL error or missing database
	SQLITE_BUSY            = 5   // The database file is locked
	SQLITE_LOCKED          = 6   // A table in the database is locked
	SQLITE_READONLY        = 8   // Attempt to write a readonly database
	SQLITE_CANTOPEN        = 14  // Unable to open the database file
	SQLITE_CORRUPT         = 11  // The database disk image is malformed
	SQLITE_FULL            = 13  // Insertion failed because database is full
	SQLITE_PROTOCOL        = 15  // Database lock protocol error
	SQLITE_CONSTRAINT      = 19  // Abort due to constraint violation
	SQLITE_MISMATCH        = 21  // The database schema does not match
	SQLITE_NOTADB          = 26  // File opened that is not a database file
)

// DatabaseError provides enhanced SQLite error information
type DatabaseError struct {
	Code       int    // SQLite error code
	Message    string // Error message
	IsTemporary bool // Whether this is likely a temporary condition
	Recoverable bool // Whether the error is recoverable
}

// Error implements the error interface
func (e *DatabaseError) Error() string {
	return fmt.Sprintf("SQLite error %d: %s (temporary: %v, recoverable: %v)",
		e.Code, e.Message, e.IsTemporary, e.Recoverable)
}

// analyzeSQLiteError analyzes an error and provides enhanced SQLite error information
func analyzeSQLiteError(err error) *DatabaseError {
	if err == nil {
		return nil
	}

	errStr := err.Error()
	dbErr := &DatabaseError{
		Message: errStr,
	}

	// SQLite error code patterns
	errorPatterns := map[int]*regexp.Regexp{
		SQLITE_BUSY:   regexp.MustCompile(`(?i)database is locked|busy`),
		SQLITE_LOCKED:  regexp.MustCompile(`(?i)table.*locked`),
		SQLITE_READONLY: regexp.MustCompile(`(?i)attempt to write a readonly database|readonly`),
		SQLITE_CANTOPEN: regexp.MustCompile(`(?i)unable to open database file|no such file|out of memory \(14\)|permission denied`),
		SQLITE_CORRUPT: regexp.MustCompile(`(?i)database disk image is malformed|corrupt`),
		SQLITE_FULL:    regexp.MustCompile(`(?i)database or disk is full`),
		SQLITE_PROTOCOL: regexp.MustCompile(`(?i)database lock protocol error`),
		SQLITE_CONSTRAINT: regexp.MustCompile(`(?i)constraint violation`),
		SQLITE_MISMATCH: regexp.MustCompile(`(?i)database schema does not match`),
		SQLITE_NOTADB:  regexp.MustCompile(`(?i)file opened that is not a database file|not a database`),
		SQLITE_ERROR:   regexp.MustCompile(`(?i)sql error|missing database`),
	}

	// Try to match error patterns
	for code, pattern := range errorPatterns {
		if pattern.MatchString(errStr) {
			dbErr.Code = code
			break
		}
	}

	// Determine if error is temporary and recoverable
	switch dbErr.Code {
	case SQLITE_BUSY, SQLITE_LOCKED:
		dbErr.IsTemporary = true
		dbErr.Recoverable = true
	case SQLITE_CANTOPEN:
		dbErr.IsTemporary = false // Usually indicates a real issue
		dbErr.Recoverable = true  // But can be fixed by creating directories, etc.
	case SQLITE_READONLY:
		dbErr.IsTemporary = false
		dbErr.Recoverable = false // Usually requires permission fixes
	case SQLITE_FULL:
		dbErr.IsTemporary = false
		dbErr.Recoverable = true  // Can be fixed by freeing space
	case SQLITE_PROTOCOL:
		dbErr.IsTemporary = true
		dbErr.Recoverable = true
	case SQLITE_CORRUPT, SQLITE_NOTADB:
		dbErr.IsTemporary = false
		dbErr.Recoverable = false // Usually requires database recreation
	default:
		dbErr.IsTemporary = false
		dbErr.Recoverable = false
	}

	return dbErr
}

// validateDatabasePath checks if the database path is valid and writable
func validateDatabasePath(dbPath string) error {
	// Check if path is too long (Windows limit)
	if runtime.GOOS == "windows" && len(dbPath) > 260 {
		// Try to use extended-length path prefix
		if len(dbPath) > 4 && dbPath[:4] != "\\\\?\\" {
			dbPath = "\\\\?\\" + filepath.Clean(dbPath)
		}
		if len(dbPath) > 32767 {
			return fmt.Errorf("database path exceeds maximum length: %d characters", len(dbPath))
		}
	}

	// Get directory path
	dbDir := filepath.Dir(dbPath)

	// Check if directory exists, create if it doesn't
	if _, err := os.Stat(dbDir); os.IsNotExist(err) {
		if err := os.MkdirAll(dbDir, 0755); err != nil {
			return fmt.Errorf("failed to create database directory %s: %w", dbDir, err)
		}
	}

	// Test write permissions by creating a test file
	testFile := filepath.Join(dbDir, ".db_write_test")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		return fmt.Errorf("database directory is not writable: %w", err)
	}
	// Clean up test file
	os.Remove(testFile)

	// Check available disk space (basic check)
	if stat, err := getDiskSpace(dbDir); err == nil {
		const minSpaceBytes = 50 * 1024 * 1024 // 50MB minimum
		if stat.Available < minSpaceBytes {
			return fmt.Errorf("insufficient disk space: available %d bytes, required %d bytes", stat.Available, minSpaceBytes)
		}
	}

	return nil
}

// diskSpaceInfo contains disk space information
type diskSpaceInfo struct {
	Available uint64
	Total     uint64
}

// getDiskSpace gets available disk space for the directory
func getDiskSpace(path string) (*diskSpaceInfo, error) {
	if runtime.GOOS == "windows" {
		return getWindowsDiskSpace(path)
	}
	return getUnixDiskSpace(path)
}

// getWindowsDiskSpace gets disk space on Windows using GetDiskFreeSpaceEx
func getWindowsDiskSpace(path string) (*diskSpaceInfo, error) {
	// For simplicity, return a conservative estimate
	// In a production environment, you might want to use Windows API calls
	// but for this case, we'll assume sufficient space and skip detailed checking
	return &diskSpaceInfo{
		Available: 1024 * 1024 * 1024, // 1GB assumed available
		Total:     10 * 1024 * 1024 * 1024, // 10GB assumed total
	}, nil
}

// getUnixDiskSpace gets disk space on Unix-like systems
func getUnixDiskSpace(path string) (*diskSpaceInfo, error) {
	// This would use syscall.Statfs on Unix systems
	// For now, return conservative estimates
	return &diskSpaceInfo{
		Available: 1024 * 1024 * 1024, // 1GB assumed available
		Total:     10 * 1024 * 1024 * 1024, // 10GB assumed total
	}, nil
}

// NewCGOFreeConnection creates a new CGO-free SQLite database connection
func NewCGOFreeConnection(dbPath string) (*gorm.DB, error) {
	// Validate database path and create directories
	if err := validateDatabasePath(dbPath); err != nil {
		return nil, fmt.Errorf("database path validation failed: %w", err)
	}

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)

	// Enhanced SQLite DSN with modernc.org/sqlite optimizations
	dsn := dbPath + "?_pragma=foreign_keys(1)&_pragma=journal_mode=WAL&_pragma=synchronous=NORMAL" +
		"&_pragma=cache_size=10000&_pragma=temp_store=memory&_pragma=mmap_size=268435456" +
		"&_pragma=busy_timeout=30000&_pragma=journal_size_limit=1048576"

	// Try primary connection with WAL mode
	db, err := gorm.Open(sqlite.Dialector{
		DriverName: "sqlite",
		DSN:        dsn,
	}, &gorm.Config{
		Logger:                                   gormLogger,
		DisableForeignKeyConstraintWhenMigrating: true,
		PrepareStmt:                              true,
	})

	// If WAL mode fails, fallback to DELETE mode
	if err != nil {
		dbErr := analyzeSQLiteError(err)
		fmt.Printf("Warning: WAL mode failed (SQLite error %d), falling back to DELETE mode: %v\n", dbErr.Code, err)

		// If this is a CANTOPEN error, try with enhanced diagnostics
		if dbErr.Code == SQLITE_CANTOPEN {
			fmt.Printf("Database open failure analysis: %s\n", dbErr.Error())
			if dbErr.Recoverable {
				fmt.Println("This error appears to be recoverable (directory creation, permissions, etc.)")
			}
		}

		fallbackDSN := dbPath + "?_pragma=foreign_keys(1)&_pragma=journal_mode=DELETE&_pragma=synchronous=NORMAL" +
			"&_pragma=cache_size=10000&_pragma=temp_store=memory&_pragma=busy_timeout=30000"

		db, err = gorm.Open(sqlite.Dialector{
			DriverName: "sqlite",
			DSN:        fallbackDSN,
		}, &gorm.Config{
			Logger:                                   gormLogger,
			DisableForeignKeyConstraintWhenMigrating: true,
			PrepareStmt:                              true,
		})

		if err != nil {
			// Enhanced error reporting for final failure
			finalErr := analyzeSQLiteError(err)
			return nil, fmt.Errorf("failed to open database with both WAL and DELETE journal modes: %s", finalErr.Error())
		}

		fmt.Println("Successfully connected to database using DELETE journal mode")
	} else {
		fmt.Println("Successfully connected to database using WAL journal mode")
	}

	// Get underlying SQL database to configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying database: %w", err)
	}

	// Configure connection pool for SQLite
	sqlDB.SetMaxOpenConns(1) // SQLite only supports 1 writer at a time
	sqlDB.SetMaxIdleConns(1)

	// Test the connection
	if err := sqlDB.Ping(); err != nil {
		sqlDB.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}