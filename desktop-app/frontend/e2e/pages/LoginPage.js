/**
 * Login Page Object
 * 
 * Encapsulates all selectors and actions related to the login page
 * for better test maintainability and reusability.
 */
export class LoginPage {
    constructor(page) {
        this.page = page

        // Selectors
        this.usernameInput = page.locator('input[name="username"]')
        this.passwordInput = page.locator('input[name="password"]')
        this.submitButton = page.locator('button:has-text("Masuk")')
        this.passwordToggleButton = page.locator('input[name="password"] ~ button').first()
        this.errorMessage = page.locator('text=Login Gagal')
        this.loadingIndicator = page.locator('text=Masuk...')
        this.pageTitle = page.locator('h1:has-text("Smart Mill Scale")')
    }

    /**
     * Navigate to login page
     */
    async goto() {
        await this.page.goto('/')
        await this.pageTitle.waitFor()
    }

    /**
     * Fill username field
     */
    async fillUsername(username) {
        await this.usernameInput.fill(username)
    }

    /**
     * Fill password field
     */
    async fillPassword(password) {
        await this.passwordInput.fill(password)
    }

    /**
     * Click submit button
     */
    async submit() {
        await this.submitButton.click()
    }

    /**
     * Complete login flow
     */
    async login(username, password) {
        await this.fillUsername(username)
        await this.fillPassword(password)
        await this.submit()
    }

    /**
     * Toggle password visibility
     */
    async togglePasswordVisibility() {
        await this.passwordToggleButton.click()
    }

    /**
     * Check if submit button is enabled
     */
    async isSubmitEnabled() {
        return await this.submitButton.isEnabled()
    }

    /**
     * Wait for error message
     */
    async waitForError() {
        await this.errorMessage.waitFor({ timeout: 5000 })
    }

    /**
     * Wait for loading state
     */
    async waitForLoading() {
        await this.loadingIndicator.waitFor({ timeout: 2000 })
    }
}
