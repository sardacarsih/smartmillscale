import useGlobalWeightStore from '../../store/useGlobalWeightStore'
import { useWeightHistory } from '../../hooks'
import { formatWeight } from '../../utils/formatters'

/**
 * GradingWeightWidget
 *
 * Read-only weight display untuk GRADING dashboard
 * Fokus pada informasi weight saat ini dan history untuk keperluan grading
 *
 * Note: Weight monitoring is managed globally by App.jsx
 * This component only subscribes to the global state
 */
const GradingWeightWidget = ({ wails, className = '' }) => {
  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    currentWeight,
    isStable,
    isConnected,
    lastUpdate,
  } = useGlobalWeightStore()

  // Derived state
  const hasAccess = true // Always show for grading dashboard
  const formattedWeight = formatWeight(currentWeight)

  const {
    hasAccess: hasHistoryAccess,
    formattedHistory,
    statistics
  } = useWeightHistory({
    role: 'GRADING',
    stableOnly: true,
    limit: 5,
    sortOrder: 'desc'
  })

  if (!hasAccess) {
    return null
  }

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <span className="text-xl">⚖️</span>
          Informasi Timbangan
          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded-full ml-2">
            Read-only
          </span>
        </h3>
      </div>

      {/* Current Weight - Read Only Display */}
      <div className="mb-4">
        <div className={`rounded-lg p-6 text-center border-2 ${isConnected ? 'bg-gray-750 border-gray-600' : 'bg-gray-900 border-red-500/30'
          }`}>
          <p className="text-xs text-gray-400 mb-2">Berat Saat Ini</p>
          {isConnected ? (
            <>
              <p className="text-5xl font-bold font-mono text-white mb-2">
                {formattedWeight}
              </p>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isStable ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                <p className={`text-sm ${isStable ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                  {isStable ? 'Stabil' : 'Tidak Stabil'}
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-5xl font-bold font-mono text-red-400 mb-2">
                ---.-
              </p>
              <p className="text-sm text-red-400">Tidak Terhubung</p>
            </>
          )}
        </div>
      </div>

      {/* Statistics Summary - Read Only */}
      {hasHistoryAccess && statistics && statistics.total > 0 && (
        <div className="mb-4 bg-gray-750 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-3">Statistik Hari Ini</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-lg font-bold text-white">{statistics.total}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Rata-rata</p>
              <p className="text-lg font-bold text-blue-400">{statistics.averageWeight} kg</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Maks</p>
              <p className="text-lg font-bold text-green-400">{statistics.maxWeight} kg</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Stable Weights - Read Only */}
      {hasHistoryAccess && formattedHistory && formattedHistory.length > 0 && (
        <div className="bg-gray-750 rounded-lg p-4">
          <p className="text-xs text-gray-400 mb-3">Berat Stabil Terakhir</p>
          <div className="space-y-2">
            {formattedHistory.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-gray-800 rounded px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <span className="text-sm font-medium text-white">
                    {item.formattedWeight}
                  </span>
                  <span className="text-xs text-green-400">✓</span>
                </div>
                <span className="text-xs text-gray-400">
                  {item.relativeTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Footer */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            <span className="text-gray-400">
              {isConnected ? 'Terhubung' : 'Terputus'}
            </span>
          </div>
          {lastUpdate && (
            <span className="text-gray-500">
              Update: {new Date(lastUpdate).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>
      </div>

      {/* Read-only Notice */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-400 text-center flex items-center justify-center gap-2">
          <span>ℹ️</span>
          <span>Mode read-only. Anda dapat melihat data tapi tidak dapat mengontrol timbangan.</span>
        </p>
      </div>
    </div>
  )
}

export default GradingWeightWidget
