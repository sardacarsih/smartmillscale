import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Wails Desktop App E2E Testing
 * 
 * For Wails apps, we test via the dev server URL since Playwright
 * can't directly interact with native desktop windows in the same way.
 * The Wails dev mode runs the frontend in a webview that we can access
 * via http://localhost:5173
 */
export default defineConfig({
    // Test directory
    testDir: './e2e',

    // Maximum time one test can run
    timeout: 30 * 1000,

    // Run tests in files in parallel
    fullyParallel: true,

    // Fail the build on CI if you accidentally left test.only
    forbidOnly: !!process.env.CI,

    // Retry on CI only
    retries: process.env.CI ? 2 : 0,

    // Reporter to use
    reporter: [
        ['html', { outputFolder: 'playwright-report' }],
        ['list']
    ],

    // Shared settings for all projects
    use: {
        // Base URL for Wails dev server
        baseURL: 'http://localhost:5173',

        // Collect trace when retrying failed test
        trace: 'on-first-retry',

        // Screenshot on failure
        screenshot: 'only-on-failure',

        // Video on failure
        video: 'retain-on-failure',
    },

    // Configure projects for different browsers
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        // Uncomment for cross-browser testing
        // {
        //   name: 'firefox',
        //   use: { ...devices['Desktop Firefox'] },
        // },
        // {
        //   name: 'webkit',
        //   use: { ...devices['Desktop Safari'] },
        // },
    ],

    // Run Wails dev server before starting tests
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
})
