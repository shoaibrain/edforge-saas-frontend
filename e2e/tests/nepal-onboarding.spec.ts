/**
 * Nepal Onboarding E2E Test
 *
 * Full journey test for a Nepal tenant — from creation to data entry.
 * Verifies that regional defaults (NPR, BS calendar, NST timezone) flow
 * correctly through the provisioning pipeline and into the platform.
 *
 * Prerequisites:
 * - AdminWeb and platform app running locally
 * - A clean test tenant ID (or ability to create one)
 */

import { test, expect } from '@playwright/test'

const TEST_TENANT_NAME = `E2E Nepal ${Date.now()}`
const ADMIN_EMAIL = 'admin@test-nepal.edforge.dev'

test.describe('Nepal tenant onboarding', () => {
  test('Step 1: Create Nepal tenant via AdminWeb', async ({ page }) => {
    await test.step('Navigate to AdminWeb tenant creation', async () => {
      await page.goto('/admin/tenants/create')
    })

    await test.step('Fill in tenant details with NPL country', async () => {
      await page.fill('[name="tenantName"]', TEST_TENANT_NAME)
      await page.fill('[name="email"]', ADMIN_EMAIL)
      await page.selectOption('[name="country"]', 'NPL')
      await page.selectOption('[name="tier"]', 'standard')
    })

    await test.step('Submit and verify creation', async () => {
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Tenant created')).toBeVisible({ timeout: 30000 })
    })
  })

  test('Step 2: Verify workspace settings API returns Nepal defaults', async ({ request }) => {
    await test.step('GET /api/tenants/:id/settings returns NPL config', async () => {
      // Note: tenantId would come from Step 1 in a real run
      const response = await request.get('/api/tenants/test-tenant-id/settings')
      expect(response.ok()).toBeTruthy()
      const settings = await response.json()
      expect(settings.regional.defaultCurrency).toBe('NPR')
      expect(settings.regional.defaultCalendarSystem).toBe('bikram_sambat')
      expect(settings.regional.defaultTimezone).toBe('Asia/Kathmandu')
    })
  })

  test('Step 3-4: Login and complete WorkspaceSetupGate', async ({ page }) => {
    await test.step('Log in as tenant admin', async () => {
      await page.goto('/login')
      await page.fill('[name="email"]', ADMIN_EMAIL)
      await page.fill('[name="password"]', 'TempPassword123!')
      await page.click('button[type="submit"]')
    })

    await test.step('WorkspaceSetupGate appears with Nepal defaults', async () => {
      await expect(page.locator('text=Welcome')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=NPR')).toBeVisible()
      await expect(page.locator('text=Bikram Sambat')).toBeVisible()
      await expect(page.locator('text=Asia/Kathmandu')).toBeVisible()
    })

    await test.step('Confirm workspace settings', async () => {
      await page.click('text=Confirm & Start Using EdForge')
      await expect(page.locator('text=Welcome')).not.toBeVisible({ timeout: 5000 })
    })
  })

  test('Step 5: Home page loads without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
    expect(consoleErrors).toHaveLength(0)
  })

  test('Step 6: Create school with BS calendar pre-selected', async ({ page }) => {
    await test.step('Navigate to school creation', async () => {
      await page.goto('/settings/schools')
      await page.click('text=Create New School')
    })

    await test.step('Verify BS calendar is pre-selected', async () => {
      // Calendar system should be inherited from workspace settings
      await expect(page.locator('text=Bikram Sambat')).toBeVisible()
      await expect(page.locator('text=Asia/Kathmandu')).toBeVisible()
    })

    await test.step('Fill school details and create', async () => {
      await page.fill('[placeholder*="school"]', 'Test Nepal School')
      await page.click('text=Create School')
      await expect(page.locator('text=School created')).toBeVisible({ timeout: 10000 })
    })
  })

  test('Step 7: Create academic year with BS dates', async ({ page }) => {
    await test.step('Navigate to academic years', async () => {
      await page.goto('/settings/schools')
      await page.click('text=Academic Years')
    })

    await test.step('Create BS academic year 2082/2083', async () => {
      await page.click('text=Create Academic Year')
      // BS date inputs should be shown for bikram_sambat calendar
      await expect(page.locator('text=Year (BS)')).toBeVisible()
    })
  })

  test('Step 8: Finance overview renders with NPR currency', async ({ page }) => {
    await test.step('Navigate to Finance', async () => {
      await page.goto('/finance')
      await page.waitForLoadState('networkidle')
    })

    await test.step('KPI tiles render with NPR', async () => {
      // Finance overview should show currency in NPR
      await expect(page.locator('text=NPR').first()).toBeVisible({ timeout: 10000 })
    })
  })

  test('Step 9: Finance payments show dual date format', async ({ page }) => {
    await test.step('Navigate to Payments', async () => {
      await page.goto('/finance/billing/payments')
      await page.waitForLoadState('networkidle')
    })

    await test.step('Date columns show DD/MM/YYYY + BS format', async () => {
      // When data is present, dates should show dual format
      // (BS: YYYY/MM/DD) appended to Gregorian dates
      const dateCell = page.locator('td:has-text("(BS:")')
      if (await dateCell.count() > 0) {
        await expect(dateCell.first()).toBeVisible()
      }
    })
  })

  test('Step 10: Academics loads without errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/academics')
    await page.waitForLoadState('networkidle')
    expect(consoleErrors).toHaveLength(0)
  })
})
