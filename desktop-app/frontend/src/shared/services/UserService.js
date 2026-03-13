/**
 * UserService - Service layer for User Management operations
 * 
 * Encapsulates all Wails API calls related to authentication and user management.
 */
export class UserService {
    /**
     * @param {Object} wails - Wails bindings object
     */
    constructor(wails) {
        this.wails = wails
    }

    /**
     * Login user
     * @param {string} username - Username
     * @param {string} password - Password
     * @returns {Promise<Object>} Login result with user data
     */
    async login(username, password) {
        if (!this.wails || !this.wails.Login) {
            console.error('❌ [UserService] Wails binding missing. Available keys:', this.wails ? Object.keys(this.wails) : 'null')
            throw new Error('Wails binding not available')
        }
        const result = await this.wails.Login(username, password)
        return JSON.parse(result)
    }

    /**
     * Logout current user
     * @param {Object} session - Current user session object
     * @returns {Promise<void>}
     */
    async logout(session) {
        if (!this.wails || !this.wails.Logout) {
            console.warn('Wails binding not available for logout')
            return
        }

        // Pass session as JSON string to backend
        const sessionJSON = JSON.stringify(session)
        await this.wails.Logout(sessionJSON)
    }

    /**
     * Get current authenticated user
     * @returns {Promise<Object>} Current user data
     */
    async getCurrentUser() {
        if (!this.wails || !this.wails.GetCurrentUser) {
            console.error('❌ [UserService] GetCurrentUser binding missing. Available keys:', this.wails ? Object.keys(this.wails) : 'null')
            throw new Error('Wails binding not available')
        }
        const result = await this.wails.GetCurrentUser()
        return JSON.parse(result)
    }

    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {Object} data - Updated profile data
     * @returns {Promise<Object>} Updated user object
     */
    async updateProfile(userId, data) {
        const result = await this.wails.UpdateUserProfile(userId, JSON.stringify(data))
        return JSON.parse(result)
    }

    /**
     * Change user password
     * @param {string} userId - User ID
     * @param {string} oldPassword - Current password
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} Success status
     */
    async changePassword(userId, oldPassword, newPassword) {
        const result = await this.wails.ChangePassword(userId, oldPassword, newPassword)
        return JSON.parse(result)
    }

    /**
     * List all users (admin only)
     * @returns {Promise<Array>} List of users
     */
    async listUsers() {
        const result = await this.wails.GetUsers()
        return JSON.parse(result)
    }

    /**
     * Create new user (admin only)
     * @param {Object} data - User data
     * @returns {Promise<Object>} Created user object
     */
    async createUser(data) {
        const result = await this.wails.CreateUser(JSON.stringify(data))
        return JSON.parse(result)
    }

    /**
     * Update user (admin only)
     * @param {string} userId - User ID
     * @param {Object} data - Updated user data
     * @returns {Promise<Object>} Updated user object
     */
    async updateUser(userId, data) {
        const result = await this.wails.UpdateUser(userId, JSON.stringify(data))
        return JSON.parse(result)
    }

    /**
     * Delete user (admin only)
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUser(userId) {
        await this.wails.DeleteUser(userId)
        return true
    }
}
