import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { USER_ROLES } from '../constants/roles'

const useNavigationStore = create(
  persist(
    (set, get) => ({
      // Current page state - initialize with dashboard in history
      currentPage: 'dashboard',
      navigationHistory: ['dashboard'],

      // Navigation actions
      navigateTo: (page) => {
        const state = get()
        const currentHistory = state.navigationHistory

        // Avoid duplicating the same page in history
        if (currentHistory[currentHistory.length - 1] === page) {
          return
        }

        set({
          currentPage: page,
          navigationHistory: [...currentHistory, page]
        })
      },

      setCurrentPage: (page) => {
        set({ currentPage: page })
      },

      goBack: () => {
        const state = get()
        const history = [...state.navigationHistory]

        // Need at least 2 pages in history to go back (current + previous)
        if (history.length > 1) {
          history.pop() // Remove current page
          const previousPage = history[history.length - 1]
          set({
            currentPage: previousPage,
            navigationHistory: history
          })
        } else {
          // Fallback: navigate to dashboard if no history
          set({
            currentPage: 'dashboard',
            navigationHistory: ['dashboard']
          })
        }
      },

      resetNavigation: () => {
        set({
          currentPage: 'dashboard',
          navigationHistory: ['dashboard']
        })
      },

      // Check if page is accessible for user role
      canAccessPage: (page, userRole) => {
        const pagePermissions = {
          'dashboard': ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING'],
          'timbang1': ['ADMIN', 'SUPERVISOR', 'TIMBANGAN'], // Timbang 1 PKS
          'master-data': ['ADMIN', 'SUPERVISOR'], // Master Data Management
          'pks-reports': ['ADMIN', 'SUPERVISOR', 'TIMBANGAN'], // PKS Reporting
          'profile': ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING'],
          'help': ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING'],
          'settings': ['ADMIN'],
          'users': ['ADMIN'],
          'audit': ['ADMIN', 'SUPERVISOR'],
          'sync-management': ['ADMIN'] // API Key Management - Admin only
        }

        return pagePermissions[page]?.includes(userRole) || false
      },

      // Get default route for specific role
      getRoleDefaultRoute: (userRole) => {
        const roleRoutes = {
          [USER_ROLES.ADMIN]: {
            page: 'dashboard',
            label: 'Admin Dashboard',
            description: 'System management and analytics dashboard'
          },
          [USER_ROLES.SUPERVISOR]: {
            page: 'dashboard',
            label: 'Supervisor Dashboard',
            description: 'Monitoring and reporting dashboard'
          },
          [USER_ROLES.TIMBANGAN]: {
            page: 'dashboard',
            label: 'Timbangan Dashboard',
            description: 'Weighing operations dashboard'
          },
          [USER_ROLES.GRADING]: {
            page: 'dashboard',
            label: 'Grading Dashboard',
            description: 'Grading operations dashboard'
          }
        }

        return roleRoutes[userRole] || {
          page: 'dashboard',
          label: 'Dashboard',
          description: 'Default dashboard'
        }
      },

      // Get navigation items for specific role
      getNavigationItems: (userRole) => {
        const allItems = [
          {
            key: 'dashboard',
            label: 'Dashboard',
            icon: 'Grid3X3',
            path: '/dashboard',
            roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
          },
          {
            key: 'timbang1',
            label: 'Timbang 1 PKS',
            icon: 'Scale',
            path: '/timbang1',
            roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN']
          },
          {
            key: 'master-data',
            label: 'Master Data',
            icon: 'Database',
            path: '/master-data',
            roles: ['ADMIN', 'SUPERVISOR']
          },
          {
            key: 'profile',
            label: 'Profil Saya',
            icon: 'User',
            path: '/profile',
            roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
          },
          {
            key: 'help',
            label: 'Bantuan',
            icon: 'HelpCircle',
            path: '/help',
            roles: ['ADMIN', 'SUPERVISOR', 'TIMBANGAN', 'GRADING']
          },
          {
            key: 'settings',
            label: 'Pengaturan Sistem',
            icon: 'Settings',
            path: '/settings',
            roles: ['ADMIN']
          },
          {
            key: 'users',
            label: 'Manajemen Pengguna',
            icon: 'Users',
            path: '/users',
            roles: ['ADMIN']
          },
          {
            key: 'audit',
            label: 'Log Audit',
            icon: 'Shield',
            path: '/audit',
            roles: ['ADMIN', 'SUPERVISOR']
          }
        ]

        return allItems.filter(item => item.roles.includes(userRole))
      }
    }), {
    name: 'navigation-storage', // unique name for localStorage key
    partialize: (state) => ({
      navigationHistory: state.navigationHistory
    })
  }))

// Enable HMR for development
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('🔥 HMR: Navigation store reloaded')
  })
}

export { useNavigationStore }
export default useNavigationStore