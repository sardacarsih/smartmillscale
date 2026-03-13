import React from 'react'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import useAuthStore from './features/auth/store/useAuthStore'
import useNavigationStore from './shared/store/useNavigationStore'
import { useNotificationStore } from './shared'
import { useWeightMonitoring } from './shared/hooks'
import useGlobalWeightStore from './shared/store/useGlobalWeightStore'

// Mock Stores
vi.mock('./features/auth/store/useAuthStore')
vi.mock('./shared/store/useNavigationStore')
vi.mock('./shared', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        useNotificationStore: vi.fn(),
        Notification: () => <div data-testid="notification-component">Notification</div>,
        UserBadge: () => <div data-testid="user-badge">UserBadge</div>,
        ErrorBoundary: ({ children }) => <div data-testid="error-boundary">{children}</div>,
        Topbar: () => <div data-testid="topbar">Topbar</div>
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

// Mock Wails Wrapper
vi.mock('./shared/lib/wailsWrapper', () => ({
    getWailsWrapper: vi.fn(() => ({
        EventsOn: vi.fn(),
        EventsOff: vi.fn(),
        AddNotification: vi.fn()
    }))
}))

// Mock new extracted components
vi.mock('./shared/hooks/useSessionTimeout', () => ({
    default: vi.fn()
}))

vi.mock('./shared/components/LoadingScreen', () => ({
    default: ({ message }) => <div data-testid="loading-screen">{message}</div>
}))

// Mock AppRouter to render test IDs based on currentPage
vi.mock('./shared/components/AppRouter', () => ({
    default: ({ currentPage }) => {
        const pageMap = {
            dashboard: <div data-testid="role-dashboard">Role Dashboard</div>,
            timbang1: <div data-testid="timbang1-page">Timbang1 Page</div>,
            'master-data': <div data-testid="master-data-page">Master Data Page</div>,
            profile: <div data-testid="profile-page">Profile Page</div>,
            settings: <div data-testid="settings-page">Settings Page</div>,
            users: <div data-testid="user-management-page">User Management Page</div>,
            audit: <div data-testid="audit-log-page">Audit Log Page</div>,
        }
        return pageMap[currentPage] || <div data-testid="role-dashboard">Role Dashboard</div>
    }
}))

// Mock Feature Components (still needed for LockScreen and LoginPage in App.jsx)
vi.mock('./features/auth', async () => {
    const authStore = await import('./features/auth/store/useAuthStore')
    return {
        LoginPage: () => <div data-testid="login-page">Login Page</div>,
        SetupWizard: () => <div data-testid="setup-wizard">Setup Wizard</div>,
        LockScreen: () => <div data-testid="lock-screen">Lock Screen</div>,
        useAuthStore: authStore.default
    }
})

vi.mock('./shared/contexts/WailsContext', () => ({
    WailsProvider: ({ children }) => <div data-testid="wails-provider">{children}</div>
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

            render(<App />)
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

            render(<App />)

            // Advance past service initialization delay (1s setTimeout)
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

            render(<App />)
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

            render(<App />)
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

            render(<App />)
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

            render(<App />)
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

            render(<App />)
            await act(async () => { vi.advanceTimersByTime(1100) })
            expect(screen.getByTestId('settings-page')).toBeInTheDocument()
        })
    })

    describe('Logout Flow', () => {
        it('calls stopMonitoring on logout', async () => {
            const mockStopMonitoring = vi.fn()
            const mockSetPersistent = vi.fn()

            const globalStoreMock = {
                stopMonitoring: mockStopMonitoring,
                setPersistent: mockSetPersistent
            }

            useGlobalWeightStore.getState = vi.fn(() => globalStoreMock)

            const { rerender } = render(<App />)

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
                rerender(<App />)
            })

            expect(mockSetPersistent).toHaveBeenCalledWith(false)
            expect(mockStopMonitoring).toHaveBeenCalledWith(null, { force: true })
        })
    })
})
