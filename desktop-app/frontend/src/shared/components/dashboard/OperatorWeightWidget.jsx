import useGlobalWeightStore from '../../store/useGlobalWeightStore'
import { formatWeight } from '../../utils/formatters'

/**
 * OperatorWeightWidget
 *
 * Large, easy-to-read weight display untuk TIMBANGAN dashboard
 * Fokus pada operasional dengan display yang jelas dan real-time
 *
 * Note: Weight monitoring is managed globally by App.jsx
 * This component only subscribes to the global state
 */
const OperatorWeightWidget = ({ wails, className = '' }) => {
  // Subscribe to global weight monitoring state (managed by App.jsx)
  const {
    currentWeight,
    isStable,
    isConnected,
    isMonitoring,
    lastUpdate
  } = useGlobalWeightStore()

  // Derived state
  const hasAccess = true // Always show for operator dashboard
  const connectionStatus = isConnected ? 'Terhubung' : 'Terputus'
  const isReadyForCapture = isStable && isConnected

  if (!hasAccess) {
    return null
  }

  return (
    <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border-2 ${isConnected ?
      (isStable ? 'border-green-500' : 'border-yellow-500') :
      'border-red-500'
      } p-4 sm:p-6 xl:p-8 ${className}`}>
      {/* Status Badge */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
          <span className={`text-lg font-semibold ${isConnected ? 'text-green-400' : 'text-red-400'
            }`}>
            {connectionStatus}
          </span>
        </div>
        {isMonitoring && (
          <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full font-medium">
            ● LIVE
          </span>
        )}
      </div>

      {/* Main Weight Display - Extra Large */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-400 mb-2">BERAT TIMBANGAN</p>
        <div className={`mb-2 font-mono text-5xl font-bold sm:text-6xl xl:text-7xl 2xl:text-8xl ${isConnected ? (isStable ? 'text-green-400' : 'text-yellow-400') : 'text-red-400'
          }`}>
          {isConnected ? formatWeight(currentWeight, 'kg', true).replace(' kg', '') : '---.-'}
        </div>
        <p className="text-lg font-medium text-gray-300 sm:text-xl xl:text-2xl">KILOGRAM</p>
      </div>

      {/* Status Indicators */}
      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Stability Status */}
        <div className={`rounded-lg p-4 text-center ${isStable ? 'bg-green-500/20' : 'bg-yellow-500/20'
          }`}>
          <p className="text-xs text-gray-400 mb-1">Status Berat</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{isStable ? '✓' : '⚠'}</span>
            <span className={`text-lg font-bold ${isStable ? 'text-green-400' : 'text-yellow-400'
              }`}>
              {isStable ? 'STABIL' : 'TIDAK STABIL'}
            </span>
          </div>
        </div>

        {/* Ready for Capture */}
        <div className={`rounded-lg p-4 text-center ${isReadyForCapture ? 'bg-blue-500/20' : 'bg-gray-700'
          }`}>
          <p className="text-xs text-gray-400 mb-1">Siap Capture</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{isReadyForCapture ? '✓' : '✗'}</span>
            <span className={`text-lg font-bold ${isReadyForCapture ? 'text-blue-400' : 'text-gray-500'
              }`}>
              {isReadyForCapture ? 'SIAP' : 'TUNGGU'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions / Info */}
        <div className="bg-gray-750 rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-gray-400 mb-1">Koneksi</p>
            <p className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? '● Online' : '○ Offline'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-1">Mode</p>
            <p className="font-medium text-white">
              {isMonitoring ? 'Real-time' : 'Standby'}
            </p>
          </div>
        </div>
        {lastUpdate && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500 text-center">
              Last update: {new Date(lastUpdate).toLocaleTimeString('id-ID')}
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {isConnected && !isStable && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-sm text-yellow-400 text-center flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>Tunggu hingga berat stabil sebelum capture</span>
          </p>
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400 text-center flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>Timbangan tidak terhubung. Periksa koneksi serial port.</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default OperatorWeightWidget
