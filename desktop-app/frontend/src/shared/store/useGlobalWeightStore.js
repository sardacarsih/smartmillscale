import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createWeightSlice } from './slices/weightSlice'
import { createMonitoringSlice } from './slices/monitoringSlice'
import { createStatisticsSlice } from './slices/statisticsSlice'
import { createPermissionSlice } from './slices/permissionSlice'
import { createSubscriptionSlice } from './slices/subscriptionSlice'

/**
 * Global Weight Monitoring Store
 * Provides centralized weight data management for all components and dashboards
 * Supports role-based access control and subscription management
 * 
 * Refactored into slices for better maintainability
 */
const useGlobalWeightStore = create(
  subscribeWithSelector((set, get) => ({
    ...createWeightSlice(set, get),
    ...createMonitoringSlice(set, get),
    ...createStatisticsSlice(set, get),
    ...createPermissionSlice(set, get),
    ...createSubscriptionSlice(set, get)
  }))
)

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Global weight store reloaded')
  })
}

export default useGlobalWeightStore


