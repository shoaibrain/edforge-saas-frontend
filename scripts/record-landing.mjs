/**
 * record-landing.mjs — automated, professional-grade recorder for the EdForge
 * landing videos. Drives the running app on a fixed, smooth path and records
 * video directly (no manual screen recording, no paid tool).
 *
 * Produces two clips at 1600x1000 (16:10, matches the hero laptop frame):
 *   - hero.webm      : slow scroll DOWN then UP the Home dashboard (loops naturally)
 *   - district.webm  : Home -> Academics (at-risk) -> Students, 3 chapters
 *
 * It records the fully-rendered REAL app, so point it at whatever env holds your
 * SAFE, fake "Scoggins/DPPSW" demo data. It only navigates + scrolls — it never
 * clicks anything that writes. Read-only.
 *
 * ── Setup (once) ────────────────────────────────────────────────────────────
 *   cd /Users/shoaibrain/edforge/edforge-saas-frontend
 *   npx playwright install chromium        # first time only
 *
 * ── 1) Capture your login session (once) ────────────────────────────────────
 *   APP_URL="https://<your-demo-app-url>" node <path>/record-landing.mjs --login
 *   # A browser opens. Log in to the Scoggins/DPPSW demo tenant, land on the
 *   # dashboard, then press ENTER in the terminal. Session saved to auth.json.
 *
 * ── 2) Record both clips ────────────────────────────────────────────────────
 *   APP_URL="https://<your-demo-app-url>" node <path>/record-landing.mjs
 *   # Writes ./landing-clips/hero.webm + district.webm and prints ffmpeg
 *   # commands (+ exact District chapter seconds).
 *
 * Env knobs: APP_URL (required), AUTH_STATE (default ./auth.json),
 *   OUT_DIR (default ./landing-clips), HOME_PATH (/home), ACADEMICS_PATH
 *   (/academics), STUDENTS_PATH (/academics/students), HEADED=1 to watch.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline'

const APP_URL = (process.env.APP_URL ?? '').replace(/\/+$/, '') // tolerate trailing slash
if (!APP_URL) {
  console.error('Set APP_URL=https://<your-demo-app-url> (the env with your FAKE Scoggins demo data).')
  process.exit(1)
}
const AUTH_STATE = process.env.AUTH_STATE ?? 'auth.json'
const OUT_DIR = process.env.OUT_DIR ?? 'landing-clips'
const HOME_PATH = process.env.HOME_PATH ?? '/home'
const ACADEMICS_PATH = process.env.ACADEMICS_PATH ?? '/academics'
const STUDENTS_PATH = process.env.STUDENTS_PATH ?? '/academics/students'
const VIEWPORT = { width: 1600, height: 1000 }
const LOGIN_MODE = process.argv.includes('--login')

const waitEnter = (msg) =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(msg, () => {
      rl.close()
      resolve()
    })
  })

/** Smooth wheel scroll of whatever container is under the cursor. */
async function smoothScroll(page, totalPx, ms, dir = 1) {
  const steps = Math.max(20, Math.round(ms / 16))
  const per = (totalPx / steps) * dir
  // Park the cursor high, above the charts — hovering a chart mid-recording
  // pins a data tooltip on camera (caught in take-2 QA).
  await page.mouse.move(VIEWPORT.width / 2, 90)
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per)
    await page.waitForTimeout(16)
  }
}

/** Wait for a signature bit of on-screen content, then a short settle. Avoids
 * the networkidle hang on a live polling app (which padded clips with dead air). */
async function settle(page, text, settleMs = 1400) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 })
  } catch {
    /* fall through — still settle below */
  }
  // Titles render before data: also wait for skeleton loaders to clear
  // (take-2 QA caught "—" KPIs + ghost bars at a chapter start).
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').length === 0,
      { timeout: 12000 },
    )
  } catch {
    /* fall through — still settle below */
  }
  await page.waitForTimeout(settleMs)
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  // ── Login capture mode ────────────────────────────────────────────────────
  if (LOGIN_MODE) {
    const browser = await chromium.launch({ headless: false })
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    await waitEnter('\nLog in + land on the dashboard, then press ENTER here to save the session… ')
    await ctx.storageState({ path: AUTH_STATE })
    console.log(`\n✓ Saved session to ${AUTH_STATE}. Re-run WITHOUT --login to record.`)
    console.log(`  You landed on: ${page.url()}`)
    console.log(`  → If the dashboard is NOT at <origin>/home, re-run the record step with`)
    console.log(`    HOME_PATH=/<path> ACADEMICS_PATH=/<path> STUDENTS_PATH=/<path> to match.`)
    await browser.close()
    return
  }

  if (!existsSync(AUTH_STATE)) {
    console.error(`No ${AUTH_STATE}. Run once with --login first (see header).`)
    process.exit(1)
  }

  const headed = process.env.HEADED === '1'

  // ── Clip A: hero loop (scroll down ~8s, pause, up ~8s → natural loop) ──────
  {
    const browser = await chromium.launch({ headless: !headed })
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      storageState: AUTH_STATE,
      recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    })
    const page = await ctx.newPage()
    await page.goto(APP_URL + HOME_PATH, { waitUntil: 'domcontentloaded' })
    await settle(page, 'Attendance trend', 2200) // charts rendered + settle beat
    await smoothScroll(page, 1600, 8000, 1) // down
    await page.waitForTimeout(1200)
    await smoothScroll(page, 1600, 8000, -1) // back up → loops seamlessly
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${OUT_DIR}/hero-frame.png` })
    await ctx.close() // flush video
    await browser.close()
    console.log('✓ hero recorded')
  }

  // ── Clip B: District, 3 chapters (timestamps are deterministic) ───────────
  const chapters = []
  {
    const browser = await chromium.launch({ headless: !headed })
    const ctx = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 2,
      storageState: AUTH_STATE,
      recordVideo: { dir: OUT_DIR, size: VIEWPORT },
    })
    const page = await ctx.newPage()
    const t0 = Date.now()
    const mark = (label) => chapters.push({ label, sec: ((Date.now() - t0) / 1000).toFixed(1) })

    // Ch1 — single source of truth: the Home dashboard
    await page.goto(APP_URL + HOME_PATH, { waitUntil: 'domcontentloaded' })
    await settle(page, 'Attendance trend')
    mark('Ch1 single source of truth (Home)')
    await smoothScroll(page, 700, 4000, 1)
    await page.waitForTimeout(1500)

    // Ch2 — real-time visibility: Academics overview (at-risk + trend)
    await page.goto(APP_URL + ACADEMICS_PATH, { waitUntil: 'domcontentloaded' })
    await settle(page, 'Attendance trend')
    mark('Ch2 real-time visibility (Academics at-risk)')
    await smoothScroll(page, 600, 3500, 1)
    await page.waitForTimeout(1500)

    // Ch3 — decisions reach the classroom: Students roster (sparklines)
    await page.goto(APP_URL + STUDENTS_PATH, { waitUntil: 'domcontentloaded' })
    await settle(page, 'Govt. Reports')
    mark('Ch3 decisions reach the classroom (Students)')
    await smoothScroll(page, 500, 3000, 1)
    await page.waitForTimeout(1500)

    await page.screenshot({ path: `${OUT_DIR}/district-frame.png` })
    await ctx.close()
    await browser.close()
    console.log('✓ district recorded')
  }

  console.log('\n── Next: convert webm → mp4 (16:10, muted, faststart) ──')
  console.log(`Playwright writes randomly-named .webm into ${OUT_DIR}/ — rename or glob them.`)
  console.log(`\n# hero (already loops; no boomerang needed):`)
  console.log(`ffmpeg -i ${OUT_DIR}/<hero>.webm -an -vf "fps=30" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 30 -preset veryslow -movflags +faststart ${OUT_DIR}/platform-overview.mp4`)
  console.log(`\n# district:`)
  console.log(`ffmpeg -i ${OUT_DIR}/<district>.webm -an -vf "fps=30" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 30 -preset veryslow -movflags +faststart ${OUT_DIR}/district.mp4`)
  console.log(`\n── District chapter start-seconds (from this run) ──`)
  for (const c of chapters) console.log(`  ${c.sec}s  ${c.label}`)
  console.log('\nHand me the two mp4s + these chapter seconds and I wire them in.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
