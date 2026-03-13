import { useEffect } from 'react'
import { authConfig } from '../../config/env'

/**
 * Hook to manage session timeout and auto-lock behavior.
 * Resets timers on user activity and locks the screen after inactivity.
 */
const useSessionTimeout = ({ isAuthenticated, user, wails, onLock }) => {
  useEffect(() => {
    if (!isAuthenticated || !user) return

    const sessionTimeout = authConfig.sessionTimeout
    const warningTimeout = authConfig.warningTimeout || sessionTimeout - 60000

    let warningTimer, timeoutTimer

    const resetTimers = () => {
      clearTimeout(warningTimer)
      clearTimeout(timeoutTimer)

      warningTimer = setTimeout(() => {
        if (wails?.AddNotification) {
          wails.AddNotification({
            type: 'warning',
            title: 'Session Timeout Warning',
            message: 'Your session will expire in 1 minute. Please save your work.',
            duration: 55000
          })
        }
      }, warningTimeout)

      timeoutTimer = setTimeout(() => {
        onLock()
        if (wails?.AddNotification) {
          wails.AddNotification({
            type: 'error',
            title: 'Session Expired',
            message: 'Your session has expired due to inactivity. Please login again.',
            duration: 10000
          })
        }
      }, sessionTimeout)
    }

    const handleActivity = () => {
      resetTimers()
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    resetTimers()

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(timeoutTimer)
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })
    }
  }, [isAuthenticated, user, wails, onLock])
}

export default useSessionTimeout
