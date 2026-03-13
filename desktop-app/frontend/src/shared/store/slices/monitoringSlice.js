import eventCoordinator from '../../services/EventCoordinator'
import { getCurrentTimestamp } from '../storeUtils'

export const createMonitoringSlice = (set, get) => ({
    // ============================================
    // MONITORING STATE
    // ============================================
    isMonitoring: false,
    isStarting: false,
    isStopping: false,
    isPersistent: false, // Lock to prevent accidental stopping
    isConnected: false,

    // ============================================
    // ERROR HANDLING
    // ============================================
    error: null,
    lastError: null,

    // ============================================
    // TIMESTAMPS
    // ============================================
    lastUpdate: '',
    monitoringStartedAt: '',

    // ============================================
    // WAILS CONNECTION
    // ============================================
    wails: null,
    eventCoordinatorId: null,
    eventCoordinatorUnsubscribe: null,

    // ============================================
    // ACTIONS - BASIC
    // ============================================

    setWails: (wails) => {
        console.log('🔌 [GlobalWeightStore] Setting Wails connection')
        set({ wails })
    },

    setPersistent: (isPersistent) => {
        console.log(`🔒 [GlobalWeightStore] Setting persistence: ${isPersistent}`)
        set({ isPersistent })
    },

    setError: (error) => set({
        error,
        lastError: error,
        lastUpdate: getCurrentTimestamp()
    }),

    clearError: () => set({ error: null }),

    // ============================================
    // ACTIONS - MONITORING CONTROL
    // ============================================

    startMonitoring: async (userRole = null) => {
        const { wails, isMonitoring, isStarting, checkPermission } = get()

        // Check permission
        if (userRole && !checkPermission(userRole, 'canControl')) {
            const error = `Role ${userRole} does not have permission to control monitoring`
            console.error('❌ [GlobalWeightStore]', error)
            set({ error })
            return false
        }

        if (!wails) {
            const error = 'Wails connection not available'
            console.error('❌ [GlobalWeightStore]', error)
            set({ error, isStarting: false })
            return false
        }

        // Check actual backend status to prevent desync
        let backendIsMonitoring = false
        if (wails.IsWeightMonitoringActive) {
            try {
                const result = await wails.IsWeightMonitoringActive()
                const parsed = typeof result === 'string' ? JSON.parse(result) : result
                backendIsMonitoring = parsed.isMonitoring
            } catch (e) {
                console.warn('⚠️ [GlobalWeightStore] Failed to check backend status:', e)
            }
        }

        // If backend is already running, just sync state and refresh
        if (backendIsMonitoring) {
            if (!isMonitoring) {
                console.log('🔄 [GlobalWeightStore] Syncing state: Backend is monitoring')
                set({ isMonitoring: true, isStarting: false, error: null })
            }

            console.log('✅ [GlobalWeightStore] Monitoring already active (backend), refreshing status...')
            await get().refreshStatus()
            return true
        }

        // If backend is NOT running, but store says it is -> Force reset
        if (isMonitoring && !backendIsMonitoring) {
            console.warn('⚠️ [GlobalWeightStore] State mismatch: Store says monitoring, but Backend is NOT. Resetting...')
            set({ isMonitoring: false })
        }

        if (isStarting) {
            console.log('⚖️ [GlobalWeightStore] Monitoring already starting')
            return true
        }

        set({ isStarting: true, error: null })

        try {
            console.log('🚀 [GlobalWeightStore] Starting weight monitoring...')

            // Start monitoring via Wails
            await wails.StartWeightMonitoring()

            console.log('✅ [GlobalWeightStore] Weight monitoring started successfully')

            set({
                isMonitoring: true,
                isStarting: false,
                error: null,
                monitoringStartedAt: getCurrentTimestamp(),
                lastUpdate: getCurrentTimestamp()
            })

            // Get initial status
            get().refreshStatus()

            // Notify subscribers
            get().notifySubscribers('monitoring_started')

            return true

        } catch (error) {
            console.error('❌ [GlobalWeightStore] Failed to start monitoring:', error)
            set({
                isMonitoring: false,
                isStarting: false,
                error: error.message || 'Failed to start weight monitoring',
                lastUpdate: getCurrentTimestamp()
            })
            return false
        }
    },

    stopMonitoring: async (userRole = null, options = {}) => {
        const { wails, isMonitoring, isStopping, isPersistent, checkPermission } = get()
        const force = options.force || false

        // Check permission
        if (userRole && !checkPermission(userRole, 'canControl')) {
            const error = `Role ${userRole} does not have permission to control monitoring`
            console.error('❌ [GlobalWeightStore]', error)
            set({ error })
            return false
        }

        // CRITICAL: Check persistence lock BEFORE checking monitoring state
        // This ensures we return false without modifying state
        if (isPersistent && !force) {
            console.warn('🛡️ [GlobalWeightStore] Stop blocked by persistence lock. Use { force: true } to override.')
            return false
        }

        if (!isMonitoring) {
            console.log('⚖️ [GlobalWeightStore] Monitoring not active')
            return true
        }

        if (isStopping) {
            console.log('⚖️ [GlobalWeightStore] Already stopping')
            return true
        }

        if (!wails) {
            console.warn('⚠️ [GlobalWeightStore] Wails not available, stopping locally only')
            set({
                isMonitoring: false,
                isConnected: false,
                isStable: false,
                currentWeight: 0,
                isStopping: false,
                monitoringStartedAt: null
            })
            return true
        }

        set({ isStopping: true })

        try {
            console.log('🛑 [GlobalWeightStore] Stopping weight monitoring...')
            console.trace('🛑 [GlobalWeightStore] Stop triggered by:')

            await wails.StopWeightMonitoring()

            console.log('✅ [GlobalWeightStore] Weight monitoring stopped successfully')

            set({
                isMonitoring: false,
                isConnected: false,
                isStable: false,
                currentWeight: 0,
                isStopping: false,
                error: null,
                monitoringStartedAt: null,
                lastUpdate: getCurrentTimestamp()
            })

            // Notify subscribers
            get().notifySubscribers('monitoring_stopped')

            return true

        } catch (error) {
            console.error('❌ [GlobalWeightStore] Failed to stop monitoring:', error)
            set({
                isStopping: false,
                error: error.message || 'Failed to stop weight monitoring',
                lastUpdate: getCurrentTimestamp()
            })
            return false
        }
    },

    refreshStatus: async () => {
        const { wails } = get()

        if (!wails) {
            console.warn('⚠️ [GlobalWeightStore] Wails not available for status refresh')
            return false
        }

        try {
            console.log('🔄 [GlobalWeightStore] Refreshing weight status...')

            // Get connection status
            const connectionResult = await wails.IsWeightScaleConnected()
            let isConnected = false

            if (typeof connectionResult === 'string') {
                const parsed = JSON.parse(connectionResult)
                isConnected = parsed.isConnected
            } else if (typeof connectionResult === 'object') {
                isConnected = connectionResult.isConnected
            }

            // Get current weight
            const weightResult = await wails.GetCurrentWeight()
            let weightData = { weight: 0, stable: false, unit: 'kg' }

            if (typeof weightResult === 'string') {
                try {
                    weightData = JSON.parse(weightResult)
                } catch (parseError) {
                    console.warn('⚠️ [GlobalWeightStore] Failed to parse weight result:', parseError)
                }
            } else if (typeof weightResult === 'object') {
                weightData = weightResult
            }

            const wasConnected = get().isConnected
            const weightChanged = get().currentWeight !== weightData.weight
            const stabilityChanged = get().isStable !== weightData.stable

            set({
                isConnected,
                currentWeight: weightData.weight || 0,
                isStable: weightData.stable || false,
                unit: weightData.unit || 'kg',
                lastUpdate: getCurrentTimestamp(),
                error: null
            })

            // Record stable weight timestamp
            if (weightData.stable && weightChanged) {
                set({ lastStableWeight: getCurrentTimestamp() })
            }

            // Update statistics
            get().updateStatistics(weightData.weight)

            // Create event if something significant changed
            if (wasConnected !== isConnected || weightChanged || stabilityChanged) {
                get().addWeightEvent({
                    type: wasConnected !== isConnected ? 'connection_change' :
                        stabilityChanged && !weightChanged ? 'stability_change' : 'weight_change',
                    weight: weightData.weight || 0,
                    stable: weightData.stable || false,
                    unit: weightData.unit || 'kg',
                    connected: isConnected,
                    timestamp: getCurrentTimestamp()
                })

                // Notify subscribers
                get().notifySubscribers('weight_updated', {
                    weight: weightData.weight,
                    stable: weightData.stable,
                    connected: isConnected
                })
            }

            console.log('✅ [GlobalWeightStore] Status refreshed:', {
                isConnected,
                weight: weightData.weight,
                stable: weightData.stable
            })

            return true

        } catch (error) {
            console.error('❌ [GlobalWeightStore] Failed to refresh status:', error)
            set({
                error: error.message || 'Failed to refresh weight status',
                lastUpdate: getCurrentTimestamp()
            })
            return false
        }
    },

    getConnectionStatusText: () => {
        const { isConnected, isMonitoring } = get()
        if (!isMonitoring) return 'Not Started'
        if (!isConnected) return 'Disconnected'
        return 'Connected'
    },

    getStatusColorClass: () => {
        const { isConnected, isStable } = get()
        if (!isConnected) return 'text-red-500'
        if (!isStable) return 'text-yellow-500'
        return 'text-green-500'
    },

    getStatusBadgeColor: () => {
        const { isConnected, isStable } = get()
        if (!isConnected) return 'bg-red-500'
        if (!isStable) return 'bg-yellow-500'
        return 'bg-green-500'
    },

    // ============================================
    // INITIALIZATION & CLEANUP
    // ============================================

    initialize: async (wails, options = {}) => {
        // Fix: Use options if provided, otherwise fallback to store state or defaults
        const {
            userRole = get().userRole || null,
            autoStart = options.autoStart !== undefined ? options.autoStart : true
        } = options

        const { eventCoordinatorId, wails: currentWails } = get()

        console.log('🎬 [GlobalWeightStore] Initializing...', { userRole, autoStart })

        if (!wails) {
            console.warn('⚠️ [GlobalWeightStore] No Wails connection provided, using mock mode')
            set({
                isConnected: true,
                isStable: true,
                currentWeight: 12500,
                isMonitoring: false,
                error: null,
                lastUpdate: getCurrentTimestamp()
            })
            return true
        }

        // Check if Wails instance has changed
        const wailsChanged = currentWails !== wails

        set({ wails })

        // Initialize EventCoordinator jika belum atau jika wails instance berubah
        let coordinatorId = eventCoordinatorId
        if (!coordinatorId || wailsChanged) {
            console.log('🔌 [GlobalWeightStore] Initializing EventCoordinator...')

            // Initialize EventCoordinator
            const initialized = await eventCoordinator.initialize(wails)
            if (!initialized) {
                console.error('❌ [GlobalWeightStore] Failed to initialize EventCoordinator')
                return false
            }

            // Create unique coordinator ID for this store instance
            coordinatorId = `store-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            // Subscribe to EventCoordinator untuk menerima events
            const unsubscribe = eventCoordinator.subscribe(
                coordinatorId,
                (eventType, data) => {
                    // Handle events dari EventCoordinator
                    switch (eventType) {
                        case 'weight_updated':
                            get().handleWeightEvent(data)
                            break
                        case 'connection_health_warning':
                            console.warn('⚠️ [GlobalWeightStore] Connection health warning:', data)
                            set({
                                error: `Connection health warning: No events for ${data.timeSinceLastEvent}ms`
                            })
                            break
                        default:
                            console.log('📡 [GlobalWeightStore] Unknown event type:', eventType, data)
                    }
                },
                { role: userRole }
            )

            set({
                eventCoordinatorId: coordinatorId,
                // Store unsubscribe function for cleanup
                eventCoordinatorUnsubscribe: unsubscribe
            })

            console.log('✅ [GlobalWeightStore] EventCoordinator initialized and subscribed')
        }

        if (autoStart) {
            return await get().startMonitoring(userRole)
        }

        return true
    },

    cleanup: async (options = {}) => {
        const { isMonitoring, isPersistent, subscribers, eventCoordinatorId, eventCoordinatorUnsubscribe } = get()
        const force = options.force || false

        console.log('🧹 [GlobalWeightStore] cleanup() CALLED! isMonitoring:', isMonitoring, 'isPersistent:', isPersistent, 'force:', force)
        console.trace('🧹 [GlobalWeightStore] cleanup() trace:')

        // Only stop monitoring if not persistent or force is true
        if (isMonitoring) {
            if (isPersistent && !force) {
                console.log('🛡️ [GlobalWeightStore] cleanup() skipping stopMonitoring due to persistence lock')
            } else {
                console.log('🛑 [GlobalWeightStore] cleanup() stopping monitoring (force:', force, ')')
                await get().stopMonitoring(null, { force })
            }
        }

        // Unsubscribe from EventCoordinator
        if (eventCoordinatorUnsubscribe) {
            eventCoordinatorUnsubscribe()
            console.log('✅ [GlobalWeightStore] Unsubscribed from EventCoordinator')
        }

        // Clear all subscribers
        subscribers.clear()

        set({
            wails: null,
            eventCoordinatorId: null,
            eventCoordinatorUnsubscribe: null,
            eventHistory: [],
            lastWeightEvent: null,
            subscribers: new Map()
        })
    }
})
