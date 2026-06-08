import { describe, expect, it } from 'vitest'
import * as wcag from 'wcag-contrast'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type Rgb = [number, number, number]
type ThemeName = 'light' | 'dark'

interface ContrastFailure {
  theme: ThemeName
  kind: 'text' | 'ui'
  pair: string
  ratio: string
  required: number
}

const themeCss = readFileSync(
  resolve(process.cwd(), 'packages/theme/src/base.css'),
  'utf8'
)

function readBlock(selector: ':root' | '.dark'): string {
  const escapedSelector = selector.replace('.', '\\.')
  const match = themeCss.match(new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, 'm'))
  if (!match?.[1]) {
    throw new Error(`Unable to locate ${selector} token block`)
  }
  return match[1]
}

function readRgbVars(block: string): Record<string, Rgb> {
  const rawVars: Record<string, string> = {}
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) {
    rawVars[match[1]] = match[2].trim()
  }

  const vars: Record<string, Rgb> = {}
  const resolveVar = (name: string, seen = new Set<string>()): Rgb | undefined => {
    if (seen.has(name)) return undefined
    seen.add(name)
    const raw = rawVars[name]
    if (!raw) return undefined

    const rgbMatch = raw.match(/^([0-9]+)\s+([0-9]+)\s+([0-9]+)$/)
    if (rgbMatch) {
      return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
    }

    const aliasMatch = raw.match(/^var\(--([a-z0-9-]+)\)$/)
    if (aliasMatch) {
      return resolveVar(aliasMatch[1], seen)
    }

    return undefined
  }

  for (const token of Object.keys(rawVars)) {
    const resolved = resolveVar(token)
    if (resolved) vars[token] = resolved
  }
  return vars
}

const rootTokens = readRgbVars(readBlock(':root'))
const darkOverrides = readRgbVars(readBlock('.dark'))

const themes: Record<ThemeName, Record<string, Rgb>> = {
  light: rootTokens,
  dark: { ...rootTokens, ...darkOverrides },
}

function ratio(foreground: Rgb, background: Rgb): string {
  return wcag.rgb(foreground, background).toFixed(2)
}

function collectSupportedMatrixFailures(): ContrastFailure[] {
  const failures: ContrastFailure[] = []

  for (const [theme, tokens] of Object.entries(themes) as [ThemeName, Record<string, Rgb>][]) {
    const textPairs = [
      ['text-primary', 'background-primary'],
      ['text-secondary', 'background-primary'],
      ['text-tertiary', 'background-primary'],
      ['text-tertiary', 'background-tertiary'],
    ] as const

    for (const [fg, bg] of textPairs) {
      const value = Number(ratio(tokens[fg], tokens[bg]))
      if (value < 4.5) {
        failures.push({
          theme,
          kind: 'text',
          pair: `${fg} on ${bg}`,
          ratio: value.toFixed(2),
          required: 4.5,
        })
      }
    }

    const uiPairs = [
      ['border-primary', 'background-primary'],
      ['border-secondary', 'background-primary'],
      ['border-tertiary', 'background-primary'],
      ['border-focus', 'background-elevated'],
    ] as const

    for (const [fg, bg] of uiPairs) {
      const value = Number(ratio(tokens[fg], tokens[bg]))
      if (value < 3) {
        failures.push({
          theme,
          kind: 'ui',
          pair: `${fg} on ${bg}`,
          ratio: value.toFixed(2),
          required: 3,
        })
      }
    }

    const actionTextPairs = [
      ['action-primary-fg', 'action-primary-bg'],
      ['action-danger-fg', 'action-danger-bg'],
    ] as const
    for (const [fg, bg] of actionTextPairs) {
      const value = Number(ratio(tokens[fg], tokens[bg]))
      if (value < 4.5) {
        failures.push({
          theme,
          kind: 'text',
          pair: `${fg} on ${bg}`,
          ratio: value.toFixed(2),
          required: 4.5,
        })
      }
    }
  }

  return failures
}

describe('design token contrast baseline', () => {
  it('has no WCAG failures in the supported semantic token matrix', () => {
    expect(collectSupportedMatrixFailures()).toEqual([])
  })

  it('keeps border tokens fully defined in both themes', () => {
    expect(Object.keys(rootTokens).filter((token) => token.startsWith('border-') && !(token in darkOverrides))).toEqual([
    ])
  })

  it('defines the semantic token taxonomy in both themes', () => {
    const requiredAliases = [
      'background-primary',
      'background-secondary',
      'background-tertiary',
      'background-elevated',
      'text-muted',
      'text-disabled',
      'text-on-accent',
      'border-subtle',
      'border-default',
      'border-strong',
      'border-focus',
      'action-primary-bg',
      'action-primary-fg',
      'action-danger-bg',
      'action-danger-fg',
      'state-success-bg',
      'state-success-fg',
      'state-warning-bg',
      'state-warning-fg',
      'state-danger-bg',
      'state-danger-fg',
      'state-info-bg',
      'state-info-fg',
    ]

    for (const token of requiredAliases) {
      expect(rootTokens[token], `missing light ${token}`).toBeDefined()
      expect(themes.dark[token], `missing dark ${token}`).toBeDefined()
    }
  })
})
