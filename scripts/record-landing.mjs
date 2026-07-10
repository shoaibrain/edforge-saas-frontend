/**
 * record-landing.mjs — automated recorder for the EdForge landing videos.
 *
 * Drives the running app on directed, scene-based paths and records video
 * (1600x1000, 16:10 — matches the hero laptop frame). A synthetic cursor is
 * injected so glides/hovers/clicks are VISIBLE in the footage (headless
 * recordings have no OS cursor). Scenes are spliced afterward with the ffmpeg
 * command the script prints — hard cuts, no loading dead-air.
 *
 * READ-ONLY by design: it only navigates, scrolls, hovers, and clicks tabs.
 * Point it ONLY at a synthetic-data demo tenant — never a real-pilot tenant.
 *
 * ── Modes ──────────────────────────────────────────────────────────────────
 *   --login   open a browser, sign in manually, press ENTER → session saved
 *   --scout   screenshot candidate pages (no video) → OUT_DIR/scout/*.png
 *   default   record clips; SET=hero|district|all (default all)
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *   cd edforge-saas-frontend
 *   APP_URL=https://<demo-app> AUTH_STATE=/path/auth.json node scripts/record-landing.mjs --login
 *   APP_URL=... AUTH_STATE=... OUT_DIR=... node scripts/record-landing.mjs --scout
 *   APP_URL=... AUTH_STATE=... OUT_DIR=... SET=hero node scripts/record-landing.mjs
 *
 * Env: APP_URL (required) · AUTH_STATE (default ./auth.json) · OUT_DIR
 * (default ./landing-clips) · SET · HEADED=1 to watch.
 */
import { chromium } from '@playwright/test'
import { mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'

const APP_URL = (process.env.APP_URL ?? '').replace(/\/+$/, '')
if (!APP_URL) {
  console.error('Set APP_URL=https://<your-demo-app-url> (synthetic-data demo tenant ONLY).')
  process.exit(1)
}
const AUTH_STATE = process.env.AUTH_STATE ?? 'auth.json'
const OUT_DIR = process.env.OUT_DIR ?? 'landing-clips'
const VIEWPORT = { width: 1600, height: 1000 }
const LOGIN_MODE = process.argv.includes('--login')
const SCOUT_MODE = process.argv.includes('--scout')
const SET = (process.env.SET ?? 'all').toLowerCase()

const waitEnter = (msg) =>
  new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(msg, () => {
      rl.close()
      resolve()
    })
  })

/* ── Synthetic cursor (visible in recordings) ──────────────────────────── */

const CURSOR_JS = `
(() => {
  if (document.getElementById('__demo_cursor')) return
  const c = document.createElement('div')
  c.id = '__demo_cursor'
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;' +
    'width:22px;height:22px;transform:translate(-2px,-2px);transition:none;'
  c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24">' +
    '<path d="M5 3l14 8.5-6.2 1.2 3.4 6.3-2.8 1.5-3.4-6.3L5 18.5z" ' +
    'fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'
  document.documentElement.appendChild(c)
  document.addEventListener('mousemove', (e) => {
    c.style.left = e.clientX + 'px'
    c.style.top = e.clientY + 'px'
  }, { passive: true, capture: true })
  document.addEventListener('mousedown', () => {
    c.style.transform = 'translate(-2px,-2px) scale(0.82)'
  }, { capture: true })
  document.addEventListener('mouseup', () => {
    c.style.transform = 'translate(-2px,-2px) scale(1)'
  }, { capture: true })
})()`

async function injectCursor(page) {
  try {
    await page.evaluate(CURSOR_JS)
  } catch {
    /* non-fatal */
  }
}

/* ── Motion primitives ─────────────────────────────────────────────────── */

const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

let mouseAt = { x: 800, y: 120 }

/** Eased, human-looking cursor glide to (x, y). */
async function glide(page, x, y, ms = 900) {
  const steps = Math.max(12, Math.round(ms / 16))
  const from = { ...mouseAt }
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps)
    await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t)
    await page.waitForTimeout(16)
  }
  mouseAt = { x, y }
}

/** Glide to the center (or offset) of the first element matching `re`. */
async function glideToText(page, re, ms = 900, dx = 0, dy = 0) {
  try {
    const box = await page.getByText(re).first().boundingBox({ timeout: 4000 })
    if (box) {
      await glide(page, box.x + box.width / 2 + dx, box.y + box.height / 2 + dy, ms)
      return box
    }
  } catch {
    /* target missing — skip the move rather than fail the shoot */
  }
  return null
}

/** Sweep the cursor horizontally under a heading — pops chart hover tooltips. */
async function sweepBelowText(page, re, { below = 120, fromX = 0.15, toX = 0.8, ms = 1600 } = {}) {
  try {
    const box = await page.getByText(re).first().boundingBox({ timeout: 4000 })
    if (!box) return
    const y = box.y + below
    await glide(page, box.x + 40, y, 350)
    const startX = box.x + 40
    const endX = Math.min(box.x + 1200 * toX, VIEWPORT.width - 60)
    const steps = Math.max(20, Math.round(ms / 16))
    for (let i = 1; i <= steps; i++) {
      const t = easeInOut(i / steps)
      await page.mouse.move(startX + (endX - startX) * t, y)
      await page.waitForTimeout(16)
    }
    mouseAt = { x: endX, y }
  } catch {
    /* skip */
  }
}

/** Smooth wheel scroll with the cursor parked out of chart hover range. */
async function smoothScroll(page, totalPx, ms, dir = 1) {
  await glide(page, VIEWPORT.width - 90, 300, 300)
  const steps = Math.max(20, Math.round(ms / 16))
  const per = (totalPx / steps) * dir
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per)
    await page.waitForTimeout(16)
  }
}

/** Wait for signature content, then for skeleton loaders to clear, then settle. */
async function settle(page, re, settleMs = 1200) {
  try {
    await page.getByText(re).first().waitFor({ state: 'visible', timeout: 20000 })
  } catch {
    /* fall through */
  }
  try {
    await page.waitForFunction(
      () => document.querySelectorAll('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').length === 0,
      { timeout: 12000 },
    )
  } catch {
    /* fall through */
  }
  await page.waitForTimeout(settleMs)
}

/* ── Scene engine ──────────────────────────────────────────────────────── */

async function newRecordingContext(browser) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    storageState: AUTH_STATE,
    recordVideo: { dir: OUT_DIR, size: VIEWPORT },
  })
  const page = await ctx.newPage()
  return { ctx, page }
}

/**
 * Run a scene list in one recording context. Each scene:
 *   { name, path?, settleText, run(page) }
 * Marks scene start AFTER settle and end AFTER run() — the splice windows.
 */
async function shoot(browser, clipName, scenes) {
  const { ctx, page } = await newRecordingContext(browser)
  const t0 = Date.now()
  const marks = []
  for (const scene of scenes) {
    if (scene.path) {
      await page.goto(APP_URL + scene.path, { waitUntil: 'domcontentloaded' })
      await injectCursor(page)
    }
    await settle(page, scene.settleText)
    await injectCursor(page) // re-assert after any SPA re-render
    const start = (Date.now() - t0) / 1000
    await scene.run(page)
    const end = (Date.now() - t0) / 1000
    marks.push({ name: scene.name, start: +start.toFixed(2), end: +end.toFixed(2) })
    console.log(`  [${clipName}] ${scene.name}: ${start.toFixed(1)}s → ${end.toFixed(1)}s`)
  }
  await ctx.close()
  const video = await page.video()?.path()
  return { video, marks }
}

/** Build the exact ffmpeg splice command from the recorded scene marks. */
function ffmpegCommand(videoPath, marks, outName) {
  const segs = marks
    .map((m, i) => `[0:v]trim=start=${(m.start + 0.15).toFixed(2)}:end=${(m.end - 0.05).toFixed(2)},setpts=PTS-STARTPTS[s${i}]`)
    .join(';')
  const labels = marks.map((_, i) => `[s${i}]`).join('')
  return (
    `ffmpeg -y -i "${videoPath}" -filter_complex "` +
    `${segs};${labels}concat=n=${marks.length}:v=1,fps=30[out]" ` +
    `-map "[out]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 30 -preset slow ` +
    `-movflags +faststart "${OUT_DIR}/${outName}"`
  )
}

/* ── Scene lists (English UI; shipped features only) ───────────────────── */

/** Hero montage (~23s): quick cuts across the platform, ends where it starts. */
const HERO_SCENES = [
  {
    name: 'home-kpis',
    path: '/home',
    settleText: /attendance trend/i,
    run: async (p) => {
      await glideToText(p, /students enrolled/i, 900, 0, 30)
      await p.waitForTimeout(500)
      await glideToText(p, /outstanding fees/i, 900, 0, 30)
      await p.waitForTimeout(700)
    },
  },
  {
    name: 'home-trend',
    settleText: /attendance trend/i,
    run: async (p) => {
      await smoothScroll(p, 320, 900, 1)
      await sweepBelowText(p, /attendance trend/i, { below: 150, ms: 2000 })
      await p.waitForTimeout(500)
    },
  },
  {
    name: 'academics-overview',
    path: '/academics',
    settleText: /attendance trend/i,
    run: async (p) => {
      await glideToText(p, /at-risk students/i, 900, 0, 20)
      await p.waitForTimeout(600)
      await sweepBelowText(p, /attendance trend/i, { below: 150, ms: 1700 })
      await p.waitForTimeout(400)
    },
  },
  {
    name: 'students-roster',
    path: '/academics/students',
    settleText: /govt\. reports/i,
    run: async (p) => {
      await glideToText(p, /total enrolled/i, 700, 0, 20)
      await p.waitForTimeout(400)
      await smoothScroll(p, 380, 1600, 1)
      await p.waitForTimeout(700)
    },
  },
  {
    name: 'finance-overview',
    path: '/finance',
    settleText: /collection/i,
    run: async (p) => {
      await glideToText(p, /outstanding/i, 900, 0, 20)
      await p.waitForTimeout(500)
      await sweepBelowText(p, /collection/i, { below: 150, ms: 1600 })
      await p.waitForTimeout(400)
    },
  },
  {
    name: 'home-return',
    path: '/home',
    settleText: /attendance trend/i,
    run: async (p) => {
      await glide(p, 800, 260, 700)
      await p.waitForTimeout(1600)
    },
  },
]

/** District (~16s, 3 chapters): KPI band → at-risk visibility → actionable roster. */
const DISTRICT_SCENES = [
  {
    name: 'ch1-single-source',
    path: '/home',
    settleText: /attendance trend/i,
    run: async (p) => {
      await glideToText(p, /students enrolled/i, 800, 0, 30)
      await p.waitForTimeout(400)
      await glideToText(p, /today's attendance/i, 700, 0, 30)
      await p.waitForTimeout(400)
      await glideToText(p, /outstanding fees/i, 700, 0, 30)
      await p.waitForTimeout(700)
    },
  },
  {
    name: 'ch2-visibility',
    path: '/academics',
    settleText: /attendance trend/i,
    run: async (p) => {
      await glideToText(p, /at-risk students/i, 900, 0, 20)
      await p.waitForTimeout(700)
      await sweepBelowText(p, /attendance trend/i, { below: 150, ms: 1800 })
      await p.waitForTimeout(500)
    },
  },
  {
    name: 'ch3-classroom',
    path: '/academics/students',
    settleText: /govt\. reports/i,
    run: async (p) => {
      await glideToText(p, /at risk/i, 800, 0, 20)
      await p.waitForTimeout(400)
      await smoothScroll(p, 360, 1500, 1)
      await p.waitForTimeout(800)
    },
  },
]

/* ── Scout: screenshot candidate pages to direct future shots ──────────── */

const SCOUT_PAGES = [
  ['home', '/home', /attendance trend/i],
  ['academics-overview', '/academics', /attendance trend/i],
  ['students-roster', '/academics/students', /govt\. reports/i],
  ['exams', '/academics/exams', /exam/i],
  ['curriculum', '/academics/curriculum', /course|curriculum/i],
  ['classrooms', '/academics/classrooms', /class|section/i],
  ['finance-overview', '/finance', /collect|invoice/i],
  ['finance-invoices', '/finance/invoices', /invoice/i],
  ['finance-payments', '/finance/payments', /payment/i],
  ['people', '/people', /staff/i],
]

async function scout(browser) {
  const dir = `${OUT_DIR}/scout`
  mkdirSync(dir, { recursive: true })
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    storageState: AUTH_STATE,
  })
  const page = await ctx.newPage()
  for (const [name, path, re] of SCOUT_PAGES) {
    try {
      await page.goto(APP_URL + path, { waitUntil: 'domcontentloaded' })
      await settle(page, re, 800)
      await page.screenshot({ path: `${dir}/${name}.png` })
      console.log(`  ✓ scout ${name} (${path})`)
    } catch (e) {
      console.warn(`  ✗ scout ${name}: ${e.message}`)
    }
  }
  // Student profile: follow the first roster link that looks like a profile.
  try {
    await page.goto(APP_URL + '/academics/students', { waitUntil: 'domcontentloaded' })
    await settle(page, /govt\. reports/i, 800)
    const href = await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll('a[href*="/students/"]')).find((el) =>
        /\/students\/[^/?#]+$/.test(el.getAttribute('href') || ''),
      )
      return a?.getAttribute('href') ?? null
    })
    if (href) {
      const url = href.startsWith('http') ? href : APP_URL + href
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await settle(page, /profile|overview|attendance/i, 1000)
      await page.screenshot({ path: `${dir}/student-profile.png` })
      console.log(`  ✓ scout student-profile (${href})`)
      // Screenshot each tab on the profile (tabs are read-only views).
      const tabs = await page.locator('[role="tab"]').allTextContents().catch(() => [])
      console.log(`    profile tabs: ${tabs.join(' | ') || '(none found)'}`)
      for (const t of tabs.slice(0, 8)) {
        try {
          await page.getByRole('tab', { name: t }).first().click()
          await page.waitForTimeout(1200)
          const slug = t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          await page.screenshot({ path: `${dir}/student-profile-tab-${slug}.png` })
          console.log(`  ✓ scout student-profile tab "${t}"`)
        } catch {
          /* skip tab */
        }
      }
    } else {
      console.warn('  ✗ scout student-profile: no /students/<id> link found on roster')
    }
  } catch (e) {
    console.warn(`  ✗ scout student-profile: ${e.message}`)
  }
  await ctx.close()
  console.log(`\nScout screenshots in ${dir}/`)
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  if (LOGIN_MODE) {
    const browser = await chromium.launch({ headless: false })
    const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
    const page = await ctx.newPage()
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    await waitEnter('\nLog in + land on the dashboard, then press ENTER here to save the session… ')
    await ctx.storageState({ path: AUTH_STATE })
    console.log(`\n✓ Saved session to ${AUTH_STATE}. You landed on: ${page.url()}`)
    await browser.close()
    return
  }

  if (!existsSync(AUTH_STATE)) {
    console.error(`No ${AUTH_STATE}. Run once with --login first.`)
    process.exit(1)
  }

  const browser = await chromium.launch({ headless: process.env.HEADED !== '1' })

  if (SCOUT_MODE) {
    await scout(browser)
    await browser.close()
    return
  }

  const results = {}
  if (SET === 'hero' || SET === 'all') {
    console.log('\n── shooting hero montage ──')
    results.hero = await shoot(browser, 'hero', HERO_SCENES)
  }
  if (SET === 'district' || SET === 'all') {
    console.log('\n── shooting district ──')
    results.district = await shoot(browser, 'district', DISTRICT_SCENES)
  }
  await browser.close()

  writeFileSync(`${OUT_DIR}/marks.json`, JSON.stringify(results, null, 2))
  console.log(`\nMarks written to ${OUT_DIR}/marks.json`)
  for (const [clip, r] of Object.entries(results)) {
    const outName = clip === 'hero' ? 'platform-overview.mp4' : `${clip}.mp4`
    console.log(`\n── splice command for ${clip} ──`)
    console.log(ffmpegCommand(r.video, r.marks, outName))
    if (clip !== 'hero') {
      let t = 0
      console.log(`chapter starts:`)
      r.marks.forEach((m) => {
        console.log(`  ${t.toFixed(1)}s  ${m.name}`)
        t += m.end - 0.05 - (m.start + 0.15)
      })
      console.log(`total ≈ ${t.toFixed(1)}s`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
