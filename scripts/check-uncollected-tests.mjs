#!/usr/bin/env node
/**
 * Issue #353 — fail the build when a unit test file exists that vitest will
 * never collect.
 *
 * The root config collects `**\/*.test.{ts,tsx}` only. Three bulk-generate
 * files were written as `*.spec.*` and sat unrun for months; one of them had
 * been asserting a payload shape that changed under it, and the wizard defect
 * it would have caught shipped to production instead.
 *
 * Widening the glob is not the fix: `e2e/` holds ~38 Playwright `*.spec.ts`
 * files that must not run under vitest. So the rule is a naming rule, and
 * this is the thing that enforces it.
 */
import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SEARCH = ['apps', 'packages']
const SKIP = new Set(['node_modules', 'dist', '.turbo', '.cache', 'build', 'coverage'])

const offenders = []

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full)
    } else if (/\.spec\.(ts|tsx)$/.test(entry)) {
      offenders.push(relative(ROOT, full))
    }
  }
}

for (const dir of SEARCH) {
  try {
    walk(join(ROOT, dir))
  } catch {
    // Directory absent in a partial checkout; nothing to check.
  }
}

if (offenders.length > 0) {
  console.error(
    'These test files will never run: vitest collects **/*.test.{ts,tsx},\n' +
      'and Playwright owns *.spec.ts under e2e/. Rename them to *.test.*:\n',
  )
  for (const f of offenders) console.error(`  ${f}`)
  process.exit(1)
}

console.log('OK — every unit test under apps/ and packages/ is collectable.')
