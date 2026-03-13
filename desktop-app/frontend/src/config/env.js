// Frontend Environment Configuration
// This file provides a centralized way to access environment variables
// with proper defaults and validation

// Get environment variable with default value
const getEnvVar = (key, defaultValue = '') => {
  if (import.meta.env[key] !== undefined) {
    return import.meta.env[key]
  }
  return defaultValue
}

// Get numeric environment variable with validation
const getEnvNumber = (key, defaultValue = 0) => {
  const value = getEnvVar(key)
  const num = parseInt(value, 10)
  return !isNaN(num) ? num : defaultValue
}

// Get boolean environment variable
const getEnvBoolean = (key, defaultValue = false) => {
  const value = getEnvVar(key, '').toLowerCase()
  return value === 'true' || value === '1' || value === 'yes'
}

// Get JSON environment variable with fallback
const getEnvJSON = (key, defaultValue = {}) => {
  try {
    const value = getEnvVar(key)
    return value ? JSON.parse(value) : defaultValue
  } catch (error) {
    console.warn(`Invalid JSON for ${key}, using default:`, error)
    return defaultValue
  }
}

// Application Configuration
export const appConfig = {
  name: getEnvVar('VITE_APP_NAME', 'Smart Mill Scale'),
  version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
  description: getEnvVar('VITE_APP_DESCRIPTION', 'Sistem Penimbangan Offline dengan Sinkronisasi Cloud'),
  environment: getEnvVar('VITE_APP_ENV', 'development'),
  debug: getEnvBoolean('VITE_DEBUG_MODE', false),
}

// API Configuration
// Note: baseUrl is deprecated - using Wails bindings for local operations
export const apiConfig = {
  baseUrl: null, // Deprecated - use Wails bindings instead
  timeout: getEnvNumber('VITE_API_TIMEOUT', 30000),
  retryAttempts: getEnvNumber('VITE_API_RETRY_ATTEMPTS', 3),
  syncServerUrl: getEnvVar('VITE_SYNC_SERVER_URL', 'https://agronomi.kskgroup.web.id/graphql'),
}

// Wails Configuration
// Primary method for local operations - replaces HTTP API calls
export const wailsConfig = {
  mode: getEnvVar('VITE_WAILS_MODE', 'production'),
  host: getEnvVar('VITE_WAILS_HOST', 'localhost'),
  port: getEnvNumber('VITE_WAILS_PORT', 34115),
  enabled: getEnvBoolean('VITE_WAILS_ENABLED', true),
}

// Authentication Configuration
export const authConfig = {
  sessionTimeout: getEnvNumber('VITE_AUTH_SESSION_TIMEOUT', 1800000), // 30 minutes
  warningTimeout: getEnvNumber('VITE_AUTH_WARNING_TIMEOUT', 120000),  // 2 minutes
  passwordMinLength: getEnvNumber('VITE_AUTH_PASSWORD_MIN_LENGTH', 8),
}

// UI Configuration
export const uiConfig = {
  theme: getEnvVar('VITE_THEME', 'dark'),
  language: getEnvVar('VITE_LANGUAGE', 'id'),
  timezone: getEnvVar('VITE_TIMEZONE', 'Asia/Jakarta'),
}

// Development Configuration
export const devConfig = {
  mode: getEnvBoolean('VITE_DEV_MODE', false),
  debug: getEnvBoolean('VITE_DEBUG_MODE', false),
  logLevel: getEnvVar('VITE_LOG_LEVEL', 'info'),
  mockSerial: getEnvBoolean('VITE_ENABLE_MOCK_SERIAL', true),
  offlineMode: getEnvBoolean('VITE_ENABLE_OFFLINE_MODE', true),
}

// Feature Flags
export const features = {
  mockSerial: getEnvBoolean('VITE_ENABLE_MOCK_SERIAL', true),
  offlineMode: getEnvBoolean('VITE_ENABLE_OFFLINE_MODE', true),
  errorReporting: getEnvBoolean('VITE_ENABLE_ERROR_REPORTING', false),
  soundNotifications: getEnvBoolean('VITE_ENABLE_SOUND_NOTIFICATIONS', false),
  csp: getEnvBoolean('VITE_ENABLE_CSP', true),
  xssProtection: getEnvBoolean('VITE_XSS_PROTECTION', true),
}

// Performance Configuration
export const performanceConfig = {
  cacheEnabled: getEnvBoolean('VITE_CACHE_ENABLED', true),
  lazyLoading: getEnvBoolean('VITE_LAZY_LOADING', true),
  chunkSizeWarningLimit: getEnvNumber('VITE_CHUNK_SIZE_WARNING_LIMIT', 1000),
}

// Real-time Update Intervals (in milliseconds)
export const updateIntervals = {
  weight: getEnvNumber('VITE_WEIGHT_UPDATE_INTERVAL', 1000),        // 1 second
  syncStatus: getEnvNumber('VITE_SYNC_STATUS_UPDATE_INTERVAL', 30000), // 30 seconds
  syncHistory: getEnvNumber('VITE_SYNC_HISTORY_UPDATE_INTERVAL', 60000), // 1 minute
  chart: getEnvNumber('VITE_CHART_REFRESH_INTERVAL', 5000),        // 5 seconds
  serial: getEnvNumber('VITE_SERIAL_UPDATE_INTERVAL', 1000),       // 1 second
}

// Serial Port Configuration
export const serialConfig = {
  updateInterval: getEnvNumber('VITE_SERIAL_UPDATE_INTERVAL', 1000),
  stabilityThreshold: getEnvNumber('VITE_SERIAL_STABILITY_THRESHOLD', 3),
}

// Notification Configuration
export const notificationConfig = {
  duration: getEnvNumber('VITE_NOTIFICATION_DURATION', 5000), // 5 seconds
  maxCount: getEnvNumber('VITE_NOTIFICATION_MAX_COUNT', 5),
  soundEnabled: getEnvBoolean('VITE_ENABLE_SOUND_NOTIFICATIONS', false),
}

// Chart Configuration
export const chartConfig = {
  animationDuration: getEnvNumber('VITE_CHART_ANIMATION_DURATION', 750),
  refreshInterval: getEnvNumber('VITE_CHART_REFRESH_INTERVAL', 5000),
}

// Data Export Configuration
export const exportConfig = {
  maxRecords: getEnvNumber('VITE_EXPORT_MAX_RECORDS', 10000),
  batchSize: getEnvNumber('VITE_EXPORT_BATCH_SIZE', 1000),
}

// External Services Configuration
export const externalServices = {
  sentry: getEnvVar('VITE_SENTRY_DSN', ''),
}

// Build Configuration
export const buildConfig = {
  sourceMap: getEnvBoolean('VITE_BUILD_SOURCE_MAP', true),
  minify: getEnvBoolean('VITE_BUILD_MINIFY', true),
  target: getEnvVar('VITE_BUILD_TARGET', 'es2020'),
}

// Validation Functions
export const validateConfig = () => {
  const errors = []

  // Validate API timeout (only for external sync server)
  if (apiConfig.timeout < 1000) {
    errors.push('API timeout should be at least 1000ms')
  }

  // Validate Wails configuration
  if (!wailsConfig.enabled) {
    errors.push('Wails bindings should be enabled for local operations')
  }

  // Validate intervals
  if (updateIntervals.weight < 100) {
    errors.push('Weight update interval should be at least 100ms')
  }

  if (updateIntervals.syncStatus < 5000) {
    errors.push('Sync status update interval should be at least 5000ms')
  }

  // Validate auth configuration
  if (authConfig.sessionTimeout < 60000) {
    errors.push('Session timeout should be at least 60000ms (1 minute)')
  }

  if (authConfig.warningTimeout >= authConfig.sessionTimeout) {
    errors.push('Warning timeout should be less than session timeout')
  }

  // Validate export configuration
  if (exportConfig.maxRecords < 1) {
    errors.push('Export max records should be at least 1')
  }

  if (exportConfig.batchSize < 1 || exportConfig.batchSize > exportConfig.maxRecords) {
    errors.push('Export batch size should be between 1 and max records')
  }

  return errors
}

// Get configuration summary for debugging
export const getConfigSummary = () => ({
  app: appConfig,
  api: apiConfig,
  auth: {
    sessionTimeout: `${authConfig.sessionTimeout / 1000}s`,
    warningTimeout: `${authConfig.warningTimeout / 1000}s`,
  },
  features: Object.entries(features).filter(([, enabled]) => enabled).map(([name]) => name),
  intervals: updateIntervals,
  environment: appConfig.environment,
})

// Log configuration in development mode
if (devConfig.debug) {
  console.group('📋 Configuration loaded from environment variables')
  console.log('App Config:', appConfig)
  console.log('API Config (External only):', apiConfig)
  console.log('Wails Config (Primary):', wailsConfig)
  console.log('Features:', features)
  console.log('Update Intervals:', updateIntervals)
  console.log('🎯 Architecture: Using Wails bindings for local operations')
  console.groupEnd()

  // Validate configuration
  const validationErrors = validateConfig()
  if (validationErrors.length > 0) {
    console.group('⚠️ Configuration Validation Warnings')
    validationErrors.forEach(error => console.warn(error))
    console.groupEnd()
  }
}

export default {
  app: appConfig,
  api: apiConfig,
  wails: wailsConfig,
  auth: authConfig,
  ui: uiConfig,
  dev: devConfig,
  features,
  performance: performanceConfig,
  intervals: updateIntervals,
  serial: serialConfig,
  notification: notificationConfig,
  chart: chartConfig,
  export: exportConfig,
  external: externalServices,
  build: buildConfig,
  validate: validateConfig,
  summary: getConfigSummary,
}