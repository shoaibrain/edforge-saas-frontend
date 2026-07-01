#!/usr/bin/env node
/**
 * check-icon-coverage — animated-icon coverage guard (issue #262 follow-through).
 *
 * Two jobs:
 *
 *  1. HARD GUARD (fails CI): the Finance `$` glyph (lucide `DollarSign`) is
 *     retired in favour of the curated Wallet mark. It must not reappear in any
 *     app source. The signature registry (packages/ui/.../signatures.ts) is the
 *     one legitimate mention — it maps the `DollarSign` displayName onto the
 *     `finance` (Wallet) signature — and is out of scope here (apps only).
 *     Escape hatch for a genuine non-finance need: a `// icon-coverage-allow-dollar`
 *     comment on the same line.
 *
 *  2. ADVISORY (never fails): a best-effort list of files that render a raw
 *     lucide icon inside an interactive surface (`<button`, `role="tab"`,
 *     menu item) without the `.ef-motion` hook or an `<AnimatedIcon>`. These are
 *     candidates for a bespoke/generic signature so coverage keeps growing. This
 *     is intentionally non-failing — the central `.ef-motion` adoption on the
 *     @edforge/ui Button/Dropdown/StatCard primitives already covers most of the
 *     long tail, and we don't want to block on the rest.
 *
 * Usage: node scripts/check-icon-coverage.mjs   (from repo root)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const APPS_DIR = join(ROOT, 'apps')

/** Recursively collect .ts/.tsx files under a directory, skipping build output. */
function collect(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.turbo') continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) collect(full, out)
    else if (/\.(ts|tsx)$/.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

const files = collect(APPS_DIR)

// ---- 1. HARD GUARD: no retired Finance `$` (lucide DollarSign) in app source ----
const dollarHits = []
for (const file of files) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (/\bDollarSign\b/.test(line) && !line.includes('icon-coverage-allow-dollar')) {
      dollarHits.push(`${relative(ROOT, file)}:${i + 1}: ${line.trim()}`)
    }
  })
}

// ---- 2. ADVISORY: raw lucide in an interactive surface without motion ----
const advisories = []
for (const file of files) {
  const src = readFileSync(file, 'utf8')
  const importsLucide = /from ['"]lucide-react['"]/.test(src)
  if (!importsLucide) continue
  const interactive = src.includes('<button') || src.includes('role="tab"')
  if (!interactive) continue
  const hasMotion = src.includes('ef-motion') || src.includes('AnimatedIcon')
  if (!hasMotion) advisories.push(relative(ROOT, file))
}

let failed = false
if (dollarHits.length) {
  failed = true
  console.error('\n✖ Retired Finance `$` (DollarSign) found in app source — use the Wallet mark')
  console.error('  (render `<AnimatedIcon name="finance" />` / lucide `Wallet`, or StatCard signature="finance"):')
  for (const h of dollarHits) console.error('   ' + h)
}

if (advisories.length) {
  console.log(`\nℹ icon-coverage advisory — ${advisories.length} interactive file(s) render raw lucide without`)
  console.log('  `.ef-motion` or `<AnimatedIcon>`. Not a failure; candidates for a signature sweep:')
  for (const f of advisories.slice(0, 40)) console.log('   ' + f)
  if (advisories.length > 40) console.log(`   … and ${advisories.length - 40} more`)
}

if (!failed) console.log('\n✓ icon-coverage: no retired Finance `$` in app source.')
process.exit(failed ? 1 : 0)
