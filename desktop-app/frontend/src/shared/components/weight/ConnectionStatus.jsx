import React from 'react'
import { useWeightData } from '../../hooks'

/**
 * ConnectionStatus Component
 *
 * Displays connection status with visual indicators
 * Shows monitoring status, connection state, and error messages
 *
 * @param {Object} props - Component props
 * @param {string} props.role - User role for permission checking
 * @param {string} props.variant - Display variant ('compact', 'detailed', 'badge')
 * @param {boolean} props.showMonitoringState - Show monitoring state
 * @param {string} props.className - Additional CSS classes
 *
 * @example
 * <ConnectionStatus role="ADMIN" variant="detailed" showMonitoringState={true} />
 */
const ConnectionStatus = ({
  role = null,
  variant = 'compact',
  showMonitoringState = true,
  className = ''
}) => {
  const {
    hasAccess,
    isConnected,
    isMonitoring,
    connectionStatus,
    statusColor,
    badgeColor,
    error
  } = useWeightData({ role })

  // Badge variant
  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${badgeColor} ${className}`}>
        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span className="text-white text-xs font-medium">{connectionStatus}</span>
      </div>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <span className={`text-sm ${statusColor}`}>
          {connectionStatus}
        </span>
      </div>
    )
  }

  // Detailed variant
  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Status Koneksi</h3>
        {!hasAccess && (
          <span className="text-xs text-red-400">No Access</span>
        )}
      </div>

      {/* Connection status */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-4 h-4 rounded-full ${
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`} />
        <div>
          <p className={`text-base font-medium ${statusColor}`}>
            {connectionStatus}
          </p>
          {isConnected && (
            <p className="text-xs text-gray-400">Timbangan terhubung</p>
          )}
        </div>
      </div>

      {/* Monitoring state */}
      {showMonitoringState && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Monitoring</span>
            <span className={`text-xs font-medium ${
              isMonitoring ? 'text-green-400' : 'text-gray-500'
            }`}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
