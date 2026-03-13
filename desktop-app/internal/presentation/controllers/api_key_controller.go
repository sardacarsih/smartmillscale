package controllers

import (
	"context"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/application/usecases"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/presentation/responses"
)

// APIKeyController handles Wails API calls for API keys
type APIKeyController struct {
	apiKeyUseCase *usecases.APIKeyUseCase
}

// NewAPIKeyController creates a new API key controller
func NewAPIKeyController(apiKeyUseCase *usecases.APIKeyUseCase) *APIKeyController {
	return &APIKeyController{
		apiKeyUseCase: apiKeyUseCase,
	}
}

// CreateAPIKey creates a new API key
// Wails binding method
func (c *APIKeyController) CreateAPIKey(dataJSON string, userID string) (*responses.APIResponse, error) {
	ctx := context.Background()

	var data struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		ServerURL   string `json:"serverUrl"`
	}

	if err := responses.UnmarshalRequest(dataJSON, &data); err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid request format",
			map[string]interface{}{"error": err.Error()},
			responses.GenerateRequestID(),
		), nil
	}

	creatorID, err := uuid.Parse(userID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid creator ID format",
			map[string]interface{}{"user_id": userID},
			responses.GenerateRequestID(),
		), nil
	}

	apiKey, err := c.apiKeyUseCase.CreateAPIKey(ctx, data.Name, data.Description, data.ServerURL, creatorID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeValidationFailed,
			"Failed to create API key: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API key created successfully",
		apiKey,
		"",
	), nil
}

// GetAPIKeys returns all API keys
// Wails binding method
func (c *APIKeyController) GetAPIKeys() (*responses.APIResponse, error) {
	ctx := context.Background()

	apiKeys, err := c.apiKeyUseCase.GetAPIKeys(ctx)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to retrieve API keys: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API keys retrieved successfully",
		apiKeys,
		"",
	), nil
}

// UpdateAPIKey updates an API key
// Wails binding method
func (c *APIKeyController) UpdateAPIKey(dataJSON string, userID string) (*responses.APIResponse, error) {
	ctx := context.Background()

	var data struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		ServerURL   string `json:"serverUrl"`
	}

	if err := responses.UnmarshalRequest(dataJSON, &data); err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid request format",
			map[string]interface{}{"error": err.Error()},
			responses.GenerateRequestID(),
		), nil
	}

	id, err := uuid.Parse(data.ID)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid API key ID format",
			map[string]interface{}{"id": data.ID},
			responses.GenerateRequestID(),
		), nil
	}

	apiKey, err := c.apiKeyUseCase.UpdateAPIKey(ctx, id, data.Name, data.Description, data.ServerURL)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeValidationFailed,
			"Failed to update API key: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API key updated successfully",
		apiKey,
		"",
	), nil
}

// DeleteAPIKey deletes an API key
// Wails binding method
func (c *APIKeyController) DeleteAPIKey(id string, userID string) (*responses.APIResponse, error) {
	ctx := context.Background()

	apiKeyID, err := uuid.Parse(id)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid API key ID format",
			map[string]interface{}{"id": id},
			responses.GenerateRequestID(),
		), nil
	}

	if err := c.apiKeyUseCase.DeleteAPIKey(ctx, apiKeyID); err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to delete API key: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API key deleted successfully",
		nil,
		"",
	), nil
}

// DeactivateAPIKey deactivates an API key
// Wails binding method
func (c *APIKeyController) DeactivateAPIKey(id string, userID string) (*responses.APIResponse, error) {
	ctx := context.Background()

	apiKeyID, err := uuid.Parse(id)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid API key ID format",
			map[string]interface{}{"id": id},
			responses.GenerateRequestID(),
		), nil
	}

	apiKey, err := c.apiKeyUseCase.ToggleAPIKeyStatus(ctx, apiKeyID, false)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to deactivate API key: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API key deactivated successfully",
		apiKey,
		"",
	), nil
}

// ReactivateAPIKey reactivates an API key
// Wails binding method
func (c *APIKeyController) ReactivateAPIKey(id string, userID string) (*responses.APIResponse, error) {
	ctx := context.Background()

	apiKeyID, err := uuid.Parse(id)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInvalidInput,
			"Invalid API key ID format",
			map[string]interface{}{"id": id},
			responses.GenerateRequestID(),
		), nil
	}

	apiKey, err := c.apiKeyUseCase.ToggleAPIKeyStatus(ctx, apiKeyID, true)
	if err != nil {
		return responses.NewErrorResponse(
			responses.ErrorCodeInternalServer,
			"Failed to reactivate API key: "+err.Error(),
			nil,
			responses.GenerateRequestID(),
		), nil
	}

	return responses.NewSuccessResponse(
		"API key reactivated successfully",
		apiKey,
		"",
	), nil
}
