/**
 * SyncService - Service layer for Synchronization operations
 * 
 * Encapsulates all Wails API calls related to data synchronization.
 */
export class SyncService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Trigger manual synchronization
     * @param {Object} data - Sync configuration
     * @returns {Promise<Object>} Sync result
     */
    async triggerManualSync(data) {
        const result = await this.wails.TriggerManualSync(JSON.stringify(data))
        return JSON.parse(result)
    }

    /**
     * Get current sync status
     * @returns {Promise<Object>} Sync status
     */
    async getSyncStatus() {
        const result = await this.wails.GetSyncStatus()
        return JSON.parse(result)
    }

    /**
     * Get sync statistics
     * @returns {Promise<Object>} Sync statistics
     */
    async getSyncStatistics() {
        const result = await this.wails.GetSyncStatistics()
        return JSON.parse(result)
    }

    /**
     * Get sync queue items
     * @param {string} status - Filter by status ('pending', 'failed', 'completed')
     * @param {number} limit - Number of items to fetch
     * @returns {Promise<Array>} Queue items
     */
    async getSyncQueue(status = '', limit = 50) {
        const result = await this.wails.GetSyncQueue(status, limit)
        return JSON.parse(result)
    }

    /**
     * Retry failed sync items
     * @returns {Promise<Object>} Retry result
     */
    async retryFailedSyncs() {
        const result = await this.wails.RetryFailedSyncs()
        return JSON.parse(result)
    }
}
