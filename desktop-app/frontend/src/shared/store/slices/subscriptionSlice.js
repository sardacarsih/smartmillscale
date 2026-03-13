import { getCurrentTimestamp } from '../storeUtils'

export const createSubscriptionSlice = (set, get) => ({
    // ============================================
    // SUBSCRIPTION MANAGEMENT
    // ============================================
    subscribers: new Map(),

    // ============================================
    // ACTIONS - SUBSCRIPTION MANAGEMENT
    // ============================================

    subscribe: (componentId, callback, options = {}) => {
        const { subscribers } = get()

        console.log(`📢 [GlobalWeightStore] Component ${componentId} subscribing`)

        subscribers.set(componentId, {
            callback,
            role: options.role || null,
            filter: options.filter || null,
            subscribedAt: getCurrentTimestamp()
        })

        set({ subscribers: new Map(subscribers) })

        // Return unsubscribe function
        return () => get().unsubscribe(componentId)
    },

    unsubscribe: (componentId) => {
        const { subscribers } = get()

        console.log(`📢 [GlobalWeightStore] Component ${componentId} unsubscribing`)

        subscribers.delete(componentId)
        set({ subscribers: new Map(subscribers) })
    },

    notifySubscribers: (eventType, data = null) => {
        const { subscribers } = get()

        subscribers.forEach((subscription, componentId) => {
            try {
                // Check role permission if specified
                if (subscription.role) {
                    const canView = get().checkPermission(subscription.role, 'canView')
                    if (!canView) return
                }

                // Apply filter if specified
                if (subscription.filter && !subscription.filter(eventType, data)) {
                    return
                }

                // Call subscriber callback
                subscription.callback(eventType, data)
            } catch (error) {
                console.error(`❌ [GlobalWeightStore] Error notifying ${componentId}:`, error)
            }
        })
    }
})
