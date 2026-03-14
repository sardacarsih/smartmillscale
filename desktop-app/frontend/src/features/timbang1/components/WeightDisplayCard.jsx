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
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow-inner shadow-black/20 sm:p-6">
      {/* Status Badges Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'
            }`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Timbangan Terhubung' : 'Timbangan Tidak Terhubung'}
          </span>
        </div>

        {/* Monitoring status badge */}
        {isMonitoring ? (
          <span className="w-fit rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">
            Real-time Active
          </span>
        ) : (
          <span className="w-fit rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-400">
            Mock Mode
          </span>
        )}
      </div>

      {/* Weight Display */}
      <div className="mt-5 text-center">
        <div className="text-sm text-gray-400 mb-2">Berat Saat Ini</div>
        <div className={`text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl ${isStable ? 'text-green-400' : 'text-yellow-400'
          }`}>
          {weightInKg}
          <span className="ml-2 text-xl sm:text-2xl">kg</span>
        </div>
        {/* Color coding indicates stability: green = stable, yellow = unstable */}
        {/* No text indicator per user requirements */}
      </div>
    </div>
  )
}

export default WeightDisplayCard
