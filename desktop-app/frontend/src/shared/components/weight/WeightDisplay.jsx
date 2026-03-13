import React from 'react'
import { useWeightData } from '../../hooks'
import { formatWeight } from '../../utils/formatters'

/**
 * WeightDisplay Component
 *
 * Displays current weight with formatting and status indicators
 * Supports multiple sizes and styles for different contexts
 *
 * @param {Object} props - Component props
 * @param {string} props.role - User role for permission checking
 * @param {string} props.size - Display size ('small', 'medium', 'large', 'xl')
 * @param {boolean} props.showUnit - Show unit label
 * @param {boolean} props.showStatus - Show stability status
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 *
 * @example
 * <WeightDisplay role="TIMBANGAN" size="large" showStatus={true} />
 */
const WeightDisplay = ({
  role = null,
  size = 'medium',
  showUnit = true,
  showStatus = true,
  className = '',
  onClick = null
}) => {
  const {
    hasAccess,
    formattedWeight,
    weightInKg,
    currentWeight,
    isStable,
    isConnected,
    error
  } = useWeightData({ role })

  // Size configurations
  const sizeClasses = {
    small: {
      container: 'px-3 py-2',
      weight: 'text-xl',
      unit: 'text-xs',
      status: 'text-xs'
    },
    medium: {
      container: 'px-4 py-3',
      weight: 'text-3xl',
      unit: 'text-sm',
      status: 'text-sm'
    },
    large: {
      container: 'px-6 py-4',
      weight: 'text-5xl',
      unit: 'text-base',
      status: 'text-base'
    },
    xl: {
      container: 'px-8 py-6',
      weight: 'text-7xl',
      unit: 'text-lg',
      status: 'text-lg'
    }
  }

  const sizeConfig = sizeClasses[size] || sizeClasses.medium

  // Handle no access
  if (!hasAccess) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${sizeConfig.container} ${className}`}>
        <div className="text-center">
          <p className="text-gray-400 text-sm">No Access</p>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      </div>
    )
  }

  // Handle not connected
  if (!isConnected) {
    return (
      <div className={`flex items-center justify-center bg-gray-700 rounded-lg ${sizeConfig.container} ${className}`}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className={sizeConfig.status}>Not Connected</span>
          </div>
          <p className={`text-gray-400 ${sizeConfig.unit} mt-1`}>---.-- kg</p>
        </div>
      </div>
    )
  }

  // Main display
  return (
    <div
      className={`flex flex-col items-center justify-center bg-gray-800 rounded-lg border-2 transition-all duration-200 ${isStable ? 'border-green-500' : 'border-yellow-500'
        } ${onClick ? 'cursor-pointer hover:bg-gray-750' : ''} ${sizeConfig.container} ${className}`}
      onClick={onClick}
    >
      {/* Weight value */}
      <div className="flex items-baseline gap-2">
        <span className={`font-bold ${isStable ? 'text-green-400' : 'text-yellow-400'} ${sizeConfig.weight} font-mono`}>
          {formatWeight(currentWeight, 'kg', true).replace(' kg', '')}
        </span>
        {showUnit && (
          <span className={`text-gray-400 ${sizeConfig.unit}`}>kg</span>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <div className="flex items-center gap-2 mt-2">
          <div className={`w-2 h-2 rounded-full ${currentWeight === 0 ? 'bg-gray-500' :
              isStable ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
            }`} />
          <span className={`${currentWeight === 0 ? 'text-gray-400' :
              isStable ? 'text-green-400' : 'text-yellow-400'
            } ${sizeConfig.status}`}>
            {currentWeight === 0 ? 'Kosong' : isStable ? 'Stabil' : 'Tidak Stabil'}
          </span>
        </div>
      )}
    </div>
  )
}

export default WeightDisplay
