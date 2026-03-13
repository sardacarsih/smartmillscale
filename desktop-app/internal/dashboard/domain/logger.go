package domain

import "fmt"

// NoOpLogger provides a no-operation logger implementation
type NoOpLogger struct{}

// Info logs an info message (no-op)
func (l *NoOpLogger) Info(message string, fields ...Field) {
	// No-op implementation
}

// Warn logs a warning message (no-op)
func (l *NoOpLogger) Warn(message string, fields ...Field) {
	// No-op implementation
}

// Error logs an error message (no-op)
func (l *NoOpLogger) Error(message string, err error, fields ...Field) {
	// For debugging purposes, you might want to uncomment this line during development
	// fmt.Printf("ERROR: %s: %v\n", message, err)
}

// Debug logs a debug message (no-op)
func (l *NoOpLogger) Debug(message string, fields ...Field) {
	// No-op implementation
}

// With returns a new logger with additional fields (no-op)
func (l *NoOpLogger) With(fields ...Field) Logger {
	return l
}

// ConsoleLogger provides a simple console logger implementation
type ConsoleLogger struct{}

// Info logs an info message to console
func (l *ConsoleLogger) Info(message string, fields ...Field) {
	fmt.Printf("[INFO] %s", message)
	l.printFields(fields)
	fmt.Println()
}

// Warn logs a warning message to console
func (l *ConsoleLogger) Warn(message string, fields ...Field) {
	fmt.Printf("[WARN] %s", message)
	l.printFields(fields)
	fmt.Println()
}

// Error logs an error message to console
func (l *ConsoleLogger) Error(message string, err error, fields ...Field) {
	fmt.Printf("[ERROR] %s: %v", message, err)
	l.printFields(fields)
	fmt.Println()
}

// Debug logs a debug message to console
func (l *ConsoleLogger) Debug(message string, fields ...Field) {
	fmt.Printf("[DEBUG] %s", message)
	l.printFields(fields)
	fmt.Println()
}

// With returns a new console logger with additional fields
func (l *ConsoleLogger) With(fields ...Field) Logger {
	return l
}

// printFields formats and prints log fields
func (l *ConsoleLogger) printFields(fields []Field) {
	for _, field := range fields {
		fmt.Printf(" %s=%v", field.Key, field.Value)
	}
}