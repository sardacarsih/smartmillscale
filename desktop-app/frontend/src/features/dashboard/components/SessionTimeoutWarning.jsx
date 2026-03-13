/**
 * SessionTimeoutWarning - Warns users about impending session timeout
 * Shows countdown and allows session extension
 */
import { useState, useEffect } from 'react'
import { useAuthStore } from '../../auth'

const SessionTimeoutWarning = ({ warningTime = 120000, onExtendSession }) => {
  const { user, refreshSession } = useAuthStore()
  const [isVisible, setIsVisible] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Check for session timeout warning
  useEffect(() => {
    const checkSessionTimeout = () => {
      const now = Date.now()
      const timeSinceActivity = now - lastActivity
      const sessionTimeout = 15 * 60 * 1000 // 15 minutes
      const timeUntilTimeout = sessionTimeout - timeSinceActivity

      if (timeUntilTimeout <= warningTime && timeUntilTimeout > 0) {
        setIsVisible(true)
        setTimeRemaining(Math.ceil(timeUntilTimeout / 1000))
      } else if (timeUntilTimeout <= 0) {
        // Session expired
        setIsVisible(false)
        // Auth store will handle the actual logout
      } else {
        setIsVisible(false)
      }
    }

    const interval = setInterval(checkSessionTimeout, 1000)
    return () => clearInterval(interval)
  }, [lastActivity, warningTime])

  // Update last activity on user interaction
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(Date.now())
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true)
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true)
      })
    }
  }, [])

  // Countdown timer
  useEffect(() => {
    if (isVisible && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isVisible, timeRemaining])

  const handleExtendSession = async () => {
    try {
      await refreshSession()
      setLastActivity(Date.now())
      setIsVisible(false)
      onExtendSession?.()
    } catch (error) {
      console.error('Failed to extend session:', error)
    }
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isVisible || !user) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-yellow-600">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-yellow-500 bg-opacity-20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Session Timeout Warning</h3>
            <p className="text-sm text-gray-400">
              Your session will expire in <span className="text-yellow-400 font-medium">{formatTime(timeRemaining)}</span>
            </p>
          </div>
        </div>

        <p className="text-gray-300 mb-6">
          For your security, your session will automatically timeout due to inactivity. Would you like to extend your session?
        </p>

        <div className="flex gap-3">
          <button
            onClick={handleExtendSession}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Extend Session
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Dismiss
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Current User:</span>
            <span className="text-white font-medium">{user.full_name}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-400">Role:</span>
            <span className="text-white font-medium capitalize">{user.role.toLowerCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionTimeoutWarning