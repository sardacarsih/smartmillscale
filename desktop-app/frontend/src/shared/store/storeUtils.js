/**
 * Helper function untuk mendapatkan timestamp ISO string
 * Menggunakan try-catch untuk menghindari issue saat testing dengan vitest mock
 */
export const getCurrentTimestamp = () => {
  try {
    // Try to use globalThis.Date first (not mocked by vitest)
    if (globalThis.Date && typeof globalThis.Date === 'function') {
      return new globalThis.Date().toISOString()
    }
    // Fallback to regular Date
    return new Date().toISOString()
  } catch (e) {
    // Ultimate fallback - return epoch timestamp as string
    return Date.now().toString()
  }
}
