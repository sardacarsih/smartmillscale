import { useEffect } from 'react'
import useNotificationStore from '../store/useNotificationStore'

const Notification = () => {
  const { notification, clearNotification } = useNotificationStore()

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        clearNotification()
      }, 5000) // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [notification, clearNotification])

  if (!notification) return null

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✗'
      case 'warning':
        return '⚠'
      case 'info':
        return 'ℹ'
      default:
        return '•'
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-700 text-green-100'
      case 'error':
        return 'bg-red-900/90 border-red-700 text-red-100'
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-700 text-yellow-100'
      case 'info':
        return 'bg-blue-900/90 border-blue-700 text-blue-100'
      default:
        return 'bg-gray-900/90 border-gray-700 text-gray-100'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className={`max-w-md rounded-lg border-2 shadow-lg p-4 ${getStyles(notification.type)}`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">
            {getIcon(notification.type)}
          </div>
          <div className="flex-1">
            <p className="font-medium">{notification.message}</p>
          </div>
          <button
            onClick={clearNotification}
            className="flex-shrink-0 text-xl hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default Notification
