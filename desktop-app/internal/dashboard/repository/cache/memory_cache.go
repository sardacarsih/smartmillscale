package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/yourusername/gosmartmillscale/desktop-app/internal/dashboard/domain"
)

// cacheEntry represents a cache entry with expiration
type cacheEntry struct {
	value      interface{}
	expiration time.Time
}

// isExpired checks if the entry has expired
func (e *cacheEntry) isExpired() bool {
	return time.Now().After(e.expiration)
}

// memoryCache implements domain.CacheRepository using in-memory storage
type memoryCache struct {
	mu      sync.RWMutex
	entries map[string]*cacheEntry
	hits    uint64
	misses  uint64
}

// NewMemoryCache creates a new in-memory cache repository
func NewMemoryCache() domain.CacheRepository {
	cache := &memoryCache{
		entries: make(map[string]*cacheEntry),
	}

	// Start cleanup goroutine
	go cache.cleanupExpired()

	return cache
}

// GetDashboard retrieves cached dashboard data
func (c *memoryCache) GetDashboard(ctx context.Context, key string) (*domain.DashboardData, error) {
	val, err := c.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	// Type assertion
	data, ok := val.(*domain.DashboardData)
	if !ok {
		return nil, fmt.Errorf("invalid type in cache for key %s", key)
	}

	return data, nil
}

// SetDashboard stores dashboard data in cache
func (c *memoryCache) SetDashboard(ctx context.Context, key string, data *domain.DashboardData, ttl time.Duration) error {
	return c.Set(ctx, key, data, ttl)
}

// InvalidateDashboard removes dashboard data from cache
func (c *memoryCache) InvalidateDashboard(ctx context.Context, userID uuid.UUID) error {
	key := fmt.Sprintf("dashboard:%s", userID.String())
	return c.Delete(ctx, key)
}

// GetMetrics retrieves cached metrics
func (c *memoryCache) GetMetrics(ctx context.Context, key string) (map[string]domain.Metric, error) {
	val, err := c.Get(ctx, key)
	if err != nil {
		return nil, err
	}

	// Type assertion
	metrics, ok := val.(map[string]domain.Metric)
	if !ok {
		return nil, fmt.Errorf("invalid type in cache for key %s", key)
	}

	return metrics, nil
}

// SetMetrics stores metrics in cache
func (c *memoryCache) SetMetrics(ctx context.Context, key string, metrics map[string]domain.Metric, ttl time.Duration) error {
	return c.Set(ctx, key, metrics, ttl)
}

// Get retrieves a value from cache
func (c *memoryCache) Get(ctx context.Context, key string) (interface{}, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		c.misses++
		return nil, fmt.Errorf("cache miss: key not found")
	}

	if entry.isExpired() {
		c.misses++
		// Don't delete here to avoid deadlock, cleanup goroutine will handle it
		return nil, fmt.Errorf("cache miss: key expired")
	}

	c.hits++
	return entry.value, nil
}

// Set stores a value in cache with TTL
func (c *memoryCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &cacheEntry{
		value:      value,
		expiration: time.Now().Add(ttl),
	}

	return nil
}

// Delete removes a key from cache
func (c *memoryCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.entries, key)
	return nil
}

// Clear removes all keys matching a pattern
func (c *memoryCache) Clear(ctx context.Context, pattern string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	// Simple pattern matching (prefix matching)
	keysToDelete := []string{}
	for key := range c.entries {
		if matchPattern(key, pattern) {
			keysToDelete = append(keysToDelete, key)
		}
	}

	for _, key := range keysToDelete {
		delete(c.entries, key)
	}

	return nil
}

// HitRate returns the cache hit rate
func (c *memoryCache) HitRate() (float64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	total := c.hits + c.misses
	if total == 0 {
		return 0, nil
	}

	return float64(c.hits) / float64(total), nil
}

// MissRate returns the cache miss rate
func (c *memoryCache) MissRate() (float64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	total := c.hits + c.misses
	if total == 0 {
		return 0, nil
	}

	return float64(c.misses) / float64(total), nil
}

// Size returns the number of entries in cache
func (c *memoryCache) Size() (int64, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return int64(len(c.entries)), nil
}

// cleanupExpired periodically removes expired entries
func (c *memoryCache) cleanupExpired() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for key, entry := range c.entries {
			if now.After(entry.expiration) {
				delete(c.entries, key)
			}
		}
		c.mu.Unlock()
	}
}

// matchPattern performs simple pattern matching
// Supports '*' as wildcard at the end
func matchPattern(key, pattern string) bool {
	if pattern == "*" {
		return true
	}

	// Check for wildcard at the end
	if len(pattern) > 0 && pattern[len(pattern)-1] == '*' {
		prefix := pattern[:len(pattern)-1]
		return len(key) >= len(prefix) && key[:len(prefix)] == prefix
	}

	return key == pattern
}

// SerializableCache wraps memoryCache with JSON serialization support
type SerializableCache struct {
	*memoryCache
}

// NewSerializableCache creates a cache with JSON serialization
func NewSerializableCache() domain.CacheRepository {
	return &SerializableCache{
		memoryCache: &memoryCache{
			entries: make(map[string]*cacheEntry),
		},
	}
}

// Get retrieves and deserializes a value
func (c *SerializableCache) Get(ctx context.Context, key string) (interface{}, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.entries[key]
	if !exists {
		c.misses++
		return nil, fmt.Errorf("cache miss: key not found")
	}

	if entry.isExpired() {
		c.misses++
		return nil, fmt.Errorf("cache miss: key expired")
	}

	c.hits++

	// If value is []byte, it's serialized JSON
	if bytes, ok := entry.value.([]byte); ok {
		var result interface{}
		if err := json.Unmarshal(bytes, &result); err != nil {
			return nil, fmt.Errorf("failed to deserialize cache value: %w", err)
		}
		return result, nil
	}

	return entry.value, nil
}

// Set serializes and stores a value
func (c *SerializableCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	// Serialize to JSON
	bytes, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to serialize cache value: %w", err)
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	c.entries[key] = &cacheEntry{
		value:      bytes,
		expiration: time.Now().Add(ttl),
	}

	return nil
}
