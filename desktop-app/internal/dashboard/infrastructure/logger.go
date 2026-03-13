package infrastructure

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// logger implements domain.Logger interface
type logger struct {
	infoLogger  *log.Logger
	warnLogger  *log.Logger
	errorLogger *log.Logger
	debugLogger *log.Logger
	fields      []domain.Field
}

// NewLogger creates a new logger implementation
func NewLogger() domain.Logger {
	return &logger{
		infoLogger:  log.New(os.Stdout, "[INFO] ", log.LstdFlags),
		warnLogger:  log.New(os.Stdout, "[WARN] ", log.LstdFlags),
		errorLogger: log.New(os.Stderr, "[ERROR] ", log.LstdFlags),
		debugLogger: log.New(os.Stdout, "[DEBUG] ", log.LstdFlags),
		fields:      []domain.Field{},
	}
}

// Info logs an info message
func (l *logger) Info(message string, fields ...domain.Field) {
	l.log(l.infoLogger, message, fields...)
}

// Warn logs a warning message
func (l *logger) Warn(message string, fields ...domain.Field) {
	l.log(l.warnLogger, message, fields...)
}

// Error logs an error message
func (l *logger) Error(message string, err error, fields ...domain.Field) {
	allFields := append(fields, domain.Field{Key: "error", Value: err.Error()})
	l.log(l.errorLogger, message, allFields...)
}

// Debug logs a debug message
func (l *logger) Debug(message string, fields ...domain.Field) {
	l.log(l.debugLogger, message, fields...)
}

// With creates a child logger with additional fields
func (l *logger) With(fields ...domain.Field) domain.Logger {
	newFields := make([]domain.Field, len(l.fields)+len(fields))
	copy(newFields, l.fields)
	copy(newFields[len(l.fields):], fields)

	return &logger{
		infoLogger:  l.infoLogger,
		warnLogger:  l.warnLogger,
		errorLogger: l.errorLogger,
		debugLogger: l.debugLogger,
		fields:      newFields,
	}
}

// log is a helper function to log with fields
func (l *logger) log(logger *log.Logger, message string, fields ...domain.Field) {
	// Combine logger fields with message fields
	allFields := append(l.fields, fields...)

	// Format fields
	fieldStr := ""
	if len(allFields) > 0 {
		fieldStr = " | "
		for i, field := range allFields {
			if i > 0 {
				fieldStr += ", "
			}
			fieldStr += fmt.Sprintf("%s=%v", field.Key, field.Value)
		}
	}

	logger.Printf("%s%s", message, fieldStr)
}

// StructuredLogger is an enhanced logger with structured logging
type StructuredLogger struct {
	*logger
	serviceName string
	version     string
}

// NewStructuredLogger creates a new structured logger
func NewStructuredLogger(serviceName, version string) domain.Logger {
	baseLogger := NewLogger().(*logger)
	return &StructuredLogger{
		logger:      baseLogger,
		serviceName: serviceName,
		version:     version,
	}
}

// log overrides base logger to add structured fields
func (l *StructuredLogger) log(logger *log.Logger, message string, fields ...domain.Field) {
	// Add service metadata
	allFields := []domain.Field{
		{Key: "service", Value: l.serviceName},
		{Key: "version", Value: l.version},
		{Key: "timestamp", Value: time.Now().Format(time.RFC3339)},
	}
	allFields = append(allFields, l.fields...)
	allFields = append(allFields, fields...)

	// Format as JSON-like structure
	fieldStr := "{"
	for i, field := range allFields {
		if i > 0 {
			fieldStr += ", "
		}
		fieldStr += fmt.Sprintf(`"%s": "%v"`, field.Key, field.Value)
	}
	fieldStr += "}"

	logger.Printf(`{"message": "%s", "fields": %s}`, message, fieldStr)
}

// With creates a child structured logger with additional fields
func (l *StructuredLogger) With(fields ...domain.Field) domain.Logger {
	newFields := make([]domain.Field, len(l.fields)+len(fields))
	copy(newFields, l.fields)
	copy(newFields[len(l.fields):], fields)

	return &StructuredLogger{
		logger: &logger{
			infoLogger:  l.infoLogger,
			warnLogger:  l.warnLogger,
			errorLogger: l.errorLogger,
			debugLogger: l.debugLogger,
			fields:      newFields,
		},
		serviceName: l.serviceName,
		version:     l.version,
	}
}
