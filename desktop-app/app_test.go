package main

import (
	"context"
	"fmt"
)

// TestService adalah service sederhana untuk testing
type TestService struct{}

// Greet adalah method sederhana untuk testing
func (t *TestService) Greet(name string) string {
	return fmt.Sprintf("Hello, %s! This is a test from Wails v3 backend.", name)
}

// OnStartup adalah lifecycle method
func (t *TestService) OnStartup(ctx context.Context) {
	fmt.Println("=== TEST SERVICE STARTING UP ===")
}

// OnDomReady adalah lifecycle method
func (t *TestService) OnDomReady(ctx context.Context) {
	fmt.Println("=== TEST SERVICE DOM READY ===")
}

// OnBeforeClose adalah lifecycle method
func (t *TestService) OnBeforeClose(ctx context.Context) (prevent bool) {
	fmt.Println("=== TEST SERVICE BEFORE CLOSE ===")
	return false
}

// OnShutdown adalah lifecycle method
func (t *TestService) OnShutdown(ctx context.Context) {
	fmt.Println("=== TEST SERVICE SHUTTING DOWN ===")
}