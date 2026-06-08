import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

type FocusStatus = 'semantic-pass' | 'hardcoded-pass' | 'missing'

interface FocusCheck {
  primitive: string
  file: string
  interactiveEvidence: RegExp
  focusEvidence: RegExp
  semanticEvidence?: RegExp
}

const checks: FocusCheck[] = [
  {
    primitive: 'Button',
    file: 'packages/ui/src/components/Button.tsx',
    interactiveEvidence: /<button/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'Tag clickable usage',
    file: 'packages/ui/src/components/Tag.tsx',
    interactiveEvidence: /HTMLAttributes<HTMLSpanElement>/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'Card as link/button usage',
    file: 'packages/ui/src/components/Card.tsx',
    interactiveEvidence: /HTMLAttributes<HTMLDivElement>/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'Table row',
    file: 'packages/ui/src/components/Table.tsx',
    interactiveEvidence: /TableRow/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'DataTable clickable row',
    file: 'packages/ui/src/components/data-table/DataTable.tsx',
    interactiveEvidence: /onRowClick|cursor-pointer/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'FilterTabs',
    file: 'packages/ui/src/components/FilterTabs.tsx',
    interactiveEvidence: /role="tab"/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'Accordion',
    file: 'packages/ui/src/components/Accordion.tsx',
    interactiveEvidence: /aria-expanded|onKeyDown/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'Dropdown',
    file: 'packages/ui/src/components/Dropdown.tsx',
    interactiveEvidence: /MenuButton|MenuItem/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
  {
    primitive: 'AttendanceHeatmap navigation',
    file: 'packages/ui/src/components/AttendanceHeatmap.tsx',
    interactiveEvidence: /onMonthChange|tabIndex=\{0\}/,
    focusEvidence: /focus-visible:ring|focus:ring|focus-visible:outline|focusRing/,
    semanticEvidence: /--interactive-focus|--border-focus|focusRing/,
  },
]

function source(file: string): string {
  return readFileSync(resolve(process.cwd(), file), 'utf8')
}

function evaluate(check: FocusCheck): FocusStatus {
  const fileSource = source(check.file)
  expect(fileSource, `${check.primitive} should remain an interactive primitive`).toMatch(
    check.interactiveEvidence
  )

  if (!check.focusEvidence.test(fileSource)) {
    return 'missing'
  }
  if (check.semanticEvidence?.test(fileSource)) {
    return 'semantic-pass'
  }
  return 'hardcoded-pass'
}

describe('interactive primitive focus-ring baseline', () => {
  it('captures current primitives that still need semantic focus-visible coverage', () => {
    const statusByPrimitive = Object.fromEntries(
      checks.map((check) => [check.primitive, evaluate(check)])
    )

    expect(statusByPrimitive).toEqual({
      Button: 'semantic-pass',
      'Tag clickable usage': 'missing',
      'Card as link/button usage': 'missing',
      'Table row': 'semantic-pass',
      'DataTable clickable row': 'semantic-pass',
      FilterTabs: 'semantic-pass',
      Accordion: 'semantic-pass',
      Dropdown: 'semantic-pass',
      'AttendanceHeatmap navigation': 'missing',
    })
  })
})
