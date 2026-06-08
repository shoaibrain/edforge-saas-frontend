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
  const vars: Record<string, Rgb> = {}
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)\s*;/g)) {
    vars[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])]
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
      ['text-primary', 'surface-primary'],
      ['text-secondary', 'surface-primary'],
      ['text-tertiary', 'surface-primary'],
      ['text-tertiary', 'surface-tertiary'],
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
      ['border-primary', 'surface-primary'],
      ['border-secondary', 'surface-primary'],
      ['border-tertiary', 'surface-primary'],
      ['interactive-focus', 'surface-elevated'],
      ['brand-primary', 'surface-elevated'],
      ['brand-accent', 'surface-primary'],
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

    const whiteOnBrandPairs = ['brand-primary', 'brand-secondary', 'brand-accent'] as const
    for (const bg of whiteOnBrandPairs) {
      const value = Number(ratio([255, 255, 255], tokens[bg]))
      if (value < 4.5) {
        failures.push({
          theme,
          kind: 'text',
          pair: `white on ${bg}`,
          ratio: value.toFixed(2),
          required: 4.5,
        })
      }
    }
  }

  return failures
}

describe('design token contrast baseline', () => {
  it('captures the current WCAG failures that Stream 2 must fix', () => {
    expect(collectSupportedMatrixFailures()).toEqual([
      {
        theme: 'light',
        kind: 'text',
        pair: 'text-tertiary on surface-tertiary',
        ratio: '4.36',
        required: 4.5,
      },
      {
        theme: 'light',
        kind: 'ui',
        pair: 'border-primary on surface-primary',
        ratio: '1.35',
        required: 3,
      },
      {
        theme: 'light',
        kind: 'ui',
        pair: 'border-secondary on surface-primary',
        ratio: '1.09',
        required: 3,
      },
      {
        theme: 'light',
        kind: 'ui',
        pair: 'border-tertiary on surface-primary',
        ratio: '1.64',
        required: 3,
      },
      {
        theme: 'light',
        kind: 'ui',
        pair: 'brand-accent on surface-primary',
        ratio: '2.14',
        required: 3,
      },
      {
        theme: 'light',
        kind: 'text',
        pair: 'white on brand-secondary',
        ratio: '3.73',
        required: 4.5,
      },
      {
        theme: 'light',
        kind: 'text',
        pair: 'white on brand-accent',
        ratio: '2.25',
        required: 4.5,
      },
      {
        theme: 'dark',
        kind: 'ui',
        pair: 'border-primary on surface-primary',
        ratio: '2.05',
        required: 3,
      },
      {
        theme: 'dark',
        kind: 'ui',
        pair: 'border-secondary on surface-primary',
        ratio: '1.56',
        required: 3,
      },
      {
        theme: 'dark',
        kind: 'ui',
        pair: 'interactive-focus on surface-elevated',
        ratio: '2.50',
        required: 3,
      },
      {
        theme: 'dark',
        kind: 'ui',
        pair: 'brand-primary on surface-elevated',
        ratio: '2.50',
        required: 3,
      },
      {
        theme: 'dark',
        kind: 'text',
        pair: 'white on brand-primary',
        ratio: '3.73',
        required: 4.5,
      },
      {
        theme: 'dark',
        kind: 'text',
        pair: 'white on brand-secondary',
        ratio: '1.72',
        required: 4.5,
      },
      {
        theme: 'dark',
        kind: 'text',
        pair: 'white on brand-accent',
        ratio: '2.25',
        required: 4.5,
      },
    ])
  })

  it('tracks semantic tokens that are missing a dark-mode override', () => {
    expect(Object.keys(rootTokens).filter((token) => token.startsWith('border-') && !(token in darkOverrides))).toEqual([
      'border-tertiary',
    ])
  })
})
