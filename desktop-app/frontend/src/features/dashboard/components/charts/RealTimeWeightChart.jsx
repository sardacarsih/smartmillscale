/**
 * RealTimeWeightChart - Real-time weight monitoring chart
 * Shows live weight data with automatic updates from global weight store
 */
import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import useGlobalWeightStore from '../../../../shared/store/useGlobalWeightStore'

const RealTimeWeightChart = ({
  initialData = [],
  height = 300,
  title = "Live Weight Monitor",
  maxDataPoints = 50,
  updateInterval = 1000
}) => {
  const [data, setData] = useState(initialData.slice(-maxDataPoints))
  const lastWeightRef = useRef(null)
  const lastUpdateTimeRef = useRef(Date.now())

  // Get real-time weight data from global store
  const {
    currentWeight,
    isConnected,
    isStable,
    unit,
    lastUpdate,
    eventHistory
  } = useGlobalWeightStore()

  // Subscribe to weight updates from global store
  useEffect(() => {
    console.log('📊 [RealTimeWeightChart] Initializing with real-time data subscription')

    // Function to add new data point
    const addDataPoint = (weight, timestamp = Date.now()) => {
      // Only add if weight changed or enough time has passed (to avoid too many points)
      const timeSinceLastUpdate = timestamp - lastUpdateTimeRef.current
      const weightChanged = lastWeightRef.current !== weight

      if (weightChanged || timeSinceLastUpdate >= updateInterval) {
        // Fix scaling: divide by 100
        const scaledWeight = weight / 100

        const newDataPoint = {
          time: new Date(timestamp).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          weight: scaledWeight,
          timestamp: timestamp,
          stable: isStable
        }

        setData(prevData => {
          const updatedData = [...prevData, newDataPoint].slice(-maxDataPoints)
          return updatedData
        })

        lastWeightRef.current = weight
        lastUpdateTimeRef.current = timestamp
      }
    }

    // Add current weight when component mounts or weight changes
    if (currentWeight > 0) {
      const timestamp = lastUpdate ? new Date(lastUpdate).getTime() : Date.now()
      addDataPoint(currentWeight, timestamp)
    }

    return () => {
      console.log('🧹 [RealTimeWeightChart] Cleaning up')
    }
  }, [currentWeight, lastUpdate, isStable, maxDataPoints, updateInterval])

  // Populate initial data from event history if available
  useEffect(() => {
    if (eventHistory && eventHistory.length > 0 && data.length === 0) {
      console.log('📥 [RealTimeWeightChart] Loading initial data from event history')
      const historicalData = eventHistory.slice(-maxDataPoints).map(event => ({
        time: new Date(event.timestamp).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        weight: event.weight / 100, // Fix scaling
        timestamp: new Date(event.timestamp).getTime(),
        stable: event.stable
      }))
      setData(historicalData)
    }
  }, [eventHistory, maxDataPoints])

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}></div>
      <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white text-sm font-medium">{`Time: ${label}`}</p>
          <p className="text-blue-400 text-sm">{`Weight: ${payload[0].value.toLocaleString('id-ID')} kg`}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <ConnectionStatus />
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="time"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke={isStable ? "#10B981" : "#F59E0B"}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-gray-400">Waiting for data...</p>
          </div>
        </div>
      )}

      {/* Live Statistics */}
      {data.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Current:</span>
              <span className="ml-2 text-white font-medium">
                {data[data.length - 1].weight.toLocaleString('id-ID')} kg
              </span>
            </div>
            <div>
              <span className="text-gray-400">Average:</span>
              <span className="ml-2 text-white font-medium">
                {Math.round(data.reduce((sum, item) => sum + item.weight, 0) / data.length).toLocaleString('id-ID')} kg
              </span>
            </div>
            <div>
              <span className="text-gray-400">Range:</span>
              <span className="ml-2 text-white font-medium">
                {Math.min(...data.map(d => d.weight)).toLocaleString('id-ID')} - {Math.max(...data.map(d => d.weight)).toLocaleString('id-ID')} kg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RealTimeWeightChart