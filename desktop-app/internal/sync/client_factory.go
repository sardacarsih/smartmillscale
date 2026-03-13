package sync

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/auth"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/entities"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/domain/repositories"
)

// ClientFactory creates GraphQL clients using active API keys from the database
type ClientFactory struct {
	apiKeyRepo repositories.APIKeyRepository
	deviceID   uuid.UUID
}

// NewClientFactory creates a new client factory
func NewClientFactory(apiKeyRepo repositories.APIKeyRepository, deviceID uuid.UUID) *ClientFactory {
	return &ClientFactory{
		apiKeyRepo: apiKeyRepo,
		deviceID:   deviceID,
	}
}

// GetActiveClient retrieves the active API key and creates a GraphQL client
func (f *ClientFactory) GetActiveClient(ctx context.Context) (*GraphQLClient, error) {
	// Get all API keys
	allKeys, err := f.apiKeyRepo.FindAll(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch API keys: %w", err)
	}

	// Find the first active API key
	var activeKey *entities.APIKey
	for i := range allKeys {
		if allKeys[i].IsActive {
			activeKey = &allKeys[i]
			break
		}
	}

	if activeKey == nil {
		return nil, fmt.Errorf("no active API key found")
	}

	// Decrypt the API key
	// The Key field in entities.APIKey contains the encrypted key
	decryptedKey, err := f.decryptAPIKey(activeKey.Key)
	if err != nil {
		return nil, fmt.Errorf("failed to decrypt API key: %w", err)
	}

	// Create and return GraphQL client
	client := NewGraphQLClient(activeKey.ServerURL, f.deviceID, decryptedKey)
	return client, nil
}

// decryptAPIKey decrypts an encrypted API key using the auth package
func (f *ClientFactory) decryptAPIKey(encryptedKey string) (string, error) {
	// Create a temporary auth.APIKey to use the decryption method
	authKey := &auth.APIKey{
		APIKey: encryptedKey,
	}

	// Use the GetPlainAPIKey method which internally calls decryptAPIKey
	plainKey, err := authKey.GetPlainAPIKey()
	if err != nil {
		return "", fmt.Errorf("decryption failed: %w", err)
	}

	return plainKey, nil
}

// GetServerURL returns the server URL of the active API key
func (f *ClientFactory) GetServerURL(ctx context.Context) (string, error) {
	// Get all API keys
	allKeys, err := f.apiKeyRepo.FindAll(ctx)
	if err != nil {
		return "", fmt.Errorf("failed to fetch API keys: %w", err)
	}

	// Find the first active API key
	for i := range allKeys {
		if allKeys[i].IsActive {
			return allKeys[i].ServerURL, nil
		}
	}

	return "", fmt.Errorf("no active API key found")
}

// HasActiveKey checks if there's an active API key configured
func (f *ClientFactory) HasActiveKey(ctx context.Context) bool {
	allKeys, err := f.apiKeyRepo.FindAll(ctx)
	if err != nil {
		return false
	}

	for i := range allKeys {
		if allKeys[i].IsActive {
			return true
		}
	}

	return false
}
