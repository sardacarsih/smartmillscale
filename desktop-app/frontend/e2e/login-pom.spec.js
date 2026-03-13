import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage.js'

/**
 * E2E Tests using Page Object Model
 * Demonstrates clean, maintainable test structure
 */

test.describe('Login E2E with Page Objects', () => {
    let loginPage

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page)
        await loginPage.goto()
    })

    test('should display login page correctly', async () => {
        // Check page title is visible
        await expect(loginPage.pageTitle).toBeVisible()
    })

    test('should enable submit when form is filled', async ({ page }) => {
        // Initially disabled
        expect(await loginPage.isSubmitEnabled()).toBe(false)

        // Fill form
        await loginPage.fillUsername('admin')
        await loginPage.fillPassword('admin123')

        // Should be enabled
        expect(await loginPage.isSubmitEnabled()).toBe(true)
    })

    test('should toggle password visibility', async ({ page }) => {
        // Fill password
        await loginPage.fillPassword('secret123')

        // Initially hidden
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')

        // Toggle to show
        await loginPage.togglePasswordVisibility()
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'text')

        // Toggle to hide
        await loginPage.togglePasswordVisibility()
        await expect(loginPage.passwordInput).toHaveAttribute('type', 'password')
    })

    test('should login successfully with mock backend', async ({ page }) => {
        // Perform login
        await loginPage.login('admin', 'admin123')

        // Wait for loading indicator
        await loginPage.waitForLoading().catch(() => {
            // Loading might be too fast to catch
        })

        // Should redirect or show success
        await page.waitForTimeout(2000)

        // Check for success state (adjust based on your app)
        await expect(page.locator('text=Selamat datang')).toBeVisible({ timeout: 5000 })
    })

    test('should support keyboard navigation', async ({ page }) => {
        // Tab through form
        await page.keyboard.press('Tab') // Focus username
        await page.keyboard.type('admin')

        await page.keyboard.press('Tab') // Focus password  
        await page.keyboard.type('admin123')

        await page.keyboard.press('Enter') // Submit

        // Should trigger login
        await loginPage.waitForLoading().catch(() => { })
    })
})

/**
 * Real Database Integration Tests
 * Requires 'wails dev' to be running
 */
test.describe('Login with Real Database @real', () => {
    test.skip(() => !process.env.WAILS_DEV, 'Requires WAILS_DEV=true environment variable')

    let loginPage

    test.beforeEach(async ({ page }) => {
        loginPage = new LoginPage(page)
        await loginPage.goto()
    })

    test('should authenticate with real admin credentials', async ({ page }) => {
        // Use real database credentials
        await loginPage.login('admin', 'admin123')

        // Wait longer for real database
        await page.waitForTimeout(3000)

        // Verify successful authentication
        // Adjust selector based on your actual post-login state
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 })
    })

    test('should reject invalid credentials', async ({ page }) => {
        // Try with wrong password
        await loginPage.login('admin', 'wrongpassword')

        // Should show error
        await loginPage.waitForError()
        await expect(loginPage.errorMessage).toBeVisible()
    })

    test('should reject non-existent user', async ({ page }) => {
        // Try with non-existent user
        await loginPage.login('nonexistent', 'password123')

        // Should show error
        await loginPage.waitForError()
        await expect(loginPage.errorMessage).toContainText(/not found/i)
    })
})
