/**
 * Tests for `useSchoolEnabledGradeOptions` (P3 of the Saraswati grade-levels
 * unblock). The hook turns a `schoolId` into the subset of the global
 * `GRADE_LEVEL_OPTIONS` catalog this school actually operates, with a
 * documented fallback chain.
 *
 * Resolution order being asserted:
 *   1. school.enabledGradeLevels populated → use it
 *   2. else school.gradeRange → derive via getGradeLevelsInRange
 *   3. else → full 20-code catalog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { GRADE_LEVEL_OPTIONS } from '@aibrains/shared-types'

vi.mock('../useSchool', () => ({
  useSchoolProfile: vi.fn(),
}))

import { useSchoolProfile } from '../useSchool'
import { useSchoolEnabledGradeOptions } from '../useGradeOptions'

const useSchoolProfileMock = useSchoolProfile as unknown as ReturnType<typeof vi.fn>

function stubProfile(profile: unknown, isLoading = false) {
  useSchoolProfileMock.mockReturnValue({ data: profile, isLoading })
}

describe('useSchoolEnabledGradeOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns enabledGradeLevels subset (in catalog order) when populated', () => {
    // School deliberately picks 4 codes in REVERSE catalog order — the hook
    // must still return them in canonical order (PG comes before 1).
    stubProfile({
      schoolId: 's1',
      enabledGradeLevels: ['1', 'PG', 'LKG', 'NUR'],
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.source).toBe('enabledGradeLevels')
    expect(result.current.options.map((o) => o.value)).toEqual(['PG', 'NUR', 'LKG', '1'])
  })

  it('falls back to gradeRange-derived options when enabledGradeLevels is empty', () => {
    stubProfile({
      schoolId: 's1',
      enabledGradeLevels: [],
      gradeRange: { start: '1', end: '5' },
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.source).toBe('gradeRange')
    expect(result.current.options.map((o) => o.value)).toEqual(['1', '2', '3', '4', '5'])
  })

  it('falls back to gradeRange-derived options when enabledGradeLevels is missing entirely', () => {
    stubProfile({
      schoolId: 's1',
      gradeRange: { start: 'PK', end: 'K' },
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.source).toBe('gradeRange')
    expect(result.current.options.map((o) => o.value)).toEqual(['PK', 'K'])
  })

  it('falls back to the full catalog when both enabledGradeLevels and gradeRange are missing', () => {
    stubProfile({ schoolId: 's1' })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.source).toBe('fallback')
    expect(result.current.options).toEqual(GRADE_LEVEL_OPTIONS)
  })

  it('falls back to the full catalog when no profile has loaded yet', () => {
    stubProfile(undefined, true)

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.source).toBe('fallback')
    expect(result.current.options).toEqual(GRADE_LEVEL_OPTIONS)
  })

  it('ignores enabledGradeLevels codes that are not in the catalog (defensive)', () => {
    // If the backend ever stores an invalid code (or a future code we don't
    // know about yet), we silently drop it from the rendered dropdown rather
    // than crashing or showing a phantom row.
    stubProfile({
      schoolId: 's1',
      enabledGradeLevels: ['1', 'NOT_A_REAL_CODE', '2'],
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.options.map((o) => o.value)).toEqual(['1', '2'])
  })

  it('falls back to full catalog when enabledGradeLevels contains ONLY unknown codes', () => {
    // Otherwise an operator misconfiguration would render an empty dropdown
    // and lock the user out of every grade picker.
    stubProfile({
      schoolId: 's1',
      enabledGradeLevels: ['NOT_REAL', 'ALSO_NOT_REAL'],
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.options).toEqual(GRADE_LEVEL_OPTIONS)
  })

  it('coerces non-string enabledGradeLevels members to strings (defense at the API boundary)', () => {
    // Backend P1 + tenant.service mapper both coerce, but the hook also
    // does it so a stale cache or hand-edited query data can't break the
    // dropdown.
    stubProfile({
      schoolId: 's1',
      enabledGradeLevels: [1, 2, 3],
    })

    const { result } = renderHook(() => useSchoolEnabledGradeOptions('s1'))

    expect(result.current.options.map((o) => o.value)).toEqual(['1', '2', '3'])
  })
})
