package main

// API Key Management Methods

// CreateAPIKey creates a new API key
func (a *App) CreateAPIKey(dataJSON string, userID string) (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.CreateAPIKey(dataJSON, userID)
	})
}

// GetAPIKeys returns all API keys
func (a *App) GetAPIKeys() (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.GetAPIKeys()
	})
}

// UpdateAPIKey updates an API key
func (a *App) UpdateAPIKey(dataJSON string, userID string) (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.UpdateAPIKey(dataJSON, userID)
	})
}

// DeleteAPIKey deletes an API key
func (a *App) DeleteAPIKey(id string, userID string) (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.DeleteAPIKey(id, userID)
	})
}

// DeactivateAPIKey deactivates an API key
func (a *App) DeactivateAPIKey(id string, userID string) (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.DeactivateAPIKey(id, userID)
	})
}

// ReactivateAPIKey reactivates an API key
func (a *App) ReactivateAPIKey(id string, userID string) (string, error) {
	if err := a.RequireAuthenticatedServices(); err != nil {
		return "", err
	}

	return a.handler.Handle(func() (interface{}, error) {
		return a.application.Container.APIKeyController.ReactivateAPIKey(id, userID)
	})
}
