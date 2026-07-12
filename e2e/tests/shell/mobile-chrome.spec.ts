// spec: docs/responsiveness-sprint-plan.md (R3 → shipped as mobile-native shell P1)
// seed: e2e/tests/seed.spec.ts
//
// Phone chrome (< 640px): app bar + RBAC-derived bottom tab bar + L2 pill
// row replace the desktop header/sidebar. The tab bar derives from
// sidebar-modules.ts through the same can() path as the desktop sidebar, so
// the rbac-sidebar matrix must hold here too (Teacher: no Finance tab).

import { test, expect } from '../../fixtures/test'

const PHONE = { width: 375, height: 812 }

test.describe('Mobile chrome — TenantAdmin', () => {
  test.use({ role: 'TenantAdmin', viewport: PHONE })

  test('phone home shows the tab bar, no desktop sidebar, no horizontal overflow @smoke', async ({
    page,
  }) => {
    await page.goto('/home')

    // Bottom tab bar with the full admin tab set
    const tabbar = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(tabbar).toBeVisible()
    for (const label of ['Home', 'Academics', 'People', 'Finance', 'Settings']) {
      await expect(tabbar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }

    // Home is the active tab
    await expect(
      tabbar.getByRole('link', { name: 'Home', exact: true })
    ).toHaveAttribute('aria-current', 'page')

    // Desktop sidebar does not render on phone
    await expect(
      page.getByRole('navigation', { name: 'Sidebar navigation' })
    ).toHaveCount(0)

    // App bar right zone: account trigger
    await expect(page.getByRole('button', { name: 'Account' })).toBeVisible()

    // No horizontal viewport scroll
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('tab tap opens the module root with L2 pills and a titled app bar @smoke', async ({
    page,
  }) => {
    await page.goto('/home')
    const tabbar = page.getByRole('navigation', { name: 'Main navigation' })

    await tabbar.getByRole('link', { name: 'Academics', exact: true }).click()
    await expect(page).toHaveURL(/\/academics$/)

    // Active tab moved
    await expect(
      tabbar.getByRole('link', { name: 'Academics', exact: true })
    ).toHaveAttribute('aria-current', 'page')

    // L2 pill rail carries the module's page list
    const l2 = page.getByRole('navigation', { name: 'Academics' })
    await expect(l2).toBeVisible()
    await expect(l2.getByRole('link', { name: /Overview/ })).toBeVisible()
    await expect(l2.getByRole('link', { name: /Students/ })).toBeVisible()

    // App bar shows the module title
    const appbar = page.getByRole('banner')
    await expect(appbar.getByText('Academics', { exact: true })).toBeVisible()
  })

  test('avatar opens the account sheet; Esc closes and restores focus @smoke', async ({
    page,
  }) => {
    await page.goto('/home')

    const avatar = page.getByRole('button', { name: 'Account' })
    await avatar.click()

    const sheet = page.getByRole('dialog', { name: 'Account' })
    await expect(sheet).toBeVisible()
    await expect(sheet.getByText('Sign out')).toBeVisible()
    await expect(sheet.getByRole('radiogroup', { name: 'Appearance' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
    await expect(avatar).toBeFocused()
  })
})

test.describe('Mobile chrome — Teacher RBAC parity', () => {
  test.use({ role: 'Teacher', viewport: PHONE })

  test('Teacher has no Finance tab on phone @smoke', async ({ page }) => {
    await page.goto('/home')

    const tabbar = page.getByRole('navigation', { name: 'Main navigation' })
    await expect(tabbar).toBeVisible()
    for (const label of ['Home', 'Academics', 'People', 'Settings']) {
      await expect(tabbar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    await expect(
      tabbar.getByRole('link', { name: 'Finance', exact: true })
    ).toHaveCount(0)
  })
})
