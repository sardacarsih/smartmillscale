/**
 * Custom hook for tracking user activity
 */
import { useEffect, useCallback } from 'react'

const DEFAULT_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'click',
  'touchstart'
]

/**
 * Hook to track user activity and call a callback on activity
 * @param {function} onActivity - Callback function to call on user activity
 * @param {boolean} enabled - Whether tracking is enabled
 * @param {array} events - Array of event names to track (default: mouse, keyboard, touch)
 */
export const useActivityTracker = (onActivity, enabled = true, events = DEFAULT_EVENTS) => {
  const handleActivity = useCallback(() => {
    if (enabled && onActivity) {
      onActivity()
    }
  }, [enabled, onActivity])

  useEffect(() => {
    if (!enabled) return

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    // Track visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleActivity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, events, handleActivity])
}

export default useActivityTracker
