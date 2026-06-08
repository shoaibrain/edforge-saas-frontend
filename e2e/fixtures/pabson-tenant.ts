import { expect, type Page } from '@playwright/test'

export const PABSON_VISUAL_ROUTES = [
  { name: 'shell-home', path: '/home' },
  { name: 'people-staff', path: '/people/staff' },
  { name: 'academics-overview', path: '/academics' },
  { name: 'finance-overview', path: '/finance' },
  { name: 'settings-workspace', path: '/settings/workspace' },
] as const

export type VisualTheme = 'light' | 'dark'

export const PABSON_VISUAL_USER = {
  id: 'visual-pabson-admin',
  email: 'visual-admin@pabson.edforge.local',
  displayName: 'PABSON Visual Admin',
  firstName: 'PABSON',
  lastName: 'Admin',
  tenantId: 'tenant-pabson-visual',
  globalRole: 'TenantAdmin',
  assignments: {
    'school-pabson-visual': 'Principal',
  },
}

export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const consoleErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })
  page.on('pageerror', (error) => {
    consoleErrors.push(error.message)
  })
  return consoleErrors
}

export async function seedPabsonVisualSession(page: Page, theme: VisualTheme): Promise<void> {
  await page.context().addCookies([
    {
      name: 'edforge-auth',
      value: encodeURIComponent(
        JSON.stringify({
          state: {
            user: PABSON_VISUAL_USER,
            isAuthenticated: true,
            tenantName: 'PABSON Visual School',
            tenantTier: 'pilot',
          },
          version: 0,
        })
      ),
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    {
      name: 'edforge-app',
      value: encodeURIComponent(
        JSON.stringify({
          state: {
            activeSchoolId: 'school-pabson-visual',
            activeSchoolStatus: 'active',
            sidebarCollapsed: false,
            theme,
          },
          version: 0,
        })
      ),
      domain: 'localhost',
      path: '/',
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ])

  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem(
      'edforge-theme',
      JSON.stringify({ state: { theme: selectedTheme }, version: 0 })
    )
    document.documentElement.classList.toggle('dark', selectedTheme === 'dark')
    document.documentElement.style.colorScheme = selectedTheme
  }, theme)
}

export async function expectNoConsoleErrors(consoleErrors: string[]): Promise<void> {
  expect(consoleErrors, consoleErrors.join('\n')).toHaveLength(0)
}
