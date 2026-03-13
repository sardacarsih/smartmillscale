import React, { useMemo } from 'react'

/**
 * WeightDisplayCard - Consolidated weight display with status information
 * Combines weight reading, connection status, and monitoring status in one card
 */
const WeightDisplayCard = ({
  currentWeight,
  isStable,
  isConnected,
  isMonitoring = true // Optional: true for real-time, false for mock mode
}) => {
  // Format weight with thousand separators
  const weightInKg = useMemo(() => {
    const rawWeight = currentWeight / 100

    // Validation check for corrupted data
    if (isNaN(rawWeight) || !isFinite(rawWeight) || rawWeight < 0) {
      console.warn('Invalid weight detected:', currentWeight, 'Displaying 0')
      return '0'
    }

    // Force integer and use manual dot separator
    return Math.floor(rawWeight).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }, [currentWeight])

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Status Badges Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
            }`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Timbangan Terhubung' : 'Timbangan Tidak Terhubung'}
          </span>
        </div>

        {/* Monitoring status badge */}
        {isMonitoring ? (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            Real-time Active
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            Mock Mode
          </span>
        )}
      </div>

      {/* Weight Display */}
      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Berat Saat Ini</div>
        <div className={`text-5xl font-bold mb-2 ${isStable ? 'text-green-400' : 'text-yellow-400'
          }`}>
          {weightInKg}
          <span className="text-2xl ml-2">kg</span>
        </div>
        {/* Color coding indicates stability: green = stable, yellow = unstable */}
        {/* No text indicator per user requirements */}
      </div>
    </div>
  )
}

export default WeightDisplayCard
