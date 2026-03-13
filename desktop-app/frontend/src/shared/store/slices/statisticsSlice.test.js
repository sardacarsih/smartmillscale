import { describe, it, expect, beforeEach, vi } from 'vitest'
import { create } from 'zustand'
import { createStatisticsSlice } from './statisticsSlice.js'

describe('statisticsSlice - Slice Statistik', () => {
    let store

    beforeEach(() => {
        vi.clearAllMocks()

        // Create a test store with only the statistics slice
        store = create((set, get) => ({
            ...createStatisticsSlice(set, get)
        }))
    })

    describe('State Awal', () => {
        it('harus memiliki statistik awal yang benar', () => {
            const state = store.getState()

            expect(state.statistics).toEqual({
                todayWeighings: 0,
                averageWeight: 0,
                maxWeight: 0,
                minWeight: 0,
                totalWeighings: 0
            })
        })
    })

    describe('updateStatistics', () => {
        it('harus update total weighings', () => {
            const state = store.getState()

            state.updateStatistics(12000)

            const newState = store.getState()
            expect(newState.statistics.totalWeighings).toBe(1)
        })

        it('harus update max weight', () => {
            const state = store.getState()

            state.updateStatistics(10000)
            state.updateStatistics(15000)
            state.updateStatistics(12000)

            const newState = store.getState()
            expect(newState.statistics.maxWeight).toBe(15000)
        })

        it('harus update min weight', () => {
            const state = store.getState()

            state.updateStatistics(15000)
            state.updateStatistics(10000)
            state.updateStatistics(12000)

            const newState = store.getState()
            expect(newState.statistics.minWeight).toBe(10000)
        })

        it('harus menghitung average weight dengan benar', () => {
            const state = store.getState()

            state.updateStatistics(10000)
            state.updateStatistics(20000)
            state.updateStatistics(30000)

            const newState = store.getState()
            expect(newState.statistics.averageWeight).toBe(20000)
        })

        it('harus menangani single weighing untuk average', () => {
            const state = store.getState()

            state.updateStatistics(15000)

            const newState = store.getState()
            expect(newState.statistics.averageWeight).toBe(15000)
        })

        it('harus menangani multiple updates secara akurat', () => {
            const state = store.getState()

            // Simulate 5 weighings
            const weights = [10000, 12000, 15000, 11000, 13000]
            weights.forEach(weight => state.updateStatistics(weight))

            const newState = store.getState()

            expect(newState.statistics.totalWeighings).toBe(5)
            expect(newState.statistics.maxWeight).toBe(15000)
            expect(newState.statistics.minWeight).toBe(10000)

            // Average should be (10000 + 12000 + 15000 + 11000 + 13000) / 5 = 12200
            expect(newState.statistics.averageWeight).toBe(12200)
        })
    })

    describe('resetStatistics', () => {
        it('harus reset semua statistik ke nilai awal', () => {
            const state = store.getState()

            // Add some statistics
            state.updateStatistics(10000)
            state.updateStatistics(20000)
            state.updateStatistics(30000)

            // Reset
            state.resetStatistics()

            const newState = store.getState()
            expect(newState.statistics).toEqual({
                todayWeighings: 0,
                averageWeight: 0,
                maxWeight: 0,
                minWeight: 0,
                totalWeighings: 0
            })
        })
    })

    describe('Edge Cases', () => {
        it('harus menangani weight 0 dengan benar', () => {
            const state = store.getState()

            state.updateStatistics(0)

            const newState = store.getState()
            expect(newState.statistics.totalWeighings).toBe(1)
            expect(newState.statistics.minWeight).toBe(0)
        })

        it('harus menangani banyak updates tanpa overflow', () => {
            const state = store.getState()

            // Simulate 1000 weighings
            for (let i = 1; i <= 1000; i++) {
                state.updateStatistics(10000 + i * 10)
            }

            const newState = store.getState()
            expect(newState.statistics.totalWeighings).toBe(1000)
            expect(newState.statistics.maxWeight).toBe(20000)
            expect(newState.statistics.minWeight).toBe(10010)
        })
    })
})
