import { useEffect, useCallback, useRef, useState } from 'react'
import useGlobalWeightStore from '../store/useGlobalWeightStore'
import eventCoordinator from '../services/EventCoordinator'

/**
 * useWeightMonitoring Hook
 *
 * Advanced hook for real-time weight monitoring with automatic lifecycle management
 * Handles Wails event subscription, cleanup, and provides control methods
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.wails - Wails instance for event listening
 * @param {string} options.role - User role for permission checking
 * @param {boolean} options.autoStart - Automatically start monitoring on mount
 * @param {boolean} options.autoCleanup - Automatically cleanup on unmount
 * @param {Function} options.onWeightChange - Callback when weight changes
 * @param {Function} options.onConnectionChange - Callback when connection changes
 * @param {Function} options.onStabilityChange - Callback when stability changes
 * @returns {Object} Monitoring state and control methods
 *
 * @example
 * const {
 *   isMonitoring,
 *   start,
 *   stop,
 *   currentWeight
 * } = useWeightMonitoring({
 *   wails,
 *   role: 'TIMBANGAN',
 *   autoStart: true,
 *   onWeightChange: (weight) => console.log('Weight:', weight)
 * })
 */
const useWeightMonitoring = (options = {}) => {
  const {
    wails = null,
    role = null,
    autoStart = false,
    autoCleanup = false, // Default to false to keep monitoring active across pages
    onWeightChange = null,
    onConnectionChange = null,
    onStabilityChange = null
  } = options

  // Get store methods
  const {
    currentWeight,
    isStable,
    isConnected,
    isMonitoring,
    isStarting,
    isStopping,
    error,
    lastUpdate,
    unit,
    statistics,
    monitoringStartedAt,
    initialize,
    startMonitoring,
    stopMonitoring,
    handleWeightEvent,
    subscribe,
    checkPermission,
    setWails
  } = useGlobalWeightStore()

  // Refs for callbacks
  const onWeightChangeRef = useRef(onWeightChange)
  const onConnectionChangeRef = useRef(onConnectionChange)
  const onStabilityChangeRef = useRef(onStabilityChange)
  const eventListenerRef = useRef(null)
  const unsubscribeRef = useRef(null)
  // Use lazy initialization to avoid Date.now() being called during module loading (which can be mocked in tests)
  const componentIdRef = useRef(null)
  if (!componentIdRef.current) {
    componentIdRef.current = `monitoring-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Local states
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState(null)

  // Update callback refs
  useEffect(() => {
    onWeightChangeRef.current = onWeightChange
    onConnectionChangeRef.current = onConnectionChange
    onStabilityChangeRef.current = onStabilityChange
  }, [onWeightChange, onConnectionChange, onStabilityChange])

  // Check permissions
  const hasControlPermission = useCallback(() => {
    if (!role) return true
    return checkPermission(role, 'canControl')
  }, [role, checkPermission])

  // Start monitoring with permission check
  const start = useCallback(async () => {
    if (!hasControlPermission()) {
      const error = `Role ${role} does not have permission to control monitoring`
      console.error('❌ [useWeightMonitoring]', error)
      setInitError(error)
      return false
    }

    const result = await startMonitoring(role)
    if (result) {
      setInitError(null)
    }
    return result
  }, [startMonitoring, role, hasControlPermission])

  // Stop monitoring with permission check
  const stop = useCallback(async () => {
    if (!hasControlPermission()) {
      const error = `Role ${role} does not have permission to control monitoring`
      console.error('❌ [useWeightMonitoring]', error)
      setInitError(error)
      return false
    }

    const result = await stopMonitoring(role)
    return result
  }, [stopMonitoring, role, hasControlPermission])

  // Track isMonitoring in a ref to avoid stale closures in cleanup
  const isMonitoringRef = useRef(isMonitoring)
  useEffect(() => {
    isMonitoringRef.current = isMonitoring
  }, [isMonitoring])

  // Initialize monitoring system
  useEffect(() => {
    const initializeMonitoring = async () => {
      console.log('🎬 [useWeightMonitoring] Initializing monitoring system...')

      try {
        // Initialize store if Wails is provided
        // This ensures the EventCoordinator is set up
        if (wails) {
          await initialize(wails, {
            userRole: role,
            autoStart
          })
        }

        // Subscribe directly to EventCoordinator untuk lebih reliable event handling
        const coordinatorUnsubscribe = eventCoordinator.subscribe(
          componentIdRef.current,
          (eventType, data) => {
            // Handle different event types from EventCoordinator
            switch (eventType) {
              case 'weight_updated':
                if (onWeightChangeRef.current && data) {
                  onWeightChangeRef.current(data.weight, data)
                }
                if (onConnectionChangeRef.current && data && data.connected !== undefined) {
                  onConnectionChangeRef.current(data.connected)
                }
                // Debug log for stability callback
                console.error('Stability check:', {
                  hasRef: !!onStabilityChangeRef.current,
                  dataStable: data?.stable,
                  condition: onStabilityChangeRef.current && data && data.stable !== undefined
                })
                if (onStabilityChangeRef.current && data && data.stable !== undefined) {
                  onStabilityChangeRef.current(data.stable)
                }
                break

              case 'connection_change':
                if (onConnectionChangeRef.current && data) {
                  onConnectionChangeRef.current(data.connected)
                }
                break

              case 'connection_health_warning':
                console.warn('⚠️ [useWeightMonitoring] Connection health warning:', data)
                break

              case 'monitoring_started':
              case 'monitoring_stopped':
                console.log(`📢 [useWeightMonitoring] ${eventType}`)
                break

              default:
                break
            }
          },
          { role }
        )

        // Also subscribe to store updates for state management
        const storeUnsubscribe = subscribe(
          componentIdRef.current + '-store',
          (eventType, data) => {
            // Handle store-specific events
            switch (eventType) {
              case 'monitoring_started':
              case 'monitoring_stopped':
                console.log(`📢 [useWeightMonitoring] Store event: ${eventType}`)
                break
              default:
                break
            }
          },
          { role }
        )

        // Store unsubscribe functions untuk cleanup
        unsubscribeRef.current = () => {
          if (coordinatorUnsubscribe) coordinatorUnsubscribe()
          if (storeUnsubscribe) storeUnsubscribe()
        }

        setIsInitialized(true)
        console.log('✅ [useWeightMonitoring] Monitoring system initialized with EventCoordinator')

      } catch (error) {
        console.error('❌ [useWeightMonitoring] Failed to initialize:', error)
        setInitError(error.message)
      }
    }

    initializeMonitoring()

    // Cleanup on unmount
    return () => {
      console.log('🧹 [useWeightMonitoring] Cleaning up component, unsubscribing from events')

      // Unsubscribe dari EventCoordinator dan store
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      // Explicit cleanup remains opt-in so page navigation can keep monitoring alive.
      if (autoCleanup && isMonitoringRef.current) {
        stopMonitoring(null, { force: true })
      }
    }
    // Only re-run when configuration changes, not when state changes
    // Cleanup function captures current values via closure
  }, [wails, role, autoStart, autoCleanup])

  return {
    // Monitoring state
    isMonitoring,
    isStarting,
    isStopping,
    isInitialized,
    error: error || initError,

    // Weight data
    currentWeight,
    isStable,
    isConnected,
    unit,
    lastUpdate,

    // Control methods
    start,
    stop,

    // Permission info
    canControl: hasControlPermission(),

    // Status helpers
    isReady: isInitialized && !error && !initError,
    isActive: isMonitoring && isConnected,

    // Analytics
    statistics,
    monitoringStartedAt,
    hasAnalyticsAccess: checkPermission(role, 'canAnalyze')
  }
}

export default useWeightMonitoring
