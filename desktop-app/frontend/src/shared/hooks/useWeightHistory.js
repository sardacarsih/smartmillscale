import { useMemo, useEffect, useState } from 'react'
import useGlobalWeightStore from '../store/useGlobalWeightStore'

/**
 * useWeightHistory Hook
 *
 * Provides filtered and formatted weight history data
 * Supports various filtering and sorting options
 *
 * @param {Object} options - Configuration options
 * @param {string} options.role - User role for permission checking
 * @param {number} options.limit - Maximum number of records to return
 * @param {string} options.filterType - Filter by event type (weight_change, stability_change, connection_change)
 * @param {boolean} options.stableOnly - Only include stable weight readings
 * @param {number} options.minWeight - Minimum weight filter (in grams)
 * @param {number} options.maxWeight - Maximum weight filter (in grams)
 * @param {string} options.sortOrder - Sort order ('asc' or 'desc')
 * @returns {Object} Filtered history data
 *
 * @example
 * const {
 *   history,
 *   filteredCount,
 *   hasMore
 * } = useWeightHistory({
 *   role: 'GRADING',
 *   limit: 20,
 *   stableOnly: true,
 *   sortOrder: 'desc'
 * })
 */
const useWeightHistory = (options = {}) => {
  const {
    role = null,
    limit = 50,
    filterType = null,
    stableOnly = false,
    minWeight = null,
    maxWeight = null,
    sortOrder = 'desc',
    timeRange = null
  } = options

  // Get data from store
  const {
    eventHistory,
    checkPermission
  } = useGlobalWeightStore()

  // Local state
  const [canAccess, setCanAccess] = useState(true)

  // Check view permission
  useEffect(() => {
    if (role) {
      const canView = checkPermission(role, 'canView')
      setCanAccess(canView)

      if (!canView) {
        console.warn(`⚠️ [useWeightHistory] Role ${role} does not have view permission`)
      }
    }
  }, [role, checkPermission])

  // Apply filters
  const filteredHistory = useMemo(() => {
    if (!canAccess) return []

    let filtered = [...eventHistory]

    // Filter by type
    if (filterType) {
      filtered = filtered.filter(event => event.type === filterType)
    }

    // Filter stable only
    if (stableOnly) {
      filtered = filtered.filter(event => event.stable === true)
    }

    // Filter by weight range
    if (minWeight !== null) {
      filtered = filtered.filter(event => event.weight >= minWeight)
    }

    if (maxWeight !== null) {
      filtered = filtered.filter(event => event.weight <= maxWeight)
    }

    // Filter by time range
    if (timeRange) {
      const now = new Date().getTime()
      const cutoffTime = now - timeRange

      filtered = filtered.filter(event => {
        const eventTime = new Date(event.timestamp).getTime()
        return eventTime >= cutoffTime
      })
    }

    // Sort
    if (sortOrder === 'asc') {
      filtered.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    } else {
      filtered.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    }

    return filtered
  }, [eventHistory, filterType, stableOnly, minWeight, maxWeight, timeRange, sortOrder, canAccess])

  // Apply limit
  const limitedHistory = useMemo(() => {
    return filteredHistory.slice(0, limit)
  }, [filteredHistory, limit])

  // Format history for display
  const formattedHistory = useMemo(() => {
    return limitedHistory.map(event => ({
      id: `${event.timestamp}-${event.weight}`,
      weight: event.weight,
      weightKg: (event.weight / 100).toFixed(2),
      formattedWeight: `${(event.weight / 100).toFixed(2)} ${event.unit || 'kg'}`,
      isStable: event.stable,
      isConnected: event.connected,
      type: event.type,
      timestamp: event.timestamp,
      formattedTime: new Date(event.timestamp).toLocaleString('id-ID'),
      relativeTime: getRelativeTime(event.timestamp)
    }))
  }, [limitedHistory])

  // Group by date
  const groupedByDate = useMemo(() => {
    const groups = {}

    formattedHistory.forEach(event => {
      const date = new Date(event.timestamp).toLocaleDateString('id-ID')

      if (!groups[date]) {
        groups[date] = []
      }

      groups[date].push(event)
    })

    return Object.entries(groups).map(([date, events]) => ({
      date,
      count: events.length,
      events
    }))
  }, [formattedHistory])

  // Statistics
  const statistics = useMemo(() => {
    if (formattedHistory.length === 0) {
      return {
        total: 0,
        stable: 0,
        unstable: 0,
        averageWeight: 0,
        maxWeight: 0,
        minWeight: 0
      }
    }

    const stableCount = formattedHistory.filter(e => e.isStable).length
    const weights = formattedHistory.map(e => e.weight)
    const sum = weights.reduce((acc, w) => acc + w, 0)

    return {
      total: formattedHistory.length,
      stable: stableCount,
      unstable: formattedHistory.length - stableCount,
      averageWeight: (sum / weights.length / 100).toFixed(2),
      maxWeight: (Math.max(...weights) / 100).toFixed(2),
      minWeight: (Math.min(...weights) / 100).toFixed(2)
    }
  }, [formattedHistory])

  // Pagination info
  const paginationInfo = useMemo(() => {
    return {
      showing: limitedHistory.length,
      total: filteredHistory.length,
      hasMore: filteredHistory.length > limit
    }
  }, [limitedHistory, filteredHistory, limit])

  // If no access
  if (!canAccess) {
    return {
      hasAccess: false,
      error: 'No permission to view history',
      history: [],
      formattedHistory: [],
      groupedByDate: [],
      statistics: null,
      filteredCount: 0,
      totalCount: 0,
      hasMore: false,
      paginationInfo: null
    }
  }

  return {
    hasAccess: true,
    error: null,

    // Raw history
    history: limitedHistory,

    // Formatted history
    formattedHistory,

    // Grouped history
    groupedByDate,

    // Statistics
    statistics,

    // Counts
    filteredCount: filteredHistory.length,
    totalCount: eventHistory.length,
    hasMore: paginationInfo.hasMore,

    // Pagination
    paginationInfo,

    // Active filters
    activeFilters: {
      filterType,
      stableOnly,
      minWeight,
      maxWeight,
      timeRange,
      sortOrder,
      limit
    }
  }
}

// Helper function to get relative time
function getRelativeTime(timestamp) {
  const now = new Date().getTime()
  const time = new Date(timestamp).getTime()
  const diff = now - time

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} hari yang lalu`
  if (hours > 0) return `${hours} jam yang lalu`
  if (minutes > 0) return `${minutes} menit yang lalu`
  if (seconds > 0) return `${seconds} detik yang lalu`
  return 'Baru saja'
}

export default useWeightHistory
