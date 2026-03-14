import useGlobalWeightStore from '../../store/useGlobalWeightStore'
import { WeightDisplay, ConnectionStatus } from '../weight'

/**
 * AdminWeightWidget
 *
 * Comprehensive weight monitoring widget untuk ADMIN dashboard
 * Menampilkan real-time weight, connection status, dan analytics lengkap
 *
 * Note: Weight monitoring is managed globally by App.jsx
 * This component only subscribes to the global state
 */
const AdminWeightWidget = ({ wails, className = '' }) => {
  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    currentWeight,
    isConnected,
    isStable,
    isMonitoring,
    error,
    lastUpdate
  } = useGlobalWeightStore()

  // Derived state
  const hasAccess = true // Always show for admin dashboard
  const statusTextClass = isConnected ? (isStable ? 'text-green-400' : 'text-yellow-400') : 'text-red-400'
  const statistics = {} // TODO: Implement statistics
  const hasAnalyticsAccess = true
  const trend = null
  const monitoringDuration = null
  const connectionStability = null

  if (!hasAccess) {
    return null
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          Weight Monitoring System
        </h2>
        {isMonitoring && (
          <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
            ● LIVE
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Weight Display */}
        <div className="lg:col-span-2">
          <WeightDisplay
            role="ADMIN"
            size="large"
            showUnit={true}
            showStatus={true}
            className="w-full h-full"
          />
        </div>

        {/* Connection Status */}
        <div>
          <ConnectionStatus
            role="ADMIN"
            variant="detailed"
            showMonitoringState={true}
            className="h-full"
          />
        </div>
      </div>

      {/* Analytics Section */}
      {hasAnalyticsAccess && statistics && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Total Weighings */}
            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📊</span>
                <span className="text-xs text-gray-400">Total Timbangan</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {statistics.totalWeighings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>

            {/* Average Weight */}
            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📈</span>
                <span className="text-xs text-gray-400">Rata-rata</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {statistics.averageWeight ? (statistics.averageWeight / 100).toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">kg</p>
            </div>

            {/* Max Weight */}
            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⬆️</span>
                <span className="text-xs text-gray-400">Maksimum</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {statistics.maxWeight ? (statistics.maxWeight / 100).toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">kg</p>
            </div>

            {/* Min Weight */}
            <div className="bg-gray-750 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⬇️</span>
                <span className="text-xs text-gray-400">Minimum</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">
                {statistics.minWeight ? (statistics.minWeight / 100).toFixed(1) : '0.0'}
              </p>
              <p className="text-xs text-gray-500 mt-1">kg</p>
            </div>
          </div>

          {/* Trend & System Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Trend Analysis */}
            {trend && (
              <div className="bg-gray-750 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                  <span>📊</span> Trend (1 Jam Terakhir)
                </h3>
                <div className="flex items-center gap-3">
                  <div className={`text-3xl ${trend.isIncreasing ? 'text-green-400' :
                    trend.isDecreasing ? 'text-red-400' : 'text-gray-400'
                    }`}>
                    {trend.isIncreasing ? '↗️' : trend.isDecreasing ? '↘️' : '➡️'}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white capitalize">
                      {trend.direction}
                    </p>
                    <p className="text-sm text-gray-400">
                      {trend.percentage}% change
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* System Uptime */}
            <div className="bg-gray-750 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                <span>⏱️</span> System Status
              </h3>
              <div className="space-y-2">
                {monitoringDuration && monitoringDuration.totalSeconds > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Uptime</span>
                    <span className="text-white font-medium">
                      {monitoringDuration.formatted}
                    </span>
                  </div>
                )}
                {connectionStability && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Connection</span>
                    <span className={`font-medium ${connectionStability.isStable ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                      {connectionStability.uptime}% uptime
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-medium ${statusTextClass}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {lastUpdate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Last Update</span>
                    <span className="font-medium text-white">
                      {new Date(lastUpdate).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
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

export default AdminWeightWidget
