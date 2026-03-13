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
	Data   interface{}    `json:"data"`
	Errors []GraphQLError `json:"errors,omitempty"`
}

// GraphQLError represents a GraphQL error
type GraphQLError struct {
	Message string   `json:"message"`
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

// MasterEstateReference represents estate master data fetched from server.
type MasterEstateReference struct {
	KodeEstate      string
	NamaEstate      string
	Luas            float64
	Lokasi          string
	IsActive        bool
	ServerUpdatedAt *time.Time
}

// MasterAfdelingReference represents afdeling master data fetched from server.
type MasterAfdelingReference struct {
	KodeEstate      string
	KodeAfdeling    string
	NamaAfdeling    string
	Luas            float64
	IsActive        bool
	ServerUpdatedAt *time.Time
}

// MasterBlokReference represents blok master data fetched from server.
type MasterBlokReference struct {
	KodeEstate      string
	KodeAfdeling    string
	KodeBlok        string
	NamaBlok        string
	Luas            float64
	IsActive        bool
	ServerUpdatedAt *time.Time
}

// MasterReferenceData is a server payload container for estate/afdeling/blok.
type MasterReferenceData struct {
	Estates   []MasterEstateReference
	Afdelings []MasterAfdelingReference
	Bloks     []MasterBlokReference
}

// FetchMasterReferenceData fetches Estate/Afdeling/Blok reference data from GraphQL server.
func (c *GraphQLClient) FetchMasterReferenceData(ctx context.Context) (*MasterReferenceData, error) {
	queries := []string{
		`query FetchMasterReferenceData {
			masterReferenceData {
				estates {
					kodeEstate
					namaEstate
					luas
					lokasi
					isActive
					updatedAt
				}
				afdelings {
					kodeEstate
					kodeAfdeling
					namaAfdeling
					luas
					isActive
					updatedAt
				}
				bloks {
					kodeEstate
					kodeAfdeling
					kodeBlok
					namaBlok
					luas
					isActive
					updatedAt
				}
			}
		}`,
		`query FetchMasterReferenceData {
			master_reference_data {
				estates {
					kode_estate
					nama_estate
					luas
					lokasi
					is_active
					updated_at
				}
				afdelings {
					kode_estate
					kode_afdeling
					nama_afdeling
					luas
					is_active
					updated_at
				}
				bloks {
					kode_estate
					kode_afdeling
					kode_blok
					nama_blok
					luas
					is_active
					updated_at
				}
			}
		}`,
		`query FetchMasterReferenceData {
			estates {
				kodeEstate
				namaEstate
				luas
				lokasi
				isActive
				updatedAt
			}
			afdelings {
				kodeEstate
				kodeAfdeling
				namaAfdeling
				luas
				isActive
				updatedAt
			}
			bloks {
				kodeEstate
				kodeAfdeling
				kodeBlok
				namaBlok
				luas
				isActive
				updatedAt
			}
		}`,
		`query FetchMasterReferenceData {
			estates {
				kode_estate
				nama_estate
				luas
				lokasi
				is_active
				updated_at
			}
			afdelings {
				kode_estate
				kode_afdeling
				nama_afdeling
				luas
				is_active
				updated_at
			}
			bloks {
				kode_estate
				kode_afdeling
				kode_blok
				nama_blok
				luas
				is_active
				updated_at
			}
		}`,
	}

	var lastErr error
	for _, query := range queries {
		result, err := c.fetchMasterReferenceDataWithQuery(ctx, query)
		if err == nil {
			return result, nil
		}
		lastErr = err
	}

	if lastErr == nil {
		lastErr = fmt.Errorf("failed to fetch master reference data")
	}
	return nil, lastErr
}

func (c *GraphQLClient) fetchMasterReferenceDataWithQuery(ctx context.Context, query string) (*MasterReferenceData, error) {
	gqlRequest := GraphQLRequest{Query: query}
	requestBody, err := json.Marshal(gqlRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal master sync request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.serverURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create master sync request: %w", err)
	}

	c.addAuthHeaders(req, string(requestBody))
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("master sync request failed: %w", err)
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read master sync response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(responseBody))
	}

	var gqlResponse GraphQLResponse
	if err := json.Unmarshal(responseBody, &gqlResponse); err != nil {
		return nil, fmt.Errorf("failed to parse master sync response: %w", err)
	}

	if len(gqlResponse.Errors) > 0 {
		return nil, fmt.Errorf("GraphQL error: %s", gqlResponse.Errors[0].Message)
	}

	dataBytes, err := json.Marshal(gqlResponse.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal master sync payload: %w", err)
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(dataBytes, &payload); err != nil {
		return nil, fmt.Errorf("failed to decode master sync payload: %w", err)
	}

	parsed, recognized, err := parseMasterReferenceDataPayload(payload)
	if err != nil {
		return nil, err
	}
	if !recognized {
		return nil, fmt.Errorf("master reference payload not recognized")
	}

	return parsed, nil
}

func parseMasterReferenceDataPayload(payload map[string]interface{}) (*MasterReferenceData, bool, error) {
	result := &MasterReferenceData{
		Estates:   []MasterEstateReference{},
		Afdelings: []MasterAfdelingReference{},
		Bloks:     []MasterBlokReference{},
	}

	root := payload
	recognized := false

	if nested, ok := getMapByKeys(payload,
		"masterReferenceData",
		"master_reference_data",
		"masterDataReference",
		"master_data_reference",
	); ok {
		root = nested
		recognized = true
	}

	if estatesRaw, ok := getSliceByKeys(root, "estates", "estate"); ok {
		recognized = true
		for _, item := range estatesRaw {
			recordMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			result.Estates = append(result.Estates, MasterEstateReference{
				KodeEstate:      getStringByKeys(recordMap, "kodeEstate", "kode_estate", "estateCode", "estate_code", "kode"),
				NamaEstate:      getStringByKeys(recordMap, "namaEstate", "nama_estate", "estateName", "estate_name", "nama"),
				Luas:            getFloatByKeys(recordMap, "luas", "area"),
				Lokasi:          getStringByKeys(recordMap, "lokasi", "location"),
				IsActive:        getBoolWithDefault(recordMap, true, "isActive", "is_active", "active"),
				ServerUpdatedAt: getTimeByKeys(recordMap, "updatedAt", "updated_at", "serverUpdatedAt", "server_updated_at"),
			})
		}
	}

	if afdelingsRaw, ok := getSliceByKeys(root, "afdelings", "afdeling"); ok {
		recognized = true
		for _, item := range afdelingsRaw {
			recordMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			result.Afdelings = append(result.Afdelings, MasterAfdelingReference{
				KodeEstate:      getStringByKeys(recordMap, "kodeEstate", "kode_estate", "estateCode", "estate_code"),
				KodeAfdeling:    getStringByKeys(recordMap, "kodeAfdeling", "kode_afdeling", "afdelingCode", "afdeling_code", "kode"),
				NamaAfdeling:    getStringByKeys(recordMap, "namaAfdeling", "nama_afdeling", "afdelingName", "afdeling_name", "nama"),
				Luas:            getFloatByKeys(recordMap, "luas", "area"),
				IsActive:        getBoolWithDefault(recordMap, true, "isActive", "is_active", "active"),
				ServerUpdatedAt: getTimeByKeys(recordMap, "updatedAt", "updated_at", "serverUpdatedAt", "server_updated_at"),
			})
		}
	}

	if bloksRaw, ok := getSliceByKeys(root, "bloks", "blok", "blocks"); ok {
		recognized = true
		for _, item := range bloksRaw {
			recordMap, ok := item.(map[string]interface{})
			if !ok {
				continue
			}
			result.Bloks = append(result.Bloks, MasterBlokReference{
				KodeEstate:      getStringByKeys(recordMap, "kodeEstate", "kode_estate", "estateCode", "estate_code"),
				KodeAfdeling:    getStringByKeys(recordMap, "kodeAfdeling", "kode_afdeling", "afdelingCode", "afdeling_code"),
				KodeBlok:        getStringByKeys(recordMap, "kodeBlok", "kode_blok", "blokCode", "blockCode", "block_code", "kode"),
				NamaBlok:        getStringByKeys(recordMap, "namaBlok", "nama_blok", "blokName", "blockName", "block_name", "nama"),
				Luas:            getFloatByKeys(recordMap, "luas", "area"),
				IsActive:        getBoolWithDefault(recordMap, true, "isActive", "is_active", "active"),
				ServerUpdatedAt: getTimeByKeys(recordMap, "updatedAt", "updated_at", "serverUpdatedAt", "server_updated_at"),
			})
		}
	}

	return result, recognized, nil
}

func getMapByKeys(input map[string]interface{}, keys ...string) (map[string]interface{}, bool) {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			if recordMap, ok := value.(map[string]interface{}); ok {
				return recordMap, true
			}
		}
	}
	return nil, false
}

func getSliceByKeys(input map[string]interface{}, keys ...string) ([]interface{}, bool) {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			if records, ok := value.([]interface{}); ok {
				return records, true
			}
		}
	}
	return nil, false
}

func getStringByKeys(input map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			switch typed := value.(type) {
			case string:
				return typed
			}
		}
	}
	return ""
}

func getFloatByKeys(input map[string]interface{}, keys ...string) float64 {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			switch typed := value.(type) {
			case float64:
				return typed
			case float32:
				return float64(typed)
			case int:
				return float64(typed)
			case int64:
				return float64(typed)
			case json.Number:
				parsed, err := typed.Float64()
				if err == nil {
					return parsed
				}
			}
		}
	}
	return 0
}

func getBoolWithDefault(input map[string]interface{}, fallback bool, keys ...string) bool {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			switch typed := value.(type) {
			case bool:
				return typed
			case string:
				if typed == "true" || typed == "TRUE" || typed == "1" {
					return true
				}
				if typed == "false" || typed == "FALSE" || typed == "0" {
					return false
				}
			}
		}
	}
	return fallback
}

func getTimeByKeys(input map[string]interface{}, keys ...string) *time.Time {
	for _, key := range keys {
		if value, ok := input[key]; ok {
			switch typed := value.(type) {
			case string:
				if typed == "" {
					return nil
				}
				if parsed, err := time.Parse(time.RFC3339, typed); err == nil {
					return &parsed
				}
				if parsed, err := time.Parse(time.RFC3339Nano, typed); err == nil {
					return &parsed
				}
			case float64:
				unix := int64(typed)
				parsed := time.Unix(unix, 0)
				return &parsed
			case int64:
				parsed := time.Unix(typed, 0)
				return &parsed
			case time.Time:
				parsed := typed
				return &parsed
			}
		}
	}
	return nil
}
