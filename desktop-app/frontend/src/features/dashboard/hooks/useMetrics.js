/**
 * Custom hook for metrics data
 * 
 * REFACTORED: Now uses DashboardService from WailsContext
 */
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../auth'
import { useWailsService } from '../../../shared/contexts/WailsContext'

/**
 * Hook to fetch metrics data
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Metrics data and state
 */
export const useMetrics = (userId, options = {}) => {
  const { user } = useAuthStore()
  const dashboardService = useWailsService('dashboard')

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['metrics', userId, user?.role],
    queryFn: async () => {
      if (!dashboardService) {
        // Return mock metrics when service is not available
        return {
          totalWeighings: 156,
          todayWeighings: 23,
          averageWeight: 4250,
          systemUptime: '2d 14h 32m',
          storageUsed: '2.3 GB',
          lastSync: '5 minutes ago'
        }
      }

      try {
        const metricsData = await dashboardService.getMetricsData(userId, user?.role || '')
        return metricsData
      } catch (error) {
        console.warn('Failed to fetch metrics data, using mock:', error)
        // Return mock data on error
        return {
          totalWeighings: 156,
          todayWeighings: 23,
          averageWeight: 4250,
          systemUptime: '2d 14h 32m',
          storageUsed: '2.3 GB',
          lastSync: '5 minutes ago'
        }
      }
    },
    enabled: !!userId && !!user?.role && !!dashboardService,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: options.autoRefresh ? 30000 : false, // Auto-refresh every 30s if enabled
    ...options,
  })

  return {
    metrics,
    isLoading,
    isError,
    error,
    refetch,
  }
}


/**
 * Hook to fetch sync metrics
 * @param {Object} options - Query options
 * @returns {Object} Sync metrics data and state
 */
export const useSyncMetrics = (options = {}) => {
  const dashboardService = useWailsService('dashboard')

  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['metrics', 'sync'],
    queryFn: async () => {
      if (!dashboardService) {
        throw new Error('DashboardService not available')
      }

      const syncData = await dashboardService.getSyncMetrics()
      return syncData.metrics
    },
    enabled: !!dashboardService,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options.autoRefresh ? 10000 : false, // Auto-refresh every 10s if enabled
    ...options,
  })

  return {
    metrics,
    isLoading,
    isError,
    error,
    refetch,
  }
}

export default useMetrics
