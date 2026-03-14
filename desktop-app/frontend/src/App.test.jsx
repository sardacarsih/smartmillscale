import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import useAuthStore from './features/auth/store/useAuthStore'
import useNavigationStore from './shared/store/useNavigationStore'
import { useNotificationStore } from './shared'
import { useWeightMonitoring } from './shared/hooks'
import useGlobalWeightStore from './shared/store/useGlobalWeightStore'

const h = React.createElement

vi.mock('./features/auth/store/useAuthStore')
vi.mock('./shared/store/useNavigationStore')
vi.mock('./shared', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNotificationStore: vi.fn(),
    Notification: () => h('div', { 'data-testid': 'notification-component' }, 'Notification'),
    UserBadge: () => h('div', { 'data-testid': 'user-badge' }, 'UserBadge'),
    ErrorBoundary: ({ children }) => h('div', { 'data-testid': 'error-boundary' }, children),
    Topbar: () => h('div', { 'data-testid': 'topbar' }, 'Topbar')
  }
})
vi.mock('./shared/hooks', () => ({
  useWeightMonitoring: vi.fn()
}))
vi.mock('./shared/store/useGlobalWeightStore', () => ({
  default: {
    getState: vi.fn(() => ({
      stopMonitoring: vi.fn(),
      setPersistent: vi.fn()
    }))
  }
}))
vi.mock('./shared/lib/wailsWrapper', () => ({
  getWailsWrapper: vi.fn(() => ({
    EventsOn: vi.fn(),
    EventsOff: vi.fn(),
    AddNotification: vi.fn()
  }))
}))
vi.mock('./shared/hooks/useSessionTimeout', () => ({
  default: vi.fn()
}))
vi.mock('./shared/components/LoadingScreen', () => ({
  default: ({ message }) => h('div', { 'data-testid': 'loading-screen' }, message)
}))
vi.mock('./shared/components/AppRouter', () => ({
  default: ({ currentPage }) => {
    const pageMap = {
      dashboard: h('div', { 'data-testid': 'role-dashboard' }, 'Role Dashboard'),
      timbang1: h('div', { 'data-testid': 'timbang1-page' }, 'Timbang1 Page'),
      'master-data': h('div', { 'data-testid': 'master-data-page' }, 'Master Data Page'),
      profile: h('div', { 'data-testid': 'profile-page' }, 'Profile Page'),
      settings: h('div', { 'data-testid': 'settings-page' }, 'Settings Page'),
      users: h('div', { 'data-testid': 'user-management-page' }, 'User Management Page'),
      audit: h('div', { 'data-testid': 'audit-log-page' }, 'Audit Log Page'),
    }
    return pageMap[currentPage] || h('div', { 'data-testid': 'role-dashboard' }, 'Role Dashboard')
  }
}))
vi.mock('./features/auth', async () => {
  const authStore = await import('./features/auth/store/useAuthStore')
  return {
    LoginPage: () => h('div', { 'data-testid': 'login-page' }, 'Login Page'),
    SetupWizard: () => h('div', { 'data-testid': 'setup-wizard' }, 'Setup Wizard'),
    LockScreen: () => h('div', { 'data-testid': 'lock-screen' }, 'Lock Screen'),
    useAuthStore: authStore.default
  }
})
vi.mock('./shared/contexts/WailsContext', () => ({
  WailsProvider: ({ children }) => h('div', { 'data-testid': 'wails-provider' }, children)
}))
vi.mock('./shared/services/UserService', () => ({
  UserService: class MockUserService {
    constructor() {
      this.login = vi.fn()
      this.logout = vi.fn()
    }
  }
}))
vi.mock('./config/env', () => ({
  appConfig: {},
  updateIntervals: {},
  features: {},
  authConfig: {
    sessionTimeout: 1800000,
    warningTimeout: 1740000
  }
}))

describe('App Component', () => {
  let mockCheckSession
  let mockLogout
  let mockNavigateTo
  let mockGoBack
  let mockCanAccessPage

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    window.go = {
      main: {
        App: {}
      }
    }

    mockCheckSession = vi.fn()
    mockLogout = vi.fn()
    useAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      checkSession: mockCheckSession,
      checkSetupRequired: vi.fn(),
      logout: mockLogout,
      error: null,
      clearError: vi.fn()
    })

    mockNavigateTo = vi.fn()
    mockGoBack = vi.fn()
    mockCanAccessPage = vi.fn().mockReturnValue(true)
    useNavigationStore.mockReturnValue({
      currentPage: 'dashboard',
      navigateTo: mockNavigateTo,
      goBack: mockGoBack,
      canAccessPage: mockCanAccessPage
    })

    useNotificationStore.mockReturnValue({
      notifications: [],
      removeNotification: vi.fn(),
      clearAllNotifications: vi.fn()
    })

    useWeightMonitoring.mockReturnValue({
      isMonitoring: false,
      isConnected: true,
      error: null,
      isReady: true
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Login Flow', () => {
    it('renders LoginPage when not authenticated', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        checkSession: mockCheckSession,
        checkSetupRequired: vi.fn(),
        logout: mockLogout,
        error: null,
        clearError: vi.fn()
      })

      render(h(App))
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })

    it('renders RoleDashboard when authenticated', async () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'ADMIN', username: 'admin' },
        checkSession: mockCheckSession,
        checkSetupRequired: vi.fn(),
        logout: mockLogout,
        error: null,
        clearError: vi.fn()
      })

      render(h(App))

      await act(async () => {
        vi.advanceTimersByTime(1100)
      })

      expect(screen.getByTestId('role-dashboard')).toBeInTheDocument()
    })

    it('shows loading spinner when isLoading is true', () => {
      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: true,
        user: null,
        checkSession: mockCheckSession,
        checkSetupRequired: vi.fn(),
        logout: mockLogout,
        error: null,
        clearError: vi.fn()
      })

      render(h(App))
      expect(screen.getByText('Initializing Smart Mill Scale...')).toBeInTheDocument()
    })
  })

  describe('Navigation Flow', () => {
    beforeEach(() => {
      useAuthStore.mockReturnValue({
        isAuthenticated: true,
        isLoading: false,
        user: { role: 'ADMIN', username: 'admin' },
        checkSession: mockCheckSession,
        checkSetupRequired: vi.fn(),
        logout: mockLogout,
        error: null,
        clearError: vi.fn()
      })
    })

    it('renders Timbang1Page when currentPage is timbang1', async () => {
      useNavigationStore.mockReturnValue({
        currentPage: 'timbang1',
        navigateTo: mockNavigateTo,
        goBack: mockGoBack,
        canAccessPage: mockCanAccessPage
      })

      render(h(App))
      await act(async () => { vi.advanceTimersByTime(1100) })
      expect(screen.getByTestId('timbang1-page')).toBeInTheDocument()
    })

    it('renders MasterDataPage when currentPage is master-data', async () => {
      useNavigationStore.mockReturnValue({
        currentPage: 'master-data',
        navigateTo: mockNavigateTo,
        goBack: mockGoBack,
        canAccessPage: mockCanAccessPage
      })

      render(h(App))
      await act(async () => { vi.advanceTimersByTime(1100) })
      expect(screen.getByTestId('master-data-page')).toBeInTheDocument()
    })

    it('renders ProfilePage when currentPage is profile', async () => {
      useNavigationStore.mockReturnValue({
        currentPage: 'profile',
        navigateTo: mockNavigateTo,
        goBack: mockGoBack,
        canAccessPage: mockCanAccessPage
      })

      render(h(App))
      await act(async () => { vi.advanceTimersByTime(1100) })
      expect(screen.getByTestId('profile-page')).toBeInTheDocument()
    })

    it('renders SettingsPage when currentPage is settings', async () => {
      useNavigationStore.mockReturnValue({
        currentPage: 'settings',
        navigateTo: mockNavigateTo,
        goBack: mockGoBack,
        canAccessPage: mockCanAccessPage
      })

      render(h(App))
      await act(async () => { vi.advanceTimersByTime(1100) })
      expect(screen.getByTestId('settings-page')).toBeInTheDocument()
    })
  })

  describe('Logout Flow', () => {
    it('calls stopMonitoring on logout', async () => {
      const mockStopMonitoring = vi.fn()
      const mockSetPersistent = vi.fn()

      useGlobalWeightStore.getState = vi.fn(() => ({
        stopMonitoring: mockStopMonitoring,
        setPersistent: mockSetPersistent
      }))

      const { rerender } = render(h(App))

      useAuthStore.mockReturnValue({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        checkSession: mockCheckSession,
        checkSetupRequired: vi.fn(),
        logout: mockLogout,
        error: null,
        clearError: vi.fn()
      })

      await act(async () => {
        rerender(h(App))
      })

      expect(mockSetPersistent).toHaveBeenCalledWith(false)
      expect(mockStopMonitoring).toHaveBeenCalledWith(null, { force: true })
    })
  })
})
