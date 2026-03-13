import React from 'react'
import useGlobalWeightStore from '../../store/useGlobalWeightStore'
import { WeightDisplay } from '../weight'
import { formatWeight } from '../../utils/formatters'

/**
 * SupervisorWeightWidget
 *
 * Weight monitoring widget untuk SUPERVISOR dashboard
 * Fokus pada monitoring dan analytics untuk pengawasan operasional
 *
 * Note: Weight monitoring is managed globally by App.jsx
 * This component only subscribes to the global state
 */
const SupervisorWeightWidget = ({ wails, className = '' }) => {
  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    currentWeight,
    isConnected,
    isStable,
    isMonitoring,
    lastUpdate,
    unit
  } = useGlobalWeightStore()

  // Derived state
  const hasAccess = true // Always show for supervisor dashboard
  const formattedWeight = formatWeight(currentWeight)
  const connectionStatus = isConnected ? 'Terhubung' : 'Terputus'
  const statusColor = isConnected ? (isStable ? 'green' : 'yellow') : 'red'

  if (!hasAccess) {
    return null
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          Monitoring Timbangan
        </h3>
        <div className={`px-2 py-1 rounded text-xs font-medium ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
          {connectionStatus}
        </div>
      </div>

      {/* Current Weight - Compact */}
      <div className="mb-4">
        <div className="bg-gray-750 rounded-lg p-4 text-center">
          <p className="text-xs text-gray-400 mb-1">Berat Saat Ini</p>
          <p className={`text-4xl font-bold font-mono ${isStable ? 'text-green-400' : 'text-yellow-400'
            }`}>
            {formattedWeight}
          </p>
          <p className={`text-xs mt-1 ${isStable ? 'text-green-400' : 'text-yellow-400'}`}>
            {isStable ? '✓ Stabil' : '⚠ Tidak Stabil'}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      {hasAnalyticsAccess && statistics && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-lg font-bold text-white">
              {statistics.totalWeighings || 0}
            </p>
          </div>
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Avg</p>
            <p className="text-lg font-bold text-blue-400">
              {statistics.averageWeight ? (statistics.averageWeight / 100).toFixed(0) : '0'}
            </p>
          </div>
          <div className="bg-gray-750 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">Max</p>
            <p className="text-lg font-bold text-green-400">
              {statistics.maxWeight ? (statistics.maxWeight / 100).toFixed(0) : '0'}
            </p>
          </div>
        </div>
      )}

      {/* Period Stats (Last Hour) */}
      {hasAnalyticsAccess && periodStatistics && periodStatistics.count > 0 && (
        <div className="bg-gray-750 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">1 Jam Terakhir</p>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Count</p>
              <p className="text-sm font-medium text-white">{periodStatistics.count}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg</p>
              <p className="text-sm font-medium text-white">{periodStatistics.average} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Max</p>
              <p className="text-sm font-medium text-white">{periodStatistics.max} kg</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Min</p>
              <p className="text-sm font-medium text-white">{periodStatistics.min} kg</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Weighings */}
      {hasAnalyticsAccess && recentWeighings && recentWeighings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Recent Weighings</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentWeighings.slice(0, 5).map((weighing, index) => (
              <div
                key={index}
                className="flex justify-between text-xs bg-gray-750 rounded px-2 py-1"
              >
                <span className="text-white font-medium">{weighing.weight} kg</span>
                <span className="text-gray-400">
                  {new Date(weighing.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SupervisorWeightWidget
