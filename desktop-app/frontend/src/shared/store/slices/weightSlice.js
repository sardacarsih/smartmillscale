import { getCurrentTimestamp } from '../storeUtils'

export const createWeightSlice = (set, get) => ({
    // ============================================
    // CORE WEIGHT STATE
    // ============================================
    currentWeight: 0,
    isStable: false,
    unit: 'kg',

    // ============================================
    // EVENTS AND HISTORY
    // ============================================
    lastWeightEvent: null,
    eventHistory: [],
    maxEventHistory: 100, // Increased for dashboard analytics
    lastStableWeight: '',

    // ============================================
    // ACTIONS - EVENT HANDLING
    // ============================================

    handleWeightEvent: (data) => {
        try {
            console.log('📡 [GlobalWeightStore] Received weight data from EventCoordinator:', data)

            if (!data) {
                console.warn('⚠️ [GlobalWeightStore] Invalid weight data format:', data)
                return
            }

            const { weight, stable, unit, connected, type, timestamp } = data
            const wasConnected = get().isConnected
            const weightChanged = get().currentWeight !== weight
            const stabilityChanged = get().isStable !== stable

            console.log('✅ [GlobalWeightStore] Processing data - Weight:', weight, unit || 'kg', '| Stable:', stable, '| Connected:', connected)

            set({
                currentWeight: weight || 0,
                isStable: stable || false,
                unit: unit || 'kg',
                isConnected: connected !== undefined ? connected : true,
                lastUpdate: getCurrentTimestamp(),
                error: null
            })

            console.log('🔄 [GlobalWeightStore] State updated - Current Weight:', weight, unit || 'kg')

            // Record stable weight timestamp
            if (stable && weightChanged) {
                set({ lastStableWeight: getCurrentTimestamp() })
            }

            // Update statistics
            if (weight > 0) {
                get().updateStatistics(weight)
            }

            // Add to event history
            get().addWeightEvent({
                type: type || 'weight_change',
                weight: weight || 0,
                stable: stable || false,
                unit: unit || 'kg',
                connected: connected !== undefined ? connected : true,
                timestamp: timestamp || getCurrentTimestamp()
            })

            // Notify subscribers
            get().notifySubscribers('weight_updated', {
                weight,
                stable,
                connected: connected !== undefined ? connected : true,
                type
            })

            console.log('✅ [GlobalWeightStore] Weight event processed:', {
                type,
                weight,
                stable,
                connected
            })

        } catch (error) {
            console.error('❌ [GlobalWeightStore] Failed to handle weight event:', error)
            set({
                error: error.message || 'Failed to process weight event',
                lastUpdate: getCurrentTimestamp()
            })
        }
    },

    addWeightEvent: (event) => {
        const { eventHistory, maxEventHistory } = get()
        const newHistory = [event, ...eventHistory].slice(0, maxEventHistory)
        set({
            eventHistory: newHistory,
            lastUpdate: getCurrentTimestamp()
        })
    },

    clearEventHistory: () => {
        set({
            eventHistory: [],
            lastWeightEvent: null,
            lastUpdate: getCurrentTimestamp()
        })
    },

    // ============================================
    // UTILITY METHODS
    // ============================================

    getFormattedWeight: () => {
        const { currentWeight, unit } = get()
        if (currentWeight === 0) return '0.00 ' + unit

        // Format with Indonesian thousands separator and proper decimal
        // For 120000 (stored as 1200.00 kg): displays as "1.200,00 kg"
        return (currentWeight / 100).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }) + ' ' + unit
    },

    getFormattedWeightNoUnit: () => {
        const { currentWeight } = get()
        if (currentWeight === 0) return '0.00'

        // Format with Indonesian thousands separator, no unit
        return (currentWeight / 100).toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
    },

    getFormattedWeightInteger: () => {
        const { currentWeight, unit } = get()
        if (currentWeight === 0) return '0 ' + unit

        // For 120000 (1200 kg): displays as "1.200 kg"
        return Math.round(currentWeight / 100).toLocaleString('id-ID') + ' ' + unit
    },

    getWeightInKg: () => {
        const { currentWeight } = get()
        return currentWeight / 100
    },

    isWeightReadyForCapture: () => {
        const { isConnected, isStable, currentWeight } = get()
        return isConnected && isStable && currentWeight > 0
    }
})
