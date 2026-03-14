/**
 * PKSService - Service layer for PKS (Timbangan) operations
 * 
 * This service encapsulates all Wails API calls related to PKS/weighing operations.
 * Benefits:
 * - Centralized API interface
 * - Easy to mock for testing
 * - Type documentation via JSDoc
 * - Error handling in one place
 */
export class PKSService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Create Timbang1 transaction
     * @param {Object} data - Transaction data
     * @param {string} userId - User ID performing the action
     * @returns {Promise<Object>} Created transaction object
     */
    async createTimbang1(data, userId) {
        const tbsBlockDetails = Array.isArray(data.tbsBlocks)
            ? data.tbsBlocks
                .filter(item => item?.idBlok)
                .map(item => ({
                    idBlok: parseInt(item.idBlok, 10),
                    janjang: Number.isFinite(Number(item.janjang)) ? parseInt(item.janjang, 10) : 0,
                    brondolanKg: Number.isFinite(Number(item.brondolanKg)) ? parseFloat(item.brondolanKg) : 0,
                }))
            : []

        // Convert string fields to numbers for backend
        const requestData = {
            ...data,
            idProduk: data.idProduk ? parseInt(data.idProduk) : 0,
            idUnit: data.idUnit ? parseInt(data.idUnit) : 0,
            idSupplier: data.idSupplier ? parseInt(data.idSupplier) : null,
            idEstate: data.idEstate ? parseInt(data.idEstate) : null,
            idAfdeling: data.idAfdeling ? parseInt(data.idAfdeling) : null,
            idBlok: data.idBlok ? parseInt(data.idBlok) : null,
            tbsBlockDetails,
        }

        const result = await this.wails.CreateTimbang1(JSON.stringify(requestData), userId)
        return JSON.parse(result)
    }

    /**
     * Update Timbang2 transaction
     * @param {Object} data - Update data (noTransaksi, bruto2, tara2, netto2)
     * @param {string} userId - User ID performing the action
     * @returns {Promise<Object>} Updated transaction object
     */
    async updateTimbang2(data, userId) {
        const result = await this.wails.UpdateTimbang2(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Complete PKS transaction
     * @param {string} noTransaksi - Transaction number
     * @param {string} userId - User ID performing the action
     * @returns {Promise<Object>} Completed transaction object
     */
    async completeTransaction(noTransaksi, userId) {
        const result = await this.wails.CompletePKSTransaction(noTransaksi, userId)
        return JSON.parse(result)
    }

    /**
     * Get pending Timbang2 transactions
     * @param {number} limit - Number of records to fetch
     * @returns {Promise<Array>} List of pending transactions
     */
    async getPendingTimbang2(limit = 50) {
        const result = await this.wails.GetPendingTimbang2(limit)
        return JSON.parse(result)
    }

    /**
     * Get pending completion transactions
     * @param {number} limit - Number of records to fetch
     * @returns {Promise<Array>} List of pending transactions
     */
    async getPendingCompletion(limit = 50) {
        const result = await this.wails.GetPendingCompletion(limit)
        return JSON.parse(result)
    }

    /**
     * Get PKS statistics
     * @param {number} days - Number of days to fetch stats for
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics(days = 30) {
        const result = await this.wails.GetPKSStatistics(days)
        return JSON.parse(result)
    }

    /**
     * Search PKS transactions
     * @param {Object} filters - Search filters
     * @returns {Promise<Object>} Search results
     */
    async searchTransactions(filters) {
        const result = await this.wails.SearchPKSTimbangans(JSON.stringify({
            ...filters,
            limit: filters.limit || 20,
            offset: filters.offset || 0
        }))
        return JSON.parse(result)
    }

    /**
     * Get transaction by transaction number
     * @param {string} noTransaksi - Transaction number
     * @returns {Promise<Object>} Transaction object
     */
    async getTransactionByNoTransaksi(noTransaksi) {
        const result = await this.wails.GetPKSTimbanganByNoTransaksi(noTransaksi)
        return JSON.parse(result)
    }

    /**
     * Print ticket
     * @param {number} timbanganId - Timbangan ID
     * @param {number} copies - Number of copies
     * @param {string} userId - Operator user ID
     * @returns {Promise<Object>} Print response
     */
    async printTicket(timbanganId, copies = 1, userId) {
        const result = await this.wails.PrintTicket(JSON.stringify({
            timbanganId,
            copies,
            isReprint: false,
            operatorId: userId
        }))
        return JSON.parse(result)
    }

    /**
     * Reprint ticket
     * @param {number} timbanganId - Timbangan ID
     * @param {string} userId - Operator user ID
     * @returns {Promise<Object>} Print response
     */
    async reprintTicket(timbanganId, userId) {
        const result = await this.wails.PrintTicket(JSON.stringify({
            timbanganId,
            copies: 1,
            isReprint: true,
            operatorId: userId
        }))
        return JSON.parse(result)
    }

    /**
     * Get ticket print history
     * @param {number} limit - Number of records
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} Ticket history
     */
    async getTicketHistory(limit = 10, offset = 0) {
        const result = await this.wails.GetTicketHistory(limit, offset)
        return JSON.parse(result)
    }

    /**
     * Get print statistics
     * @param {number} days - Number of days
     * @returns {Promise<Object>} Print statistics
     */
    async getPrintStatistics(days = 30) {
        const result = await this.wails.GetPrintStatistics(days)
        return JSON.parse(result)
    }
}
