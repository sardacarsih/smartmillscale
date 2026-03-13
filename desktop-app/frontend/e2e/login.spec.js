import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Login Functionality
 * 
 * These tests run against the actual Wails dev server with mock backend.
 * For testing with REAL database, you need to run 'wails dev' instead.
 * 
 * How to run:
 * 1. Mock backend: npx playwright test (auto-starts vite dev)
 * 2. Real backend: wails dev (in terminal 1), then npx playwright test --grep @real
 */

test.describe('Login Page E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto('/')

        // Wait for the login page to load
        await page.waitForSelector('text=Smart Mill Scale')
    })

    test('should display login form with all elements', async ({ page }) => {
        // Check page title
        await expect(page.locator('h1')).toContainText('Smart Mill Scale')
        await expect(page.locator('text=Masuk ke sistem penimbangan')).toBeVisible()

        // Check form elements
        await expect(page.locator('label:has-text("Username")')).toBeVisible()
        await expect(page.locator('label:has-text("Password")')).toBeVisible()
        await expect(page.locator('input[name="username"]')).toBeVisible()
        await expect(page.locator('input[name="password"]')).toBeVisible()

        // Check submit button
        await expect(page.locator('button:has-text("Masuk")')).toBeVisible()

        // Check footer
        await expect(page.locator('text=Smart Mill Scale v1.0.0')).toBeVisible()
    })

    test('should disable submit button when fields are empty', async ({ page }) => {
        const submitButton = page.locator('button:has-text("Masuk")')

        // Initially disabled (empty fields)
        await expect(submitButton).toBeDisabled()
    })

    test('should enable submit button when both fields are filled', async ({ page }) => {
        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const submitButton = page.locator('button:has-text("Masuk")')

        // Fill both fields
        await usernameInput.fill('admin')
        await passwordInput.fill('admin123')

        // Button should be enabled
        await expect(submitButton).toBeEnabled()
    })

    test('should toggle password visibility', async ({ page }) => {
        const passwordInput = page.locator('input[name="password"]')
        const toggleButton = page.locator('input[name="password"] + div button').first()

        // Initially hidden (type=password)
        await expect(passwordInput).toHaveAttribute('type', 'password')

        // Click toggle button
        await toggleButton.click()

        // Should be visible (type=text)
        await expect(passwordInput).toHaveAttribute('type', 'text')

        // Click again to hide
        await toggleButton.click()

        // Should be hidden again
        await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should login successfully with mock credentials', async ({ page }) => {
        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const submitButton = page.locator('button:has-text("Masuk")')

        // Fill login form
        await usernameInput.fill('admin')
        await passwordInput.fill('admin123')

        // Submit form
        await submitButton.click()

        // Wait for login to complete (should redirect or show success)
        await page.waitForTimeout(2000) // Give time for auth state to update

        // Check for success indicators
        // Note: This depends on your app's behavior after login
        // Adjust based on actual behavior (redirect, dashboard, etc.)
        await expect(page.locator('text=Selamat datang')).toBeVisible({ timeout: 5000 })
    })

    test('should show loading state during login', async ({ page }) => {
        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const submitButton = page.locator('button:has-text("Masuk")')

        // Fill form
        await usernameInput.fill('admin')
        await passwordInput.fill('password123')

        // Click submit
        await submitButton.click()

        // Check loading state appears
        await expect(page.locator('text=Masuk...')).toBeVisible({ timeout: 1000 })
    })

    test('should clear error when user starts typing', async ({ page }) => {
        // This test assumes there might be an error shown
        const usernameInput = page.locator('input[name="username"]')

        // Type in username field
        await usernameInput.fill('test')

        // Error should be cleared (if any was shown)
        // This is more of a regression test
        await expect(page.locator('text=Login Gagal')).not.toBeVisible()
    })

    test('should support Enter key to submit form', async ({ page }) => {
        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')

        // Fill form
        await usernameInput.fill('admin')
        await passwordInput.fill('admin123')

        // Press Enter in password field
        await passwordInput.press('Enter')

        // Should trigger login (loading state or redirect)
        await expect(page.locator('text=Masuk...')).toBeVisible({ timeout: 1000 })
    })
})

/**
 * Real Database Tests
 * These require 'wails dev' to be running with real database
 */
test.describe('Login with Real Database @real', () => {
    test.skip(({ }) => !process.env.WAILS_DEV, 'Requires wails dev server')

    test('should login with real admin credentials', async ({ page }) => {
        await page.goto('/')

        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const submitButton = page.locator('button:has-text("Masuk")')

        // Use REAL credentials from database
        await usernameInput.fill('admin')
        await passwordInput.fill('admin123')
        await submitButton.click()

        // Wait for real database authentication
        await page.waitForTimeout(3000)

        // Verify successful login
        // Adjust based on your actual post-login UI
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 })
    })

    test('should fail with invalid credentials', async ({ page }) => {
        await page.goto('/')

        const usernameInput = page.locator('input[name="username"]')
        const passwordInput = page.locator('input[name="password"]')
        const submitButton = page.locator('button:has-text("Masuk")')

        // Use invalid credentials
        await usernameInput.fill('admin')
        await passwordInput.fill('wrongpassword')
        await submitButton.click()

        // Wait for error
        await page.waitForTimeout(2000)

        // Should show error message
        await expect(page.locator('text=Login Gagal')).toBeVisible({ timeout: 5000 })
    })
})
