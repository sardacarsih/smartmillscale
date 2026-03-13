/**
 * Utility functions for formatting data
 */

/**
 * Format weight value with unit using Indonesian formatting
 * @param {number} weight - Weight value (can be integer from database or decimal)
 * @param {string} unit - Unit of measurement (default: 'kg')
 * @param {boolean} isFromDatabase - If true, weight is stored as integer ×100
 * @returns {string}
 */
export const formatWeight = (weight, unit = 'kg', isFromDatabase = true) => {
  if (weight === null || weight === undefined) return '-'

  let displayWeight
  if (isFromDatabase) {
    displayWeight = weight / 100
  } else {
    displayWeight = weight
  }

  // Special handling: if the number is a whole number >= 1000, format without decimals
  // For 1200: displays as "1.200" (not "1.200,00")
  // For 1234: displays as "1.234" (not "1.234,00")
  if (displayWeight === Math.floor(displayWeight) && displayWeight >= 1000) {
    return `${displayWeight.toLocaleString('id-ID')} ${unit}`
  }

  // For numbers with decimals or small numbers, show 2 decimal places
  return `${displayWeight.toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${unit}`
}

/**
 * Format weight from scale (already in kg, not database format)
 * @param {number} weight - Weight value from scale in kg
 * @param {string} unit - Unit of measurement (default: 'kg')
 * @returns {string}
 */
export const formatWeightFromScale = (weight, unit = 'kg') => {
  if (weight === null || weight === undefined) return '-'

  return `${weight.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })} ${unit}`
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Include time in format
 * @returns {string}
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (includeTime) {
    return dateObj.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format relative time (e.g., "2 menit yang lalu")
 * @param {string|Date} date - Date to format
 * @returns {string}
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now - dateObj
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Baru saja'
  if (diffMin < 60) return `${diffMin} menit yang lalu`
  if (diffHour < 24) return `${diffHour} jam yang lalu`
  if (diffDay < 7) return `${diffDay} hari yang lalu`

  return formatDate(dateObj, false)
}

/**
 * Format vehicle number to standard format
 * @param {string} vehicleNumber - Vehicle number
 * @returns {string}
 */
export const formatVehicleNumber = (vehicleNumber) => {
  if (!vehicleNumber) return '-'
  return vehicleNumber.toUpperCase().replace(/\s+/g, ' ').trim()
}

/**
 * Format percentage
 * @param {number} value - Value to format
 * @param {number} total - Total value
 * @returns {string}
 */
export const formatPercentage = (value, total) => {
  if (total === 0) return '0%'
  const percentage = (value / total) * 100
  return `${percentage.toFixed(1)}%`
}
