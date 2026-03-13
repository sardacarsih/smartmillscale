import { useEffect, useState, useMemo } from 'react'
import useGlobalWeightStore from '../store/useGlobalWeightStore'

/**
 * useWeightData Hook
 *
 * Basic hook for accessing weight data with role-based filtering
 * Automatically handles permissions and provides formatted data
 *
 * @param {Object} options - Configuration options
 * @param {string} options.role - User role for permission checking
 * @param {boolean} options.autoRefresh - Auto refresh status on mount
 * @param {number} options.refreshInterval - Refresh interval in ms
 * @returns {Object} Weight data and utilities
 *
 * @example
 * const { currentWeight, isConnected, formattedWeight } = useWeightData({
 *   role: 'TIMBANGAN',
 *   autoRefresh: true
 * })
 */
const useWeightData = (options = {}) => {
  const {
    role = null,
    autoRefresh = false,
    refreshInterval = 5000
  } = options

  // Get data from global store
  const {
    currentWeight,
    isStable,
    isConnected,
    unit,
    isMonitoring,
    error,
    lastUpdate,
    statistics,
    checkPermission,
    getDataForRole,
    getFormattedWeight,
    getWeightInKg,
    isWeightReadyForCapture,
    getConnectionStatusText,
    getStatusColorClass,
    getStatusBadgeColor,
    refreshStatus
  } = useGlobalWeightStore()

  // Local state for permission check
  const [hasPermission, setHasPermission] = useState(true)
  const [permissionError, setPermissionError] = useState(null)

  // Check permissions on mount and role change
  useEffect(() => {
    if (role) {
      const canView = checkPermission(role, 'canView')
      setHasPermission(canView)

      if (!canView) {
        setPermissionError(`Role ${role} does not have permission to view weight data`)
        console.warn(`⚠️ [useWeightData] Permission denied for role: ${role}`)
      } else {
        setPermissionError(null)
      }
    }
  }, [role, checkPermission])

  // Auto refresh status
  useEffect(() => {
    if (!autoRefresh || !hasPermission) return

    // Initial refresh
    refreshStatus()

    // Set up interval
    const intervalId = setInterval(() => {
      refreshStatus()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [autoRefresh, hasPermission, refreshInterval, refreshStatus])

  // Get role-specific data
  const roleData = useMemo(() => {
    if (!role) return null
    return getDataForRole(role)
  }, [role, currentWeight, isStable, isConnected, statistics, getDataForRole])

  // Check if user can analyze
  const canAnalyze = useMemo(() => {
    return role ? checkPermission(role, 'canAnalyze') : true
  }, [role, checkPermission])

  // Check if user can control
  const canControl = useMemo(() => {
    return role ? checkPermission(role, 'canControl') : true
  }, [role, checkPermission])

  // Formatted weight display
  const formattedWeight = useMemo(() => {
    return getFormattedWeight()
  }, [currentWeight, unit, getFormattedWeight])

  // Weight in kg as number
  const weightInKg = useMemo(() => {
    return getWeightInKg()
  }, [currentWeight, getWeightInKg])

  // Connection status
  const connectionStatus = useMemo(() => {
    return getConnectionStatusText()
  }, [isConnected, isMonitoring, getConnectionStatusText])

  // Status color
  const statusColor = useMemo(() => {
    return getStatusColorClass()
  }, [isConnected, isStable, getStatusColorClass])

  // Badge color
  const badgeColor = useMemo(() => {
    return getStatusBadgeColor()
  }, [isConnected, isStable, getStatusBadgeColor])

  // Ready for capture
  const isReadyForCapture = useMemo(() => {
    return isWeightReadyForCapture()
  }, [isConnected, isStable, currentWeight, isWeightReadyForCapture])

  // Return weight data with permission check
  if (!hasPermission) {
    return {
      hasAccess: false,
      error: permissionError,
      currentWeight: 0,
      isStable: false,
      isConnected: false,
      unit: 'kg',
      isMonitoring: false,
      formattedWeight: '0.00 kg',
      weightInKg: 0,
      connectionStatus: 'No Access',
      statusColor: 'text-gray-500',
      badgeColor: 'bg-gray-500',
      isReadyForCapture: false,
      canAnalyze: false,
      canControl: false,
      statistics: null,
      lastUpdate: null
    }
  }

  return {
    // Access control
    hasAccess: true,
    canAnalyze,
    canControl,
    error: error || permissionError,

    // Core weight data
    currentWeight,
    isStable,
    isConnected,
    unit,
    isMonitoring,
    lastUpdate,

    // Formatted data
    formattedWeight,
    weightInKg,
    connectionStatus,
    statusColor,
    badgeColor,
    isReadyForCapture,

    // Analytics (if permitted)
    statistics: canAnalyze ? statistics : null,

    // Role-specific data
    roleData,

    // Utility methods
    refresh: refreshStatus
  }
}

export default useWeightData
