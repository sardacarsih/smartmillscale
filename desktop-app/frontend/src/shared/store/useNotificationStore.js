import { create } from 'zustand'

/**
 * Shared notification store
 * Centralized notification management for the entire application
 */
const useNotificationStore = create((set) => ({
  notification: null,

  // Show notification
  setNotification: (notification) => set({ notification }),

  // Clear notification
  clearNotification: () => set({ notification: null }),

  // Helper methods for different notification types
  showSuccess: (message) => set({ notification: { type: 'success', message } }),
  showError: (message) => set({ notification: { type: 'error', message } }),
  showWarning: (message) => set({ notification: { type: 'warning', message } }),
  showInfo: (message) => set({ notification: { type: 'info', message } }),
}))

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Notification store reloaded')
  })
}

export default useNotificationStore
