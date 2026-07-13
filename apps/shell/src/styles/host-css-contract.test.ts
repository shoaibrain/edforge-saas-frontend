/**
 * Host CSS contract — production-pipeline guard.
 *
 * EdForge is a Module-Federation host (this shell) + remotes that ship no CSS
 * of their own; remotes render on the host's compiled stylesheet. Tailwind v4
 * only emits the utility classes it finds while scanning, so if the host's
 * `@source` configuration (apps/shell/src/index.css) stops covering the shared
 * packages or a remote app, classes used by @edforge/ui primitives or by a
 * remote silently vanish from the production CSS — manifesting as collapsed
 * grids, transparent popovers, and missing elevation that NO typecheck/lint/
 * unit test can see (they don't compile the production CSS).
 *
 * This test compiles the host entry CSS with the real @tailwindcss/postcss
 * plugin (the same one rsbuild uses) and asserts the critical design-system
 * class surface is present. It is the deterministic counterpart to the
 * Playwright visual-regression gate.
 */
import { fileURLToPath } from 'node:url'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import postcss from 'postcss'
import tailwind from '@tailwindcss/postcss'
import { describe, expect, it } from 'vitest'

const HERE = dirname(fileURLToPath(import.meta.url))
const HOST_CSS = resolve(HERE, '../index.css') // apps/shell/src/index.css
// Point Tailwind's automatic content detection at an EMPTY directory, so the
// compiled CSS reflects *only* what the host's `@source` globs pull in (those
// resolve relative to the real index.css path, not this base). Without this,
// vitest's repo-root cwd would auto-scan the entire workspace and the test
// would pass even with a broken @source config (masking the regression).
const EMPTY_BASE = mkdtempSync(join(tmpdir(), 'host-css-contract-'))

/**
 * Classes that MUST exist in the host's compiled CSS. These are drawn from
 * @edforge/ui primitives (e.g. the Select/Combobox listbox panel, dialogs) and
 * from remote apps' arbitrary token/grid utilities — i.e. classes that are NOT
 * used anywhere in the shell's own source, so they only appear if the host's
 * `@source` globs reach the shared packages + remote apps.
 */
const REQUIRED_CLASSES = [
  // @edforge/ui Select/Combobox dropdown panel — the "transparent dropdown" regression
  '.bg-[rgb(var(--background-elevated))]',
  '.shadow-popover',
  // Dialogs / overlays
  '.shadow-modal',
  // Semantic token utilities used across primitives
  '.text-[rgb(var(--text-primary))]',
  '.border-[rgb(var(--border-primary))]',
  '.bg-[rgb(var(--state-success-bg))]',
  // Arbitrary grid templates used only inside remote apps (the "collapsed grid" regression)
  '.grid-cols-[2fr_1fr]',
  '.grid-cols-[1.6fr_1fr]',
  // Mobile chrome/content surface (P2/P3): the ui Sheet structure classes come
  // from @edforge/theme components.css; the StatBand phone rail relies on
  // Tailwind emitting the dynamic-spacing width + snap utilities from the
  // packages scan.
  '.ui-sheet',
  '.ui-sheet-handle',
  '.w-59',
  '.snap-start',
]

describe('host CSS contract (production Tailwind pipeline)', () => {
  it('compiles the full design-system class surface into the host stylesheet', async () => {
    const css = readFileSync(HOST_CSS, 'utf8')
    const result = await postcss([tailwind({ base: EMPTY_BASE })]).process(css, { from: HOST_CSS })
    // Tailwind escapes special chars in selectors (\[ \. \( …). Strip the
    // backslashes so we can assert the human-readable class name is present.
    const deescaped = result.css.replace(/\\/g, '')

    const missing = REQUIRED_CLASSES.filter((cls) => !deescaped.includes(cls))
    expect(
      missing,
      `Host CSS is missing required design-system classes — the production build will render these surfaces broken (collapsed grids / transparent popovers / missing elevation). Most likely the @source globs in apps/shell/src/index.css no longer cover packages/*/src or apps/*/src. Missing: ${missing.join(', ')}`,
    ).toEqual([])
  }, 30_000)
})

describe('animated-icon reduced-motion gate (a11y contract)', () => {
  // apps/shell/src/styles → repo root → packages/theme/src/icon-motion.css
  const ICON_MOTION_CSS = resolve(HERE, '../../../../packages/theme/src/icon-motion.css')

  it('keeps the prefers-reduced-motion gate that disables icon animation', () => {
    const css = readFileSync(ICON_MOTION_CSS, 'utf8')
    // The whole signature/generic motion system MUST stay gated: under
    // prefers-reduced-motion every `.ico` animation is forced off, so the resting
    // glyph is static. If this regresses, the a11y guarantee is silently broken.
    expect(
      css,
      'icon-motion.css lost its prefers-reduced-motion gate (animation:none on .ico) — reduced-motion users would see motion.',
    ).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.ico[\s\S]*?animation:\s*none\s*!important/)
  })
})
