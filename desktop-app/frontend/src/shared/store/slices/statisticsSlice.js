export const createStatisticsSlice = (set, get) => ({
    // ============================================
    // ANALYTICS & STATISTICS
    // ============================================
    statistics: {
        todayWeighings: 0,
        averageWeight: 0,
        maxWeight: 0,
        minWeight: 0,
        totalWeighings: 0
    },

    // ============================================
    // ACTIONS - STATISTICS
    // ============================================

    updateStatistics: (weight) => {
        const { statistics } = get()

        const newStats = {
            ...statistics,
            totalWeighings: statistics.totalWeighings + 1,
            maxWeight: Math.max(statistics.maxWeight, weight),
            minWeight: statistics.minWeight === 0 ? weight : Math.min(statistics.minWeight, weight),
            averageWeight: ((statistics.averageWeight * statistics.totalWeighings) + weight) / (statistics.totalWeighings + 1)
        }

        set({ statistics: newStats })
    },

    resetStatistics: () => {
        set({
            statistics: {
                todayWeighings: 0,
                averageWeight: 0,
                maxWeight: 0,
                minWeight: 0,
                totalWeighings: 0
            }
        })
    }
})
