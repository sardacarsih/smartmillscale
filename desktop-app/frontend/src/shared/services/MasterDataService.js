/**
 * MasterDataService - Service layer for Master Data CRUD operations
 * 
 * Encapsulates all Wails API calls for managing master data entities.
 */
export class MasterDataService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    // ========== PRODUCTS ==========

    /**
     * Get all products
     * @param {boolean} activeOnly - Filter active products only
     * @returns {Promise<Array>} List of products
     */
    async getProducts(activeOnly = true) {
        const result = await this.wails.GetProducts(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Create product
     * @param {Object} data - Product data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created product
     */
    async createProduct(data, userId) {
        const result = await this.wails.CreateProduct(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update product
     * @param {number} id - Product ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated product
     */
    async updateProduct(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateProduct(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete product
     * @param {number} id - Product ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteProduct(id, userId) {
        await this.wails.DeleteProduct(String(id), userId)
        return true
    }

    // ========== UNITS/VEHICLES ==========

    /**
     * Get all units/vehicles
     * @param {boolean} activeOnly - Filter active units only
     * @returns {Promise<Array>} List of units
     */
    async getUnits(activeOnly = true) {
        const result = await this.wails.GetUnits(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Create unit
     * @param {Object} data - Unit data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created unit
     */
    async createUnit(data, userId) {
        const result = await this.wails.CreateUnit(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update unit
     * @param {number} id - Unit ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated unit
     */
    async updateUnit(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateUnit(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete unit
     * @param {number} id - Unit ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUnit(id, userId) {
        await this.wails.DeleteUnit(String(id), userId)
        return true
    }

    // ========== SUPPLIERS ==========

    /**
     * Get all suppliers
     * @param {boolean} activeOnly - Filter active suppliers only
     * @returns {Promise<Array>} List of suppliers
     */
    async getSuppliers(activeOnly = true) {
        const result = await this.wails.GetSuppliers(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Create supplier
     * @param {Object} data - Supplier data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created supplier
     */
    async createSupplier(data, userId) {
        const result = await this.wails.CreateSupplier(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update supplier
     * @param {number} id - Supplier ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated supplier
     */
    async updateSupplier(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateSupplier(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete supplier
     * @param {number} id - Supplier ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSupplier(id, userId) {
        await this.wails.DeleteSupplier(String(id), userId)
        return true
    }

    // ========== ESTATES ==========

    /**
     * Get all estates
     * @param {boolean} activeOnly - Filter active estates only
     * @returns {Promise<Array>} List of estates
     */
    async getEstates(activeOnly = true) {
        const result = await this.wails.GetEstates(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Create estate
     * @param {Object} data - Estate data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created estate
     */
    async createEstate(data, userId) {
        const result = await this.wails.CreateEstate(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update estate
     * @param {number} id - Estate ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated estate
     */
    async updateEstate(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateEstate(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete estate
     * @param {number} id - Estate ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteEstate(id, userId) {
        await this.wails.DeleteEstate(String(id), userId)
        return true
    }

    // ========== AFDELING ==========

    /**
     * Get all afdelings
     * @param {boolean} activeOnly - Filter active afdelings only
     * @returns {Promise<Array>} List of afdelings
     */
    async getAfdelings(activeOnly = true) {
        const result = await this.wails.GetAfdelings(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Get afdelings by estate ID
     * @param {number} estateId - Estate ID
     * @returns {Promise<Array>} List of afdelings
     */
    async getAfdelingsByEstate(estateId) {
        const result = await this.wails.GetAfdelingsByEstate(String(estateId), true)
        return JSON.parse(result)
    }

    /**
     * Create afdeling
     * @param {Object} data - Afdeling data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created afdeling
     */
    async createAfdeling(data, userId) {
        const result = await this.wails.CreateAfdeling(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update afdeling
     * @param {number} id - Afdeling ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated afdeling
     */
    async updateAfdeling(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateAfdeling(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete afdeling
     * @param {number} id - Afdeling ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteAfdeling(id, userId) {
        await this.wails.DeleteAfdeling(String(id), userId)
        return true
    }

    // ========== BLOK ==========

    /**
     * Get all bloks
     * @param {boolean} activeOnly - Filter active bloks only
     * @returns {Promise<Array>} List of bloks
     */
    async getBloks(activeOnly = true) {
        const result = await this.wails.GetBlok(activeOnly)
        return JSON.parse(result)
    }

    /**
     * Get bloks by afdeling ID
     * @param {number} afdelingId - Afdeling ID
     * @returns {Promise<Array>} List of bloks
     */
    async getBloksByAfdeling(afdelingId) {
        const result = await this.wails.GetBlokByAfdeling(String(afdelingId), true)
        return JSON.parse(result)
    }

    /**
     * Create blok
     * @param {Object} data - Blok data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Created blok
     */
    async createBlok(data, userId) {
        const result = await this.wails.CreateBlok(JSON.stringify(data), userId)
        return JSON.parse(result)
    }

    /**
     * Update blok
     * @param {number} id - Blok ID
     * @param {Object} data - Updated data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated blok
     */
    async updateBlok(id, data, userId) {
        const requestJSON = JSON.stringify({ id, request: data })
        const result = await this.wails.UpdateBlok(requestJSON, userId)
        return JSON.parse(result)
    }

    /**
     * Delete blok
     * @param {number} id - Blok ID
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteBlok(id, userId) {
        await this.wails.DeleteBlok(String(id), userId)
        return true
    }

    // ========== MASTER DATA SYNC ==========

    /**
     * Trigger master-data sync from server.
     * @param {Object} request - Sync request payload
     * @returns {Promise<Object>} Sync result
     */
    async triggerMasterDataSync(request = {}) {
        const payload = {
            triggerSource: request.triggerSource || 'manual',
            scope: Array.isArray(request.scope) && request.scope.length > 0
                ? request.scope
                : ['estate', 'afdeling', 'blok']
        }

        const result = await this.wails.TriggerMasterDataSync(JSON.stringify(payload))
        return JSON.parse(result)
    }

    /**
     * Get last master-data sync status.
     * @returns {Promise<Object>} Sync status
     */
    async getMasterDataSyncStatus() {
        const result = await this.wails.GetMasterDataSyncStatus()
        return JSON.parse(result)
    }
}
