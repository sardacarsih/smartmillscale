# E2E Testing with Playwright

Playwright E2E tests for Smart Mill Scale Wails desktop application.

## 📁 Structure

```
e2e/
├── pages/           # Page Object Models
│   └── LoginPage.js
├── login.spec.js    # Login tests
└── README.md        # This file
```

## 🚀 Running Tests

### Quick Start

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Test Modes

#### 1. **Mock Mode** (Default - Fast)
Tests run against Vite dev server with mock backend:
```bash
npm run test:e2e
```
- ✅ Fast execution
- ✅ No database required
- ✅ Auto-starts dev server
- ❌ Uses mock data

#### 2. **Real Database Mode** (Integration)
Tests run against real Wails backend:
```bash
# Terminal 1: Start Wails
wails dev

# Terminal 2: Run tagged tests
WAILS_DEV=true npx playwright test --grep @real
```
- ✅ Real database testing
- ✅ Full authentication flow
- ⚠️ Slower execution
- ⚠️ Requires Wails dev running

## 📝 Writing Tests

### Basic Test Structure

```javascript
import { test, expect } from '@playwright/test'

test.describe('Feature Tests', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/')
    // ... test steps
  })
})
```

### Using Page Objects

```javascript
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page)
  
  await loginPage.goto()
  await loginPage.login('admin', 'admin123')
  
  // Assertions
  await expect(page).toHaveURL(/dashboard/)
})
```

## 🎯 Test Categories

### UI Tests
Test visual elements and interactions:
- Form rendering
- Button states
- Input validation
- Visual feedback

### Integration Tests  
Test with real backend (tagged `@real`):
- Real database authentication
- Actual API calls
- Complete user flows

### Smoke Tests
Critical path testing:
- Login flow
- Main navigation
- Core features
- Desktop viewport fit across authenticated admin pages

## Desktop Layout Smoke Coverage

The desktop responsiveness smoke suite lives in `e2e/desktop-layout-smoke.spec.js`.

It logs in as `admin`, navigates through the authenticated admin pages from the user menu, and verifies:
- the page heading is visible
- the authenticated shell remains usable
- there is no page-level horizontal overflow at common PC/laptop sizes

Run it directly:

```bash
npx playwright test e2e/desktop-layout-smoke.spec.js
```

Run one viewport case by name:

```bash
npx playwright test e2e/desktop-layout-smoke.spec.js --grep "1366x768"
```

The supervisor coverage lives in `e2e/supervisor-layout-smoke.spec.js` and uses a dev-only app test hook to inject a supervisor session without depending on the mock login response.

```bash
npx playwright test e2e/supervisor-layout-smoke.spec.js
```

The same dev-only hook is used for the remaining role-specific desktop smoke suites:

```bash
npx playwright test e2e/timbangan-layout-smoke.spec.js
npx playwright test e2e/grading-layout-smoke.spec.js
```

## 📊 Test Reports

After running tests, view detailed reports:

```bash
npm run test:e2e:report
```

Reports include:
- Test results
- Screenshots (on failure)
- Videos (on failure)
- Traces (on retry)

## 🔧 Configuration

Configuration in `playwright.config.js`:

```javascript
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
})
```

## 🐛 Debugging

### Method 1: UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
Features:
- Watch mode
- Time travel debugging
- DOM snapshots
- Network inspection

### Method 2: Debug Mode
```bash
npm run test:e2e:debug
```
Opens Playwright Inspector for step-by-step debugging.

### Method 3: Browser DevTools
```bash
npm run test:e2e:headed
```
Add `await page.pause()` in test to pause execution.

## 📖 Best Practices

### 1. Use Page Objects
```javascript
// ✅ Good - reusable
const loginPage = new LoginPage(page)
await loginPage.login('admin', 'password')

// ❌ Bad - brittle
await page.fill('input[name="username"]', 'admin')
await page.fill('input[name="password"]', 'password')
```

### 2. Wait for Elements
```javascript
// ✅ Good - explicit wait
await page.locator('text=Dashboard').waitFor()

// ❌ Bad - arbitrary timeout
await page.waitForTimeout(5000)
```

### 3. Use Data Attributes
```javascript
// ✅ Good - stable selector
await page.locator('[data-testid="login-button"]').click()

// ❌ Bad - fragile selector
await page.locator('div > button.btn-primary').click()
```

### 4. Tag Real DB Tests
```javascript
// Tag tests that need real backend
test.describe('Login @real', () => {
  test.skip(() => !process.env.WAILS_DEV, 'Needs wails dev')
  
  test('should authenticate', async ({ page }) => {
    // Real database test
  })
})
```

## 🔍 Selectors Guide

### Priority Order
1. `data-testid` - Best for testing
2. `role` - Accessibility-friendly
3. `text` - User-facing
4. `id`/`name` - Semantic
5. `class` - Last resort

### Examples
```javascript
// By test ID (best)
page.locator('[data-testid="username-input"]')

// By role (accessible)
page.locator('button[role="button"]')

// By text (user-facing)
page.locator('text=Masuk')

// By label (form fields)
page.locator('input[name="username"]')

// By CSS (avoid if possible)
page.locator('.login-button')
```

## 🎨 Visual Testing

Playwright supports screenshot comparison:

```javascript
test('should match screenshot', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('login-page.png')
})
```

## ⚡ Performance Tips

1. **Run in parallel:** Tests run in parallel by default
2. **Use fixtures:** Share setup between tests
3. **Selective testing:** Use `--grep` to run specific tests
4. **Headless mode:** Faster without browser UI

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Selectors Guide](https://playwright.dev/docs/selectors)

## 🎯 Common Commands

```bash
# Run specific test file
npx playwright test e2e/login.spec.js

# Run tests matching pattern
npx playwright test --grep "login"

# Run in specific browser
npx playwright test --project=chromium

# Update snapshots
npx playwright test --update-snapshots

# Generate test code
npx playwright codegen http://localhost:5173
```
