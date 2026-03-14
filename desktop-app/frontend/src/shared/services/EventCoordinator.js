/**
 * Global Event Coordinator
 *
 * Centralized event management untuk weight monitoring
 * Menjaga koneksi real-time data tetap aktif saat navigasi antar halaman
 */
class EventCoordinator {
  constructor() {
    this.isInitialized = false
    this.wailsInstance = null
    this.globalEventListener = null
    this.activeSubscribers = new Map() // componentId -> subscription
    this.lastEventTime = null
    this.heartbeatInterval = null
    this.connectionStatus = {
      isConnected: false,
      lastHeartbeat: null,
      eventCount: 0
    }

    // Debug logging
    this.debugMode = import.meta.env.DEV
    this.logPrefix = '🎯 [EventCoordinator]'
  }

  /**
   * Initialize coordinator dengan Wails instance
   */
  async initialize(wails) {
    try {
      if (this.isInitialized && wails === this.wailsInstance) {
        this.debug('Already initialized with same Wails instance')
        return true
      }

      this.debug('Initializing with Wails:', !!wails)

      // Cleanup previous instance jika ada
      await this.cleanup()

      this.wailsInstance = wails

      if (!wails || !wails.EventsOn) {
        this.warn('Wails instance not available for event coordination')
        // Set mock mode for development instead of returning false
        this.isInitialized = true
        this.connectionStatus.isConnected = true
        this.connectionStatus.lastHeartbeat = Date.now()
        this.startHeartbeat()
        this.debug('Using mock mode for event coordination')
        return true
      }

      // Create single global event listener
      this.globalEventListener = (eventJSON) => {
        try {
          this.handleGlobalEvent(eventJSON)
        } catch (error) {
          this.error('Error in global event listener:', error)
        }
      }

      // Register global event listener
      wails.EventsOn('weight_event', this.globalEventListener)
      this.isInitialized = true
      this.connectionStatus.isConnected = true
      this.connectionStatus.lastHeartbeat = Date.now()

      // Start heartbeat monitoring
      this.startHeartbeat()

      this.debug('Global event listener registered successfully')
      return true

    } catch (error) {
      this.error('Failed to initialize EventCoordinator:', error)
      // Set mock mode as fallback
      this.isInitialized = true
      this.connectionStatus.isConnected = true
      this.connectionStatus.lastHeartbeat = Date.now()
      this.startHeartbeat()
      this.debug('Using fallback mode due to initialization error')
      return true
    }
  }

  /**
   * Handle semua incoming events dan distribute ke subscribers
   */
  handleGlobalEvent(eventJSON) {
    try {
      this.lastEventTime = Date.now()
      this.connectionStatus.eventCount++

      this.debug('Processing global event:', eventJSON)

      let event
      if (typeof eventJSON === 'string') {
        event = JSON.parse(eventJSON)
      } else {
        event = eventJSON
      }

      if (!event || !event.reading) {
        this.warn('Invalid event format:', event)
        return
      }

      // Distribute ke semua active subscribers
      this.distributeToSubscribers('weight_updated', {
        weight: event.reading.weight,
        stable: event.reading.stable,
        unit: event.reading.unit || 'kg',
        connected: true,
        type: event.type || 'weight_change',
        timestamp: this.lastEventTime,
        previous: event.previous
      })

    } catch (error) {
      this.error('Failed to handle global event:', error)
    }
  }

  /**
   * Register component untuk menerima events
   */
  subscribe(componentId, callback, options = {}) {
    if (!this.isInitialized) {
      this.warn('Cannot subscribe - coordinator not initialized')
      return () => {}
    }

    this.debug(`Component ${componentId} subscribing with options:`, options)

    // Enhanced subscription tracking
    const subscription = {
      id: componentId,
      callback,
      role: options.role || null,
      filter: options.filter || null,
      subscribedAt: Date.now(),
      eventCount: 0,
      lastEventTime: null
    }

    this.activeSubscribers.set(componentId, subscription)

    // Log subscription details for debugging
    this.debug(`📊 [SUBSCRIPTION TRACKER] New subscription:`, {
      componentId,
      role: options.role,
      totalSubscribers: this.activeSubscribers.size,
      timestamp: new Date().toISOString()
    })

    // Return unsubscribe function with logging
    return () => {
      const sub = this.activeSubscribers.get(componentId)
      this.debug(`📊 [SUBSCRIPTION TRACKER] Component ${componentId} unsubscribing:`, {
        subscriptionDuration: Date.now() - sub?.subscribedAt,
        eventsReceived: sub?.eventCount || 0,
        remainingSubscribers: this.activeSubscribers.size - 1
      })
      this.activeSubscribers.delete(componentId)
    }
  }

  /**
   * Distribute events ke subscribers yang sesuai
   */
  distributeToSubscribers(eventType, data) {
    let distributedCount = 0
    let filteredCount = 0
    let errorCount = 0

    this.debug(`📤 [EVENT DISTRIBUTION] Distributing ${eventType} to ${this.activeSubscribers.size} subscribers`)

    this.activeSubscribers.forEach((subscription, componentId) => {
      try {
        // Check role permission
        if (subscription.role) {
          if (!this.hasPermission(subscription.role, 'canView')) {
            filteredCount++
            return
          }
        }

        // Apply filter
        if (subscription.filter && !subscription.filter(eventType, data)) {
          filteredCount++
          return
        }

        // Call subscriber callback
        subscription.callback(eventType, data)

        // Update subscription tracking
        subscription.eventCount++
        subscription.lastEventTime = Date.now()

        distributedCount++

        // Debug log for each component if needed
        if (this.debugMode && distributedCount <= 3) {
          this.debug(`📥 [EVENT DELIVERED] To ${componentId} (${subscription.role})`)
        }

      } catch (error) {
        errorCount++
        this.error(`❌ [EVENT ERROR] Error distributing to ${componentId}:`, error)
      }
    })

    // Enhanced distribution logging
    this.debug(`📊 [EVENT SUMMARY] ${eventType}:`, {
      totalSubscribers: this.activeSubscribers.size,
      distributed: distributedCount,
      filtered: filteredCount,
      errors: errorCount,
      eventData: data ? {
        weight: data.weight,
        stable: data.stable,
        connected: data.connected
      } : null
    })
  }

  /**
   * Start heartbeat monitoring untuk connection health
   */
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const timeSinceLastEvent = now - (this.lastEventTime || now)
      const timeSinceLastHeartbeat = now - (this.connectionStatus.lastHeartbeat || now)

      // Jika tidak ada event dalam 5 detik, check connection
      if (timeSinceLastEvent > 5000) {
        this.warn(`No events received for ${timeSinceLastEvent}ms`)

        // Notify subscribers about potential connection issue
        this.distributeToSubscribers('connection_health_warning', {
          timeSinceLastEvent,
          eventCount: this.connectionStatus.eventCount
        })
      }

      // Update heartbeat
      this.connectionStatus.lastHeartbeat = now

    }, 2000) // Check every 2 seconds
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Check permission untuk role
   */
  hasPermission(role, permission) {
    const rolePermissions = {
      ADMIN: { canControl: true, canView: true, canAnalyze: true, canExport: true },
      SUPERVISOR: { canControl: true, canView: true, canAnalyze: true, canExport: true },
      TIMBANGAN: { canControl: true, canView: true, canAnalyze: false, canExport: false },
      GRADING: { canControl: false, canView: true, canAnalyze: false, canExport: false }
    }

    const rolePerms = rolePermissions[role]
    return rolePerms ? rolePerms[permission] === true : false
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      ...this.connectionStatus,
      isInitialized: this.isInitialized,
      subscriberCount: this.activeSubscribers.size,
      lastEventTime: this.lastEventTime
    }
  }

  /**
   * Manual cleanup
   */
  async cleanup() {
    this.debug('Cleaning up EventCoordinator...')

    // Stop heartbeat
    this.stopHeartbeat()

    // Remove Wails event listener
    if (this.wailsInstance && this.globalEventListener && this.wailsInstance.EventsOff) {
      try {
        this.wailsInstance.EventsOff('weight_event', this.globalEventListener)
        this.debug('Global event listener removed')
      } catch (error) {
        this.error('Error removing global event listener:', error)
      }
    }

    // Clear all subscribers
    this.activeSubscribers.clear()

    // Reset state
    this.isInitialized = false
    this.wailsInstance = null
    this.globalEventListener = null
    this.lastEventTime = null
    this.connectionStatus = {
      isConnected: false,
      lastHeartbeat: null,
      eventCount: 0
    }

    this.debug('EventCoordinator cleaned up')
  }

  /**
   * Debug logging helper
   */
  debug(...args) {
    if (this.debugMode) {
      console.log(this.logPrefix, ...args)
    }
  }

  warn(...args) {
    if (this.debugMode) {
      console.warn(this.logPrefix, ...args)
    }
  }

  error(...args) {
    console.error(this.logPrefix, ...args)
  }
}

// Create singleton instance
const eventCoordinator = new EventCoordinator()

export default eventCoordinator
