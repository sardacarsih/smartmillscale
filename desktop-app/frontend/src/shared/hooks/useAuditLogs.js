/**
 * Custom hook for audit logs data
 *
 * Provides access to audit log data with pagination support
 */
import { useQuery } from '@tanstack/react-query'
import { useWailsService } from '../contexts/WailsContext'

/**
 * Hook to fetch recent audit logs
 * @param {number} limit - Maximum number of logs to retrieve
 * @param {number} offset - Number of records to skip for pagination
 * @param {Object} options - Query options
 * @returns {Object} Audit logs data and state
 */
export const useAuditLogs = (limit = 10, offset = 0, options = {}) => {
  const auditService = useWailsService('audit', { optional: true })

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['auditLogs', limit, offset],
    queryFn: async () => {
      if (!auditService) {
        throw new Error('AuditService not available')
      }

      const result = await auditService.getRecentAuditLogs(limit, offset)

      // Extract the first element of the result array (logs array) and total count
      const logs = result[0] || []
      const total = result[1] || 0

      // Transform logs to include formatted data
      const transformedLogs = logs.map(log => ({
        id: log.ID,
        title: formatActionTitle(log.Action),
        description: formatDescription(log),
        timestamp: log.Timestamp,
        username: log.Username,
        action: log.Action,
        entityType: log.EntityType,
        success: log.Success,
        ipAddress: log.IPAddress
      }))

      return {
        logs: transformedLogs,
        total
      }
    },
    enabled: !!auditService,
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  })

  return {
    logs: data?.logs || [],
    total: data?.total || 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}

/**
 * Format action string to human-readable title
 * @param {string} action - Action string from audit log
 * @returns {string} Formatted title
 */
function formatActionTitle(action) {
  const actionMap = {
    'LOGIN': 'User Login',
    'LOGOUT': 'User Logout',
    'CREATE_USER': 'User Created',
    'UPDATE_USER': 'User Updated',
    'DELETE_USER': 'User Deleted',
    'CHANGE_PASSWORD': 'Password Changed',
    'CREATE_WEIGHING': 'Weighing Created',
    'UPDATE_WEIGHING': 'Weighing Updated',
    'DELETE_WEIGHING': 'Weighing Deleted',
    'SYSTEM_HEALTH_CHECK': 'System Health Check',
    'WEIGHT_MONITORING_STARTED': 'Weight Monitoring Started',
    'WEIGHT_MONITORING_STOPPED': 'Weight Monitoring Stopped',
  }

  return actionMap[action] || action.replace(/_/g, ' ').toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format audit log into readable description
 * @param {Object} log - Audit log object
 * @returns {string} Formatted description
 */
function formatDescription(log) {
  if (log.Details) {
    return log.Details
  }

  const username = log.Username || 'Unknown user'
  const action = log.Action?.toLowerCase().replace(/_/g, ' ') || 'performed action'

  if (log.EntityType) {
    return `${username} ${action} on ${log.EntityType}`
  }

  return `${username} ${action}`
}

export default useAuditLogs
