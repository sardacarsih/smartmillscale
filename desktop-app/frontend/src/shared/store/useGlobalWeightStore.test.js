import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useGlobalWeightStore from './useGlobalWeightStore.js'

// Mock console methods to reduce test noise
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

describe('useGlobalWeightStore - Penyimpanan Berat Global', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        console.log = vi.fn()
        console.warn = vi.fn()
        console.error = vi.fn()

        // Reset store to initial state using setState
        useGlobalWeightStore.setState({
            isMonitoring: false,
            isPersistent: false,
            currentWeight: 0,
            isStable: false,
            isConnected: false,
            error: null,
            subscribers: new Map()
        })
    })

    afterEach(() => {
        vi.restoreAllMocks()
        console.log = originalConsoleLog
        console.warn = originalConsoleWarn
        console.error = originalConsoleError
    })

    describe('State Awal', () => {
        it('harus memiliki state awal yang benar', () => {
            const store = useGlobalWeightStore.getState()

            expect(store.currentWeight).toBe(0)
            expect(store.isStable).toBe(false)
            expect(store.isConnected).toBe(false)
            expect(store.unit).toBe('kg')
            expect(store.isMonitoring).toBe(false)
            expect(store.isStarting).toBe(false)
            expect(store.isStopping).toBe(false)
            expect(store.isPersistent).toBe(false)
            expect(store.error).toBe(null)
        })
    })

    describe('Kunci Persistence', () => {
        it('harus mengizinkan pengaturan flag persistence', () => {
            const store = useGlobalWeightStore.getState()
            store.setPersistent(true)

            const freshState = useGlobalWeightStore.getState()
            expect(freshState.isPersistent).toBe(true)
        })

        it('harus mencegah stop ketika persistence terkunci', async () => {
            const mockWails = {
                StopWeightMonitoring: vi.fn().mockResolvedValue(undefined)
            }

            const store = useGlobalWeightStore.getState()
            store.setWails(mockWails)
            // Simulate monitoring already started
            useGlobalWeightStore.setState({ isMonitoring: true })
            store.setPersistent(true)

            const result = await store.stopMonitoring(null)
            const freshState = useGlobalWeightStore.getState()

            expect(result).toBe(false)
            expect(mockWails.StopWeightMonitoring).not.toHaveBeenCalled()
            expect(freshState.isMonitoring).toBe(true)
        })

        it('harus mengizinkan stop dengan flag force meskipun persistent', async () => {
            const mockWails = {
                StopWeightMonitoring: vi.fn().mockResolvedValue(undefined)
            }

            const store = useGlobalWeightStore.getState()
            store.setWails(mockWails)
            // Simulate monitoring already started
            useGlobalWeightStore.setState({ isMonitoring: true })
            store.setPersistent(true)

            const result = await store.stopMonitoring(null, { force: true })
            const freshState = useGlobalWeightStore.getState()

            expect(result).toBe(true)
            expect(mockWails.StopWeightMonitoring).toHaveBeenCalled()
            expect(freshState.isMonitoring).toBe(false)
        })
    })

    describe('Sistem Izin', () => {
        it('harus memberikan semua izin kepada ADMIN', () => {
            const store = useGlobalWeightStore.getState()

            expect(store.checkPermission('ADMIN', 'canControl')).toBe(true)
            expect(store.checkPermission('ADMIN', 'canView')).toBe(true)
            expect(store.checkPermission('ADMIN', 'canAnalyze')).toBe(true)
        })

        it('harus menolak izin kontrol untuk GRADING', () => {
            const store = useGlobalWeightStore.getState()

            expect(store.checkPermission('GRADING', 'canControl')).toBe(false)
            expect(store.checkPermission('GRADING', 'canView')).toBe(true)
        })
    })
})
