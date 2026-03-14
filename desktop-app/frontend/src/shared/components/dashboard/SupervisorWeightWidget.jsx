import useGlobalWeightStore from '../../store/useGlobalWeightStore'
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
    lastUpdate
  } = useGlobalWeightStore()

  // Derived state
  const hasAccess = true // Always show for supervisor dashboard
  const formattedWeight = formatWeight(currentWeight)
  const connectionStatus = isConnected ? 'Terhubung' : 'Terputus'
  const statusTextClass = isConnected ? (isStable ? 'text-green-400' : 'text-yellow-400') : 'text-red-400'

  if (!hasAccess) {
    return null
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 ${className}`}>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-gray-750 p-3 text-center">
          <p className="mb-1 text-xs text-gray-400">Koneksi</p>
          <p className={`text-sm font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
            {isConnected ? 'Online' : 'Offline'}
          </p>
        </div>
        <div className="rounded-lg bg-gray-750 p-3 text-center">
          <p className="mb-1 text-xs text-gray-400">Stabilitas</p>
          <p className={`text-sm font-semibold ${statusTextClass}`}>
            {isStable ? 'Stabil' : 'Fluktuatif'}
          </p>
        </div>
        <div className="rounded-lg bg-gray-750 p-3 text-center">
          <p className="mb-1 text-xs text-gray-400">Update</p>
          <p className="text-sm font-semibold text-white">
            {lastUpdate
              ? new Date(lastUpdate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '--:--'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SupervisorWeightWidget
