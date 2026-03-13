/**
 * Application Configuration
 * Centralized configuration for the Smart Mill Scale application
 */

export const APP_CONFIG = {
  // Application metadata
  name: 'Smart Mill Scale',
  version: '1.0.0',
  description: 'Sistem Penimbangan Offline dengan Sinkronisasi Cloud',

  // Session configuration
  session: {
    timeout: 30 * 60 * 1000, // 30 minutes in milliseconds
    warningTimeout: 2 * 60 * 1000, // 2 minutes before timeout
    lockCheckInterval: 1000, // Check every second
  },

  // Polling intervals
  polling: {
    weight: 1000, // Check weight every second
    sync: 30000, // Sync status every 30 seconds
    weighings: 60000, // Recent weighings every minute
    activity: 60000, // Session activity every minute
  },

  // Data refresh limits
  limits: {
    recentWeighings: 10,
    auditLogPageSize: 50,
    maxRetries: 3,
  },

  // Feature flags
  features: {
    autoSync: true,
    offlineMode: true,
    auditLog: true,
  },

  // API configuration (for future cloud sync)
  api: {
    timeout: 10000,
    retryDelay: 1000,
    maxRetries: 3,
  },
}

export default APP_CONFIG
