/**
 * AuditService - Service layer for Audit Log operations
 *
 * Encapsulates all Wails API calls related to audit logs.
 */
export class AuditService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Get recent audit logs with pagination
     * @param {number} limit - Maximum number of logs to retrieve
     * @param {number} offset - Number of records to skip for pagination
     * @returns {Promise<Object>} Object containing logs array and total count
     */
    async getRecentAuditLogs(limit = 10, offset = 0) {
        if (!this.wails || !this.wails.GetRecentAuditLogs) {
            console.error('❌ [AuditService] GetRecentAuditLogs binding missing. Available keys:', this.wails ? Object.keys(this.wails) : 'null')
            throw new Error('Wails binding not available')
        }
        const result = await this.wails.GetRecentAuditLogs(limit, offset)
        return JSON.parse(result)
    }
}
