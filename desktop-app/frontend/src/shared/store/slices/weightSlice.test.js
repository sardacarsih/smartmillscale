import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { create } from 'zustand'
import { createWeightSlice } from './weightSlice.js'

// Mock console methods
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn
const originalConsoleError = console.error

describe('weightSlice - Slice Berat', () => {
    let store

    beforeEach(() => {
        vi.clearAllMocks()
        console.log = vi.fn()
        console.warn = vi.fn()
        console.error = vi.fn()

        // Create a test store with only the weight slice
        store = create((set, get) => ({
            ...createWeightSlice(set, get),
            // Mock dependencies from other slices
            updateStatistics: vi.fn(),
            notifySubscribers: vi.fn(),
            isConnected: false
        }))
    })

    afterEach(() => {
        vi.restoreAllMocks()
        console.log = originalConsoleLog
        console.warn = originalConsoleWarn
        console.error = originalConsoleError
    })

    describe('State Awal', () => {
        it('harus memiliki state awal yang benar', () => {
            const state = store.getState()

            expect(state.currentWeight).toBe(0)
            expect(state.isStable).toBe(false)
            expect(state.unit).toBe('kg')
            expect(state.eventHistory).toEqual([])
            expect(state.maxEventHistory).toBe(100)
        })
    })

    describe('handleWeightEvent', () => {
        it('harus memproses event berat dengan benar', () => {
            const state = store.getState()

            state.handleWeightEvent({
                weight: 12000,
                stable: true,
                unit: 'kg',
                connected: true,
                type: 'weight_change',
                timestamp: new Date().toISOString()
            })

            const newState = store.getState()
            expect(newState.currentWeight).toBe(12000)
            expect(newState.isStable).toBe(true)
            expect(newState.unit).toBe('kg')
            expect(newState.isConnected).toBe(true)
        })

        it('harus menambahkan event ke history', () => {
            const state = store.getState()

            state.handleWeightEvent({
                weight: 12000,
                stable: true,
                unit: 'kg',
                connected: true,
                type: 'weight_change'
            })

            const newState = store.getState()
            expect(newState.eventHistory).toHaveLength(1)
            expect(newState.eventHistory[0]).toMatchObject({
                weight: 12000,
                stable: true,
                type: 'weight_change'
            })
        })

        it('harus membatasi history ke maxEventHistory', () => {
            const state = store.getState()

            // Add 150 events (more than the max of 100)
            for (let i = 0; i < 150; i++) {
                state.handleWeightEvent({
                    weight: i * 100,
                    stable: false,
                    unit: 'kg',
                    connected: true,
                    type: 'weight_change'
                })
            }

            const newState = store.getState()
            expect(newState.eventHistory).toHaveLength(100)
            // Most recent event should be first
            expect(newState.eventHistory[0].weight).toBe(14900)
        })

        it('harus memanggil updateStatistics jika berat > 0', () => {
            const state = store.getState()

            state.handleWeightEvent({
                weight: 12000,
                stable: true,
                unit: 'kg',
                connected: true
            })

            expect(state.updateStatistics).toHaveBeenCalledWith(12000)
        })

        it('harus memanggil notifySubscribers', () => {
            const state = store.getState()

            state.handleWeightEvent({
                weight: 12000,
                stable: true,
                unit: 'kg',
                connected: true,
                type: 'weight_change'
            })

            expect(state.notifySubscribers).toHaveBeenCalledWith('weight_updated', expect.objectContaining({
                weight: 12000,
                stable: true,
                connected: true
            }))
        })

        it('harus menangani data invalid dengan graceful', () => {
            const state = store.getState()

            // Should not throw
            expect(() => {
                state.handleWeightEvent(null)
            }).not.toThrow()

            expect(() => {
                state.handleWeightEvent({})
            }).not.toThrow()
        })
    })

    describe('Utility Methods', () => {
        it('getFormattedWeight harus format dengan benar', () => {
            const state = store.getState()

            // Set weight to 120000 (1200.00 kg)
            store.setState({ currentWeight: 120000 })

            const formatted = state.getFormattedWeight()
            expect(formatted).toBe('1.200,00 kg')
        })

        it('getFormattedWeight harus menangani 0', () => {
            const state = store.getState()

            store.setState({ currentWeight: 0 })

            const formatted = state.getFormattedWeight()
            expect(formatted).toBe('0.00 kg')
        })

        it('getWeightInKg harus konversi dengan benar', () => {
            const state = store.getState()

            store.setState({ currentWeight: 120000 })

            const weightInKg = state.getWeightInKg()
            expect(weightInKg).toBe(1200)
        })

        it('isWeightReadyForCapture harus return true jika kondisi terpenuhi', () => {
            const state = store.getState()

            store.setState({
                isConnected: true,
                isStable: true,
                currentWeight: 12000
            })

            expect(state.isWeightReadyForCapture()).toBe(true)
        })

        it('isWeightReadyForCapture harus return false jika kondisi tidak terpenuhi', () => {
            const state = store.getState()

            // Not stable
            store.setState({
                isConnected: true,
                isStable: false,
                currentWeight: 12000
            })
            expect(state.isWeightReadyForCapture()).toBe(false)

            // Not connected
            store.setState({
                isConnected: false,
                isStable: true,
                currentWeight: 12000
            })
            expect(state.isWeightReadyForCapture()).toBe(false)

            // Weight is 0
            store.setState({
                isConnected: true,
                isStable: true,
                currentWeight: 0
            })
            expect(state.isWeightReadyForCapture()).toBe(false)
        })
    })

    describe('clearEventHistory', () => {
        it('harus clear event history', () => {
            const state = store.getState()

            // Add some events
            state.handleWeightEvent({
                weight: 12000,
                stable: true,
                unit: 'kg',
                connected: true
            })

            // Clear
            state.clearEventHistory()

            const newState = store.getState()
            expect(newState.eventHistory).toEqual([])
            expect(newState.lastWeightEvent).toBe(null)
        })
    })
})
