/**
 * DashboardService - Service layer for Dashboard operations
 * 
 * Encapsulates all Wails API calls related to dashboard metrics and health monitoring.
 */
export class DashboardService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Get dashboard data for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Dashboard configuration
     */
    async getDashboardData(userId) {
        const result = await this.wails.GetDashboardData(userId)
        return JSON.parse(result)
    }

    /**
     * Get metrics data
     * @param {string} userId - User ID
     * @param {string} role - User role
     * @returns {Promise<Object>} Metrics data
     */
    async getMetricsData(userId, role) {
        const result = await this.wails.GetMetricsData(userId, role || '')
        const data = JSON.parse(result)
        return data.metrics
    }

    /**
     * Get sync metrics
     * @returns {Promise<Object>} Sync metrics
     */
    async getSyncMetrics() {
        const result = await this.wails.GetSyncMetrics()
        return JSON.parse(result)
    }

    /**
     * Get system health status
     * @returns {Promise<Object>} System health data
     */
    async getSystemHealth() {
        const result = await this.wails.GetSystemHealth()
        return JSON.parse(result)
    }

    /**
     * Get specific service health
     * @param {string} serviceName - Name of service to check
     * @returns {Promise<Object>} Service health data
     */
    async getServiceHealth(serviceName) {
        const result = await this.wails.GetServiceHealth(serviceName)
        return JSON.parse(result)
    }
}
