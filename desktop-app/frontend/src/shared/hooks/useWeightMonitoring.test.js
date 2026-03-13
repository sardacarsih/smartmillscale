import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import useWeightMonitoring from './useWeightMonitoring.js'
import useGlobalWeightStore from '../store/useGlobalWeightStore.js'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error
const originalConsoleTrace = console.trace
const originalConsoleDebug = console.debug
const originalConsoleInfo = console.info

describe('useWeightMonitoring Hook - Pengawasan Berat', () => {
    let mockWails

    beforeEach(() => {
        vi.clearAllMocks()
        console.log = vi.fn()
        console.warn = vi.fn()
        console.error = vi.fn() // Suppress error logging
        console.trace = vi.fn()
        console.debug = vi.fn()
        console.info = vi.fn()

        // Reset global store using setState
        act(() => {
            useGlobalWeightStore.setState({
                isMonitoring: false,
                isPersistent: false,
                currentWeight: 0,
                isStable: false,
                isConnected: false,
                error: null,
                wails: null,
                wailsEventListener: null,
                subscribers: new Map()
            })
        })

        // Create mock Wails instance
        mockWails = {
            StartWeightMonitoring: vi.fn().mockResolvedValue(undefined),
            StopWeightMonitoring: vi.fn().mockResolvedValue(undefined),
            IsWeightMonitoringActive: vi.fn().mockResolvedValue({ isMonitoring: false }),
            IsWeightScaleConnected: vi.fn().mockResolvedValue({ isConnected: true }),
            GetCurrentWeight: vi.fn().mockResolvedValue({ weight: 0, stable: false, unit: 'kg' }),
            EventsOn: vi.fn(),
            EventsOff: vi.fn()
        }
    })

    afterEach(() => {
        vi.restoreAllMocks()
        console.log = originalConsoleLog
        console.warn = originalConsoleWarn
        console.error = originalConsoleError
        console.trace = originalConsoleTrace
        console.debug = originalConsoleDebug
        console.info = originalConsoleInfo
    })

    describe('Inisialisasi Hook', () => {
        it('harus menginisialisasi tanpa error', () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false
            }))

            expect(result.current.isMonitoring).toBeDefined()
            expect(result.current.currentWeight).toBeDefined()
            expect(result.current.start).toBeTypeOf('function')
            expect(result.current.stop).toBeTypeOf('function')
        })

        it('harus memulai monitoring otomatis ketika autoStart true', async () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: false
            }))

            await waitFor(() => {
                expect(mockWails.StartWeightMonitoring).toHaveBeenCalled()
            })
        })

        it('tidak boleh memulai otomatis ketika autoStart false', () => {
            renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false
            }))

            expect(mockWails.StartWeightMonitoring).not.toHaveBeenCalled()
        })
    })

    describe('autoCleanup: false (Bertahan Saat Navigasi)', () => {
        it('TIDAK boleh stop monitoring saat unmount ketika autoCleanup=false', async () => {
            const { unmount } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: false // This is the fix we're testing
            }))

            await waitFor(() => {
                expect(mockWails.StartWeightMonitoring).toHaveBeenCalled()
            })

            // Simulate navigation - component unmounts
            unmount()

            // Wait a bit to ensure cleanup has run
            await new Promise(resolve => setTimeout(resolve, 100))

            // Should NOT have called stop
            expect(mockWails.StopWeightMonitoring).not.toHaveBeenCalled()
        })

        it('hanya boleh unsubscribe dari store saat unmount ketika autoCleanup=false', async () => {
            const { unmount } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: false
            }))

            await waitFor(() => {
                const store = useGlobalWeightStore.getState()
                expect(store.subscribers.size).toBeGreaterThan(0)
            })

            const subscriberCountBefore = useGlobalWeightStore.getState().subscribers.size

            unmount()

            await waitFor(() => {
                const subscriberCountAfter = useGlobalWeightStore.getState().subscribers.size
                expect(subscriberCountAfter).toBe(subscriberCountBefore - 1)
            })

            // Monitoring should still be active
            expect(mockWails.StopWeightMonitoring).not.toHaveBeenCalled()
        })
    })

    describe('autoCleanup: true (Stop Saat Unmount)', () => {
        it('harus stop monitoring saat unmount ketika autoCleanup=true', async () => {
            const { unmount } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: true // Explicit cleanup requested
            }))

            await waitFor(() => {
                expect(mockWails.StartWeightMonitoring).toHaveBeenCalled()
            })

            // Set monitoring state to true
            act(() => {
                useGlobalWeightStore.getState().isMonitoring = true
            })

            unmount()

            await waitFor(() => {
                expect(mockWails.StopWeightMonitoring).toHaveBeenCalled()
            })
        })
    })

    describe('Perbaikan Dependency Array', () => {
        it('tidak boleh re-initialize ketika monitoring state berubah', async () => {
            const { rerender } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false
            }))

            await waitFor(() => {
                expect(mockWails.EventsOn).toHaveBeenCalled()
            })

            const eventOnCallCount = mockWails.EventsOn.mock.calls.length

            // Change monitoring state
            act(() => {
                useGlobalWeightStore.getState().isMonitoring = true
            })

            // Force re-render
            rerender()

            await new Promise(resolve => setTimeout(resolve, 100))

            // Should not have registered event listener again
            expect(mockWails.EventsOn.mock.calls.length).toBe(eventOnCallCount)
        })

        it('harus re-initialize hanya ketika konfigurasi berubah', async () => {
            let wails = mockWails
            const { rerender } = renderHook(
                ({ wails: w }) => useWeightMonitoring({
                    wails: w,
                    role: 'ADMIN',
                    autoStart: false,
                    autoCleanup: false
                }),
                { initialProps: { wails } }
            )

            await waitFor(() => {
                expect(mockWails.EventsOn).toHaveBeenCalled()
            })

            const eventOnCallCount = mockWails.EventsOn.mock.calls.length

            // Change wails instance (configuration change)
            const newMockWails = {
                ...mockWails,
                EventsOn: vi.fn()
            }
            wails = newMockWails

            rerender({ wails: newMockWails })

            await waitFor(() => {
                expect(newMockWails.EventsOn).toHaveBeenCalled()
            })

            // Should have registered new event listener
            expect(newMockWails.EventsOn.mock.calls.length).toBeGreaterThan(0)
        })
    })

    describe('Metode Kontrol', () => {
        it('harus mengizinkan start manual', async () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false
            }))

            await act(async () => {
                await result.current.start()
            })

            await waitFor(() => {
                expect(mockWails.StartWeightMonitoring).toHaveBeenCalled()
            })
        })

        it('harus mengizinkan stop manual', async () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: false
            }))

            await waitFor(() => {
                expect(mockWails.StartWeightMonitoring).toHaveBeenCalled()
            })

            act(() => {
                useGlobalWeightStore.getState().isMonitoring = true
            })

            await act(async () => {
                await result.current.stop()
            })

            await waitFor(() => {
                expect(mockWails.StopWeightMonitoring).toHaveBeenCalled()
            })
        })

        it('harus menghormati izin role untuk kontrol', async () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'GRADING', // Cannot control
                autoStart: false,
                autoCleanup: false
            }))

            let startResult
            await act(async () => {
                startResult = await result.current.start()
            })

            expect(startResult).toBe(false)
            expect(mockWails.StartWeightMonitoring).not.toHaveBeenCalled()
        })
    })

    describe('Ekspose State', () => {
        it('harus mengekspose state monitoring', async () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: true,
                autoCleanup: false
            }))

            await waitFor(() => {
                expect(result.current.isMonitoring).toBeDefined()
                expect(result.current.currentWeight).toBeDefined()
                expect(result.current.isStable).toBeDefined()
                expect(result.current.isConnected).toBeDefined()
            })
        })

        it('harus mengekspose analytics untuk role yang berwenang', () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false
            }))

            expect(result.current.statistics).toBeDefined()
            expect(result.current.hasAnalyticsAccess).toBe(true)
        })

        it('harus menunjukkan tidak ada akses analytics untuk role yang tidak berwenang', () => {
            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'GRADING',
                autoStart: false,
                autoCleanup: false
            }))

            expect(result.current.hasAnalyticsAccess).toBe(false)
        })
    })

    describe('Callbacks', () => {
        it('harus memanggil callback onWeightChange', async () => {
            const onWeightChange = vi.fn()

            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false,
                onWeightChange
            }))

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.isInitialized).toBe(true)
            })

            // Simulate weight update from store
            act(() => {
                const store = useGlobalWeightStore.getState()
                store.notifySubscribers('weight_updated', { weight: 12000, stable: true, connected: true })
            })

            await waitFor(() => {
                expect(onWeightChange).toHaveBeenCalledWith(12000, expect.objectContaining({
                    weight: 12000,
                    stable: true
                }))
            })
        })

        it('harus memanggil callback onConnectionChange', async () => {
            const onConnectionChange = vi.fn()

            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false,
                onConnectionChange
            }))

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.isInitialized).toBe(true)
            })

            // Simulate connection change from store
            act(() => {
                const store = useGlobalWeightStore.getState()
                store.notifySubscribers('connection_change', { connected: true })
            })

            await waitFor(() => {
                expect(onConnectionChange).toHaveBeenCalledWith(true)
            })
        })

        it('harus memanggil callback onStabilityChange', async () => {
            const onStabilityChange = vi.fn()

            const { result } = renderHook(() => useWeightMonitoring({
                wails: mockWails,
                role: 'ADMIN',
                autoStart: false,
                autoCleanup: false,
                onStabilityChange
            }))

            // Wait for initialization
            await waitFor(() => {
                expect(result.current.isInitialized).toBe(true)
            })

            // Simulate stability change from store
            act(() => {
                const store = useGlobalWeightStore.getState()
                store.notifySubscribers('weight_updated', { weight: 12000, stable: true, connected: true })
            })

            await waitFor(() => {
                expect(onStabilityChange).toHaveBeenCalledWith(true)
            })
        })
    })
})
