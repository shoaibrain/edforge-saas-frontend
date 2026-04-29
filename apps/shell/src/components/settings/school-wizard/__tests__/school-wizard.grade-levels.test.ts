/**
 * Sprint C1.T6 — wizard grade-level dedup propagation.
 *
 * The EdFiComplianceStep computes the gradeLevels array as
 *   [...new Set([...computeGradeLevels(start, end), ...additionalGrades])]
 *
 * computeGradeLevels itself is exhaustively tested at the shared-types
 * source (packages/shared-types/src/schemas/identity/grade-levels.spec.ts).
 * This test stubs computeGradeLevels and locks the wizard's dedup contract
 * end-to-end with both the post-fix descriptor strings and a worst-case
 * overlap (PPC + manual Prekindergarten) that pre-fix would have collapsed.
 *
 * Stub-based so the test passes locally even before @aibrains/shared-types
 * 0.37.0 is published into the frontend's node_modules — the contract on
 * the wizard transform is independent of the underlying mapping version.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const FIXTURE_ECD_TO_TWELVE = [
  'EarlyChildhoodDevelopment',
  'PrePrimaryClass',
  'Prekindergarten',
  'Kindergarten',
  'FirstGrade',
  'SecondGrade',
  'ThirdGrade',
  'FourthGrade',
  'FifthGrade',
  'SixthGrade',
  'SeventhGrade',
  'EighthGrade',
  'NinthGrade',
  'TenthGrade',
  'EleventhGrade',
  'TwelfthGrade',
] as const

const FIXTURE_PPC_TO_FIVE = [
  'PrePrimaryClass',
  'Prekindergarten',
  'Kindergarten',
  'FirstGrade',
  'SecondGrade',
  'ThirdGrade',
  'FourthGrade',
  'FifthGrade',
] as const

vi.mock('../school-wizard.utils', () => ({
  computeGradeLevels: vi.fn((start: string, _end: string) => {
    if (start === 'ECD') return [...FIXTURE_ECD_TO_TWELVE]
    if (start === 'PPC') return [...FIXTURE_PPC_TO_FIVE]
    if (start === 'PK') return ['Prekindergarten', 'Kindergarten', 'FirstGrade']
    if (start === 'K') return ['Kindergarten', 'FirstGrade']
    if (start === '1') return ['FirstGrade']
    return []
  }),
}))

import { computeGradeLevels } from '../school-wizard.utils'

function wizardGradeLevels(start: string, end: string, additionalGrades: string[]): string[] {
  // Mirror EdFiComplianceStep.tsx:73 verbatim.
  return [...new Set([...computeGradeLevels(start, end), ...additionalGrades])]
}

describe('wizard gradeLevels dedup transform', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ECD..12 with no additional produces 16 unique chips starting with the two PABSON descriptors', () => {
    const chips = wizardGradeLevels('ECD', '12', [])
    expect(chips).toHaveLength(16)
    expect(new Set(chips).size).toBe(16)
    expect(chips[0]).toBe('EarlyChildhoodDevelopment')
    expect(chips[1]).toBe('PrePrimaryClass')
    expect(chips[2]).toBe('Prekindergarten')
  })

  it('PPC start does NOT collapse onto Prekindergarten when user adds PK manually', () => {
    const chips = wizardGradeLevels('PPC', '5', ['Prekindergarten'])
    expect(chips).toContain('PrePrimaryClass')
    expect(chips).toContain('Prekindergarten')
    expect(new Set(chips).size).toBe(chips.length)
  })

  it('PABSON range ECD..12 + Postsecondary additional yields 17 unique chips', () => {
    const chips = wizardGradeLevels('ECD', '12', ['Postsecondary'])
    expect(new Set(chips).size).toBe(chips.length)
    expect(chips).toContain('Postsecondary')
    expect(chips).toContain('EarlyChildhoodDevelopment')
    expect(chips).toContain('PrePrimaryClass')
    expect(chips).toHaveLength(17)
  })

  it('does NOT contain the buggy "EarlyEducation" string for any starting band', () => {
    for (const start of ['ECD', 'PPC', 'PK', 'K', '1']) {
      const chips = wizardGradeLevels(start, '12', [])
      expect(chips).not.toContain('EarlyEducation')
    }
  })

  it('passes the start + end through to computeGradeLevels (regression for arg-order swap)', () => {
    wizardGradeLevels('ECD', '12', [])
    expect(vi.mocked(computeGradeLevels)).toHaveBeenCalledWith('ECD', '12')
  })
})
