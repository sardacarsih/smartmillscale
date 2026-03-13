package sync

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/shared/types"
	"github.com/yourusername/gosmartmillscale/shared/utils"
)

// GraphQLClient handles communication with the central server
type GraphQLClient struct {
	serverURL  string
	deviceID   uuid.UUID
	apiKey     string
	httpClient *http.Client
}

// GraphQLRequest represents a GraphQL request
type GraphQLRequest struct {
	Query     string                 `json:"query"`
	Variables map[string]interface{} `json:"variables,omitempty"`
}

// GraphQLResponse represents a GraphQL response
type GraphQLResponse struct {
	Data   interface{}            `json:"data"`
	Errors []GraphQLError         `json:"errors,omitempty"`
}

// GraphQLError represents a GraphQL error
type GraphQLError struct {
	Message string `json:"message"`
	Path    []string `json:"path,omitempty"`
}

// NewGraphQLClient creates a new GraphQL client with TLS 1.3
func NewGraphQLClient(serverURL string, deviceID uuid.UUID, apiKey string) *GraphQLClient {
	// Configure TLS
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS13,
		CipherSuites: []uint16{
			tls.TLS_AES_128_GCM_SHA256,
			tls.TLS_AES_256_GCM_SHA384,
			tls.TLS_CHACHA20_POLY1305_SHA256,
		},
	}

	// Configure HTTP client
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			DialContext: (&net.Dialer{
				Timeout:   10 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
			TLSHandshakeTimeout:   10 * time.Second,
			TLSClientConfig:       tlsConfig,
			MaxIdleConns:          10,
			MaxIdleConnsPerHost:   5,
			IdleConnTimeout:       90 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		},
	}

	return &GraphQLClient{
		serverURL:  serverURL,
		deviceID:   deviceID,
		apiKey:     apiKey,
		httpClient: httpClient,
	}
}

// BatchSyncWeighingData sends a batch of weighing records to the server
func (c *GraphQLClient) BatchSyncWeighingData(ctx context.Context, records []types.TimbanganData) (*types.SyncResponse, error) {
	// Prepare GraphQL mutation
	mutation := `
		mutation BatchSyncWeighingData($input: BatchSyncInput!) {
			batchSyncWeighingData(input: $input) {
				totalReceived
				successCount
				failedCount
				results {
					idLocal
					idPusat
					status
					error
				}
				serverTime
			}
		}
	`

	// Prepare variables
	variables := map[string]interface{}{
		"input": map[string]interface{}{
			"deviceId": c.deviceID.String(),
			"records":  records,
		},
	}

	// Create GraphQL request
	gqlRequest := GraphQLRequest{
		Query:     mutation,
		Variables: variables,
	}

	requestBody, err := json.Marshal(gqlRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", c.serverURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Add headers
	c.addAuthHeaders(req, string(requestBody))
	req.Header.Set("Content-Type", "application/json")

	// Execute request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Check status code
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(responseBody))
	}

	// Parse GraphQL response
	var gqlResponse GraphQLResponse
	if err := json.Unmarshal(responseBody, &gqlResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Check for GraphQL errors
	if len(gqlResponse.Errors) > 0 {
		return nil, fmt.Errorf("GraphQL error: %s", gqlResponse.Errors[0].Message)
	}

	// Extract sync response
	dataBytes, err := json.Marshal(gqlResponse.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	var responseData struct {
		BatchSyncWeighingData types.SyncResponse `json:"batchSyncWeighingData"`
	}

	if err := json.Unmarshal(dataBytes, &responseData); err != nil {
		return nil, fmt.Errorf("failed to parse sync response: %w", err)
	}

	return &responseData.BatchSyncWeighingData, nil
}

// SyncSingleRecord sends a single weighing record to the server
func (c *GraphQLClient) SyncSingleRecord(ctx context.Context, record types.TimbanganData) (*types.SyncResult, error) {
	mutation := `
		mutation SyncSingleRecord($input: TimbanganInput!) {
			syncSingleRecord(input: $input) {
				idLocal
				idPusat
				status
				error
			}
		}
	`

	variables := map[string]interface{}{
		"input": record,
	}

	gqlRequest := GraphQLRequest{
		Query:     mutation,
		Variables: variables,
	}

	requestBody, err := json.Marshal(gqlRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.serverURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	c.addAuthHeaders(req, string(requestBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(responseBody))
	}

	var gqlResponse GraphQLResponse
	if err := json.Unmarshal(responseBody, &gqlResponse); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	if len(gqlResponse.Errors) > 0 {
		return nil, fmt.Errorf("GraphQL error: %s", gqlResponse.Errors[0].Message)
	}

	dataBytes, err := json.Marshal(gqlResponse.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal data: %w", err)
	}

	var responseData struct {
		SyncSingleRecord types.SyncResult `json:"syncSingleRecord"`
	}

	if err := json.Unmarshal(dataBytes, &responseData); err != nil {
		return nil, fmt.Errorf("failed to parse sync result: %w", err)
	}

	return &responseData.SyncSingleRecord, nil
}

// HealthCheck checks if the server is reachable
func (c *GraphQLClient) HealthCheck(ctx context.Context) error {
	query := `
		query {
			health {
				status
			}
		}
	`

	gqlRequest := GraphQLRequest{
		Query: query,
	}

	requestBody, err := json.Marshal(gqlRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.serverURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	return nil
}

// addAuthHeaders adds authentication and signature headers to the request
func (c *GraphQLClient) addAuthHeaders(req *http.Request, payload string) {
	timestamp := time.Now().Unix()

	// Add device authentication headers
	req.Header.Set("X-Device-ID", c.deviceID.String())
	req.Header.Set("X-API-Key", c.apiKey)
	req.Header.Set("X-Timestamp", fmt.Sprintf("%d", timestamp))

	// Sign the request
	signature := utils.SignPayload(payload, c.apiKey, timestamp)
	req.Header.Set("X-Signature", signature)
}

// ExecuteWithRetry executes a request with retry logic
func (c *GraphQLClient) ExecuteWithRetry(ctx context.Context, fn func(context.Context) error, maxRetries int) error {
	var lastErr error

	for attempt := 0; attempt < maxRetries; attempt++ {
		err := fn(ctx)
		if err == nil {
			return nil
		}

		lastErr = err

		// Check if error is retryable (network errors)
		if !isRetryableError(err) {
			// Non-retryable error (validation, etc.)
			return err
		}

		// Exponential backoff
		if attempt < maxRetries-1 {
			backoff := calculateBackoff(attempt)
			select {
			case <-time.After(backoff):
				// Continue to next retry
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}

	return fmt.Errorf("max retries exceeded: %w", lastErr)
}

// isRetryableError checks if an error is retryable
func isRetryableError(err error) bool {
	if err == nil {
		return false
	}

	// Network errors are retryable
	var netErr net.Error
	if e, ok := err.(net.Error); ok {
		netErr = e
	}

	if netErr != nil && netErr.Timeout() {
		return true
	}

	// Connection errors
	errStr := err.Error()
	retryablePatterns := []string{
		"connection refused",
		"no such host",
		"network is unreachable",
		"connection reset",
		"broken pipe",
		"i/o timeout",
	}

	for _, pattern := range retryablePatterns {
		if contains(errStr, pattern) {
			return true
		}
	}

	return false
}

// calculateBackoff calculates exponential backoff duration
func calculateBackoff(attempt int) time.Duration {
	// Base: 1 second, doubles each attempt, max 60 seconds
	backoff := time.Duration(1<<uint(attempt)) * time.Second
	if backoff > 60*time.Second {
		backoff = 60 * time.Second
	}

	// Add jitter (±20%)
	jitter := time.Duration(float64(backoff) * 0.2 * (2.0*float64(time.Now().UnixNano()%100)/100.0 - 1.0))
	return backoff + jitter
}

// contains checks if a string contains a substring (case-insensitive)
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsAny(s, substr))
}

func containsAny(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
