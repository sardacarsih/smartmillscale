import { test, expect } from '@playwright/test'

export const desktopViewports = [
  { name: '1280x720', size: { width: 1280, height: 720 } },
  { name: '1366x768', size: { width: 1366, height: 768 } },
  { name: '1440x900', size: { width: 1440, height: 900 } },
  { name: '1536x864', size: { width: 1536, height: 864 } },
  { name: '1920x1080', size: { width: 1920, height: 1080 } }
]

export function createRoleUser({ id, username, fullName, email, role }) {
  const timestamp = new Date().toISOString()
  return {
    id,
    username,
    fullName,
    email,
    role,
    active: true,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

export function createTestSession(userId, sessionId, token) {
  return {
    id: sessionId,
    userId,
    loginTime: new Date().toISOString(),
    token,
    deviceId: 'e2e-desktop-layout',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  }
}

export async function loginWithCredentials(page, { username, password, dashboardHeading }) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Smart Mill Scale' })).toBeVisible()

  await page.locator('input[name="username"]').fill(username)
  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()

  await expect(page.locator('#user-menu-button')).toBeVisible({ timeout: 15000 })
  await expectPageHeading(page, dashboardHeading)
}

export async function bootstrapDevRoleSession(page, { user, session, dashboardHeading, initialPage = 'dashboard' }) {
  await page.goto('/')
  await page.waitForFunction(() => Boolean(window.__SMART_MILL_TEST_HOOKS__))

  await page.evaluate(({ nextUser, nextSession, pageName }) => {
    window.__SMART_MILL_TEST_HOOKS__.setAuthenticatedUser({
      user: nextUser,
      session: nextSession,
      page: pageName
    })
  }, {
    nextUser: user,
    nextSession: session,
    pageName: initialPage
  })

  await expect(page.locator('#user-menu-button')).toBeVisible({ timeout: 15000 })
  await expectPageHeading(page, dashboardHeading)
  await page.waitForFunction(() => window.__SMART_MILL_TEST_HOOKS__.isServicesInitialized())
}

export function defineAuthenticatedLayoutSmokeSuite({ describeTitle, testNamePrefix, pages, bootstrap }) {
  test.describe(describeTitle, () => {
    for (const viewport of desktopViewports) {
      test(`${testNamePrefix} at ${viewport.name}`, async ({ page }) => {
        test.setTimeout(120000)

        await page.setViewportSize(viewport.size)
        await bootstrap(page)

        for (const targetPage of pages) {
          await navigateThroughUserMenu(page, targetPage.menuLabel)
          await expectPageHeading(page, targetPage.heading)
          await expectDesktopLayoutFit(page, `${targetPage.menuLabel} @ ${viewport.name}`)
        }
      })
    }
  })
}

async function openUserMenu(page) {
  const userMenuButton = page.locator('#user-menu-button')
  await expect(userMenuButton).toBeVisible()
  await userMenuButton.click()
  await expect(page.getByRole('menu')).toBeVisible()
}

async function navigateThroughUserMenu(page, menuLabel) {
  await openUserMenu(page)
  await page.getByRole('menuitem', { name: menuLabel }).click()
  await expectAppNotToCrash(page, `after navigating to "${menuLabel}"`)
}

async function expectPageHeading(page, heading) {
  await expectAppNotToCrash(page, `before asserting heading "${String(heading)}"`)

  if (heading instanceof RegExp) {
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 15000 })
    return
  }

  await expect(page.getByRole('heading', { name: heading, exact: true }).first()).toBeVisible({ timeout: 15000 })
}

async function expectDesktopLayoutFit(page, pageName) {
  await expect(page.locator('#user-menu-button')).toBeVisible()

  const layoutMetrics = await page.evaluate(() => {
    const root = document.documentElement
    const body = document.body
    const scrollWidth = Math.max(root.scrollWidth, body.scrollWidth)
    const scrollHeight = Math.max(root.scrollHeight, body.scrollHeight)

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      scrollWidth,
      scrollHeight,
      horizontalOverflow: scrollWidth - window.innerWidth
    }
  })

  expect(
    layoutMetrics.horizontalOverflow,
    `${pageName} has page-level horizontal overflow at ${layoutMetrics.innerWidth}x${layoutMetrics.innerHeight}. scrollWidth=${layoutMetrics.scrollWidth}`
  ).toBeLessThanOrEqual(2)

  expect(layoutMetrics.scrollHeight, `${pageName} did not render page content`).toBeGreaterThan(0)
}

async function expectAppNotToCrash(page, context) {
  const errorBoundaryHeading = page.getByRole('heading', { name: 'Terjadi Kesalahan' })
  await expect(errorBoundaryHeading, `App crashed ${context}`).not.toBeVisible({ timeout: 5000 })
}
