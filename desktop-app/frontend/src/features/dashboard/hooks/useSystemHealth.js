/**
 * Custom hook for system health monitoring
 * 
 * REFACTORED: Now uses DashboardService from WailsContext
 */
import { useQuery } from '@tanstack/react-query'
import { useWailsService } from '../../../shared/contexts/WailsContext'

/**
 * Hook to fetch system health data
 * @param {Object} options - Query options
 * @returns {Object} System health data and state
 */
export const useSystemHealth = (options = {}) => {
  const dashboardService = useWailsService('dashboard')

  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      if (!dashboardService) {
        throw new Error('DashboardService not available')
      }

      const healthData = await dashboardService.getSystemHealth()
      return healthData
    },
    enabled: !!dashboardService,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options.autoRefresh ? 10000 : false, // Auto-refresh every 10s if enabled
    ...options,
  })

  return {
    health,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Hook to fetch specific service health
 * @param {string} serviceName - Name of the service to check
 * @param {Object} options - Query options
 * @returns {Object} Service health data and state
 */
export const useServiceHealth = (serviceName, options = {}) => {
  const dashboardService = useWailsService('dashboard')

  const {
    data: health,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['service', 'health', serviceName],
    queryFn: async () => {
      if (!dashboardService) {
        throw new Error('DashboardService not available')
      }

      const healthData = await dashboardService.getServiceHealth(serviceName)
      return healthData
    },
    enabled: !!dashboardService && !!serviceName,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options.autoRefresh ? 10000 : false,
    ...options,
  })

  return {
    health,
    isLoading,
    isError,
    error,
    refetch,
  }
}

export default useSystemHealth
