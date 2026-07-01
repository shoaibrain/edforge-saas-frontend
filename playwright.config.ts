import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const shouldStartServer = process.env.PLAYWRIGHT_START_SERVER === '1'

// E2E_CAPTURE=1 forces full recording (trace + video + screenshots) for every
// test — for a proof/debug run whose artifacts an operator reviews in the
// trace viewer / HTML report (see docs/testing/agent-e2e-guide.md, "Watching
// the browser"). Default stays lean (on-failure only) so CI is fast.
const capture = process.env.E2E_CAPTURE === '1'

// Vercel Deployment Protection guards Preview URLs behind a Vercel login wall.
// When targeting a protected Preview, pass the project's automation-bypass secret
// (Vercel → Project → Settings → Deployment Protection → Protection Bypass for
// Automation) so Playwright requests clear the wall. No-op for local runs.
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
const bypassHeaders = vercelBypassSecret
  ? {
      'x-vercel-protection-bypass': vercelBypassSecret,
      'x-vercel-set-bypass-cookie': 'true',
    }
  : undefined

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: capture ? 'on' : 'retain-on-failure',
    video: capture ? 'on' : 'retain-on-failure',
    screenshot: capture ? 'on' : 'only-on-failure',
    ...(bypassHeaders ? { extraHTTPHeaders: bypassHeaders } : {}),
    // Sandboxed agent environments ship a pre-installed Chromium whose
    // revision may not match this Playwright version and forbid downloads —
    // point PLAYWRIGHT_CHROMIUM_PATH at it (e.g. /opt/pw-browsers/chromium).
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  projects: [
    // Default project — existing invocations (test:e2e, test:e2e:visual,
    // env-gated suites) keep working unchanged. Includes the @seed harness
    // because the test agents' planner/generator setup runs it here.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // PR gate: critical-path tests only (tagged @smoke, mocked API, fast).
    {
      name: 'smoke',
      use: { ...devices['Desktop Chrome'] },
      grep: /@smoke/,
      grepInvert: /@seed/,
    },
    // Nightly / on-demand: everything except the agent seed harness.
    {
      name: 'full',
      use: { ...devices['Desktop Chrome'] },
      grepInvert: /@seed/,
    },
  ],
  webServer: shouldStartServer
    ? {
        command: 'pnpm dev:mvp',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
})
