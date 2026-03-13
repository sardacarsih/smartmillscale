package logger

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"
)

// LogLevel represents the severity of a log message
type LogLevel string

const (
	// LogLevelDebug is for detailed debugging information
	LogLevelDebug LogLevel = "DEBUG"
	// LogLevelInfo is for general informational messages
	LogLevelInfo LogLevel = "INFO"
	// LogLevelWarning is for warning messages
	LogLevelWarning LogLevel = "WARNING"
	// LogLevelError is for error messages
	LogLevelError LogLevel = "ERROR"
)

// Logger interface for structured logging
type Logger interface {
	Info(msg string, fields map[string]interface{})
	Error(msg string, err error, fields map[string]interface{})
	Debug(msg string, fields map[string]interface{})
	Warning(msg string, fields map[string]interface{})
}

// StandardLogger implements Logger interface with structured JSON logging
type StandardLogger struct {
	debugMode bool
	logger    *log.Logger
}

// LogEntry represents a structured log entry
type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     LogLevel               `json:"level"`
	Message   string                 `json:"message"`
	Fields    map[string]interface{} `json:"fields,omitempty"`
	Error     string                 `json:"error,omitempty"`
}

// NewLogger creates a new structured logger
func NewLogger(debugMode bool) Logger {
	return &StandardLogger{
		debugMode: debugMode,
		logger:    log.New(os.Stdout, "", 0),
	}
}

// Info logs an informational message
func (l *StandardLogger) Info(msg string, fields map[string]interface{}) {
	l.log(LogLevelInfo, msg, nil, fields)
}

// Error logs an error message
func (l *StandardLogger) Error(msg string, err error, fields map[string]interface{}) {
	l.log(LogLevelError, msg, err, fields)
}

// Debug logs a debug message (only if debug mode is enabled)
func (l *StandardLogger) Debug(msg string, fields map[string]interface{}) {
	if l.debugMode {
		l.log(LogLevelDebug, msg, nil, fields)
	}
}

// Warning logs a warning message
func (l *StandardLogger) Warning(msg string, fields map[string]interface{}) {
	l.log(LogLevelWarning, msg, nil, fields)
}

// log is the internal logging method that formats and outputs log entries
func (l *StandardLogger) log(level LogLevel, msg string, err error, fields map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now().Format(time.RFC3339),
		Level:     level,
		Message:   msg,
		Fields:    fields,
	}

	if err != nil {
		entry.Error = err.Error()
	}

	// Try to marshal as JSON for structured logging
	jsonBytes, marshalErr := json.Marshal(entry)
	if marshalErr != nil {
		// Fallback to plain text if JSON marshaling fails
		l.logger.Printf("[%s] %s: %s (error: %v, fields: %+v)",
			level, entry.Timestamp, msg, err, fields)
		return
	}

	l.logger.Println(string(jsonBytes))
}

// NoOpLogger is a logger that does nothing (for testing or when logging is disabled)
type NoOpLogger struct{}

// NewNoOpLogger creates a logger that discards all messages
func NewNoOpLogger() Logger {
	return &NoOpLogger{}
}

func (n *NoOpLogger) Info(msg string, fields map[string]interface{})             {}
func (n *NoOpLogger) Error(msg string, err error, fields map[string]interface{}) {}
func (n *NoOpLogger) Debug(msg string, fields map[string]interface{})            {}
func (n *NoOpLogger) Warning(msg string, fields map[string]interface{})          {}

// Helper function to create field maps easily
func Fields(kvPairs ...interface{}) map[string]interface{} {
	if len(kvPairs)%2 != 0 {
		panic(fmt.Sprintf("Fields() requires even number of arguments, got %d", len(kvPairs)))
	}

	fields := make(map[string]interface{}, len(kvPairs)/2)
	for i := 0; i < len(kvPairs); i += 2 {
		key, ok := kvPairs[i].(string)
		if !ok {
			panic(fmt.Sprintf("Field key must be string, got %T", kvPairs[i]))
		}
		fields[key] = kvPairs[i+1]
	}

	return fields
}
