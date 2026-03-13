import React from 'react'
import { useWeightData } from '../../hooks'
import WeightDisplay from './WeightDisplay'
import ConnectionStatus from './ConnectionStatus'

/**
 * WeightStatusPanel Component
 *
 * Comprehensive panel showing weight, connection status, and statistics
 * Combines multiple weight components into a unified dashboard widget
 *
 * @param {Object} props - Component props
 * @param {string} props.role - User role for permission checking
 * @param {boolean} props.showAnalytics - Show analytics section
 * @param {boolean} props.showConnection - Show connection status
 * @param {string} props.size - Overall size ('small', 'medium', 'large')
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onWeightClick - Click handler for weight display
 *
 * @example
 * <WeightStatusPanel
 *   role="SUPERVISOR"
 *   showAnalytics={true}
 *   showConnection={true}
 *   size="medium"
 * />
 */
const WeightStatusPanel = ({
  role = null,
  showAnalytics = true,
  showConnection = true,
  size = 'medium',
  className = '',
  onWeightClick = null
}) => {
  const {
    hasAccess,
    canAnalyze,
    isConnected,
    isMonitoring,
    lastUpdate,
    error
  } = useWeightData({ role })

  // If no access
  if (!hasAccess) {
    return (
      <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <p className="text-lg font-semibold">No Access</p>
          <p className="text-sm mt-2">You don't have permission to view weight data</p>
        </div>
      </div>
    )
  }

  // Size configurations
  const sizes = {
    small: {
      panel: 'p-4',
      title: 'text-base',
      weightSize: 'medium'
    },
    medium: {
      panel: 'p-6',
      title: 'text-lg',
      weightSize: 'large'
    },
    large: {
      panel: 'p-8',
      title: 'text-xl',
      weightSize: 'xl'
    }
  }

  const sizeConfig = sizes[size] || sizes.medium

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 ${sizeConfig.panel} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`font-semibold text-white ${sizeConfig.title} flex items-center gap-2`}>
          <span className="text-2xl">⚖️</span>
          <span>Berat Timbangan</span>
        </h2>
        {isMonitoring && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            Real-time Active
          </span>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Display */}
        <div>
          <WeightDisplay
            role={role}
            size={sizeConfig.weightSize}
            showUnit={true}
            showStatus={true}
            onClick={onWeightClick}
            className="w-full"
          />

          {/* Last Update */}
          {lastUpdate && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Terakhir update: {new Date(lastUpdate).toLocaleString('id-ID')}
            </p>
          )}
        </div>

        {/* Connection Status */}
        {showConnection && (
          <div>
            <ConnectionStatus
              role={role}
              variant="detailed"
              showMonitoringState={true}
              className="h-full"
            />
          </div>
        )}
      </div>

      {/* Analytics Section */}
      {showAnalytics && canAnalyze && false && ( // Disabled until useWeightAnalytics is implemented
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Statistik</h3>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Weighings */}
            <div className="bg-gray-750 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Total Timbangan</p>
              <p className="text-xl font-bold text-white">
                {statistics.totalWeighings || 0}
              </p>
            </div>

            {/* Average Weight */}
            <div className="bg-gray-750 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Rata-rata</p>
              <p className="text-xl font-bold text-blue-400">
                {statistics.averageWeight ? (statistics.averageWeight / 100).toFixed(1) : '0.0'} kg
              </p>
            </div>

            {/* Max Weight */}
            <div className="bg-gray-750 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Maksimum</p>
              <p className="text-xl font-bold text-green-400">
                {statistics.maxWeight ? (statistics.maxWeight / 100).toFixed(1) : '0.0'} kg
              </p>
            </div>

            {/* Min Weight */}
            <div className="bg-gray-750 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Minimum</p>
              <p className="text-xl font-bold text-yellow-400">
                {statistics.minWeight ? (statistics.minWeight / 100).toFixed(1) : '0.0'} kg
              </p>
            </div>
          </div>

          {/* Period Statistics (Last Hour) */}
          {periodStatistics && periodStatistics.count > 0 && (
            <div className="mt-4 bg-gray-750 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Statistik 1 Jam Terakhir</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-gray-500">Count</p>
                  <p className="text-sm font-medium text-white">{periodStatistics.count}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Avg</p>
                  <p className="text-sm font-medium text-white">{periodStatistics.average} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Range</p>
                  <p className="text-sm font-medium text-white">{periodStatistics.range} kg</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default WeightStatusPanel
