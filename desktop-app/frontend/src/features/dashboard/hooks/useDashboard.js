/**
 * Custom hook for dashboard data and operations
 * 
 * REFACTORED: Now uses DashboardService from WailsContext
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuthStore } from '../../auth'
import { useNotificationStore } from '../../../shared'
import { useWailsService } from '../../../shared/contexts/WailsContext'

/**
 * Hook to manage dashboard data and operations
 * @param {string} userId - User ID
 * @returns {Object} Dashboard data and operations
 */
export const useDashboard = (userId) => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { showSuccess, showError } = useNotificationStore()
  const dashboardService = useWailsService('dashboard')

  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', userId],
    queryFn: async () => {
      if (!dashboardService) {
        throw new Error('DashboardService not available')
      }

      const dashboardData = await dashboardService.getDashboardData(userId)
      return dashboardData
    },
    enabled: !!userId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2, // Retry failed requests twice
    onError: (err) => {
      console.error('Failed to fetch dashboard data:', err)
      showError(`Gagal memuat data dashboard: ${err.message}`)
    }
  })

  // Update dashboard mutation
  const updateDashboardMutation = useMutation({
    mutationFn: async ({ dashboardId, updates }) => {
      if (!dashboardService) {
        throw new Error('DashboardService not available')
      }

      // Note: UpdateDashboardData not in service yet, using direct call
      const updatesJSON = JSON.stringify(updates)
      const result = await dashboardService.wails.UpdateDashboardData(dashboardId, updatesJSON)
      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Dashboard berhasil diperbarui')
    },
    onError: (error) => {
      showError(`Gagal memperbarui dashboard: ${error.message}`)
    },
  })

  // Add widget mutation
  const addWidgetMutation = useMutation({
    mutationFn: async (widget) => {
      if (!wails) {
        throw new Error('Wails bindings not available')
      }

      const widgetJSON = JSON.stringify(widget)
      const result = await wails.AddDashboardWidget(userId, widgetJSON)
      if (!result) {
        throw new Error('Failed to add widget')
      }

      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Widget berhasil ditambahkan')
    },
    onError: (error) => {
      showError(`Gagal menambahkan widget: ${error.message}`)
    },
  })

  // Update widget mutation
  const updateWidgetMutation = useMutation({
    mutationFn: async (widget) => {
      if (!wails) {
        throw new Error('Wails bindings not available')
      }

      const widgetJSON = JSON.stringify(widget)
      const result = await wails.UpdateDashboardWidget(userId, widget.id, widgetJSON)
      if (!result) {
        throw new Error('Failed to update widget')
      }

      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Widget berhasil diperbarui')
    },
    onError: (error) => {
      showError(`Gagal memperbarui widget: ${error.message}`)
    },
  })

  // Remove widget mutation
  const removeWidgetMutation = useMutation({
    mutationFn: async (widgetId) => {
      if (!wails) {
        throw new Error('Wails bindings not available')
      }

      const result = await wails.RemoveDashboardWidget(userId, widgetId)
      if (!result) {
        throw new Error('Failed to remove widget')
      }

      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Widget berhasil dihapus')
    },
    onError: (error) => {
      showError(`Gagal menghapus widget: ${error.message}`)
    },
  })

  // Update layout mutation
  const updateLayoutMutation = useMutation({
    mutationFn: async (layout) => {
      if (!wails) {
        throw new Error('Wails bindings not available')
      }

      const layoutJSON = JSON.stringify(layout)
      const result = await wails.UpdateDashboardLayout(userId, layoutJSON)
      if (!result) {
        throw new Error('Failed to update layout')
      }

      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Layout berhasil diperbarui')
    },
    onError: (error) => {
      showError(`Gagal memperbarui layout: ${error.message}`)
    },
  })

  // Refresh dashboard mutation
  const refreshDashboardMutation = useMutation({
    mutationFn: async () => {
      if (!wails) {
        throw new Error('Wails bindings not available')
      }

      const result = await wails.RefreshDashboard(userId)
      if (!result) {
        throw new Error('Failed to refresh dashboard')
      }

      return JSON.parse(result)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['dashboard', userId])
      showSuccess('Dashboard berhasil di-refresh')
    },
    onError: (error) => {
      showError(`Gagal me-refresh dashboard: ${error.message}`)
    },
  })

  // Memoized operations
  const updateDashboard = useCallback(
    (dashboardId, updates) => updateDashboardMutation.mutate({ dashboardId, updates }),
    [updateDashboardMutation]
  )

  const addWidget = useCallback(
    (widget) => addWidgetMutation.mutate(widget),
    [addWidgetMutation]
  )

  const updateWidget = useCallback(
    (widget) => updateWidgetMutation.mutate(widget),
    [updateWidgetMutation]
  )

  const removeWidget = useCallback(
    (widgetId) => removeWidgetMutation.mutate(widgetId),
    [removeWidgetMutation]
  )

  const updateLayout = useCallback(
    (layout) => updateLayoutMutation.mutate(layout),
    [updateLayoutMutation]
  )

  const refreshDashboard = useCallback(
    () => refreshDashboardMutation.mutate(),
    [refreshDashboardMutation]
  )

  return {
    // Data
    dashboard,
    isLoading,
    isError,
    error,

    // Operations
    updateDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    updateLayout,
    refreshDashboard,
    refetch,

    // Loading states
    isUpdating: updateDashboardMutation.isLoading,
    isAddingWidget: addWidgetMutation.isLoading,
    isUpdatingWidget: updateWidgetMutation.isLoading,
    isRemovingWidget: removeWidgetMutation.isLoading,
    isUpdatingLayout: updateLayoutMutation.isLoading,
    isRefreshing: refreshDashboardMutation.isLoading,
  }
}

export default useDashboard
