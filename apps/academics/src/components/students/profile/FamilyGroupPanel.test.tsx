/// <reference types="@testing-library/jest-dom" />
/**
 * FamilyGroupPanel — render-smoke tests (FB-1.8).
 *
 * The panel consumes the M0 useFamily hooks; those are mocked here so the
 * tests exercise the presentation contract (empty state → link CTA, linked
 * state → family name + siblings + unlink) without a live query client.
 * i18n is initialized for real (workspace setup), so assertions match the
 * en `family.group.*` strings.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import type { StudentFamily } from '@edforge/types'

// ----------------------------------------------------------------------------
// Mocks — the M0 hooks. Only useStudentFamily drives the panel's branches;
// the mutation hooks return an idle shape so the JSX mounts.
// ----------------------------------------------------------------------------

const mockUseStudentFamily = vi.fn()
const idleMutation = { mutate: vi.fn(), isPending: false }

vi.mock('../../../hooks/useFamily', () => ({
  useStudentFamily: (...args: unknown[]) => mockUseStudentFamily(...args),
  useFamilies: () => ({ data: undefined, isFetching: false }),
  useCreateFamily: () => idleMutation,
  useAddFamilyMember: () => idleMutation,
  useRemoveFamilyMember: () => idleMutation,
}))

// i18n is not initialized in the unit test environment (mirrors the repo's
// component-test convention). Echo the key with interpolated values so
// assertions are deterministic and independent of the loaded resource bundle.
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return String(opts.defaultValue)
      if (opts && Object.keys(opts).length > 0) {
        return `${key}:${Object.values(opts).join(',')}`
      }
      return key
    },
  }),
}))

import { FamilyGroupPanel } from './FamilyGroupPanel'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const SUBJECT = '11111111-1111-1111-1111-111111111111'
const SCHOOL = 'sch-1'

function linkedFamily(): StudentFamily {
  return {
    family: {
      id: '22222222-2222-2222-2222-222222222222',
      schoolId: SCHOOL,
      name: 'Sharma',
      primaryContact: { name: 'Ram Sharma', phone: '9800000000' },
      createdBy: 'u-1',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
    siblings: [
      { studentId: SUBJECT, studentName: 'Asha Sharma', gradeLevel: '8', status: 'active' },
      { studentId: 'sib-2', studentName: 'Bikash Sharma', gradeLevel: '5', status: 'active' },
    ],
  }
}

describe('FamilyGroupPanel', () => {
  it('shows the loading skeleton while the family query is loading', () => {
    mockUseStudentFamily.mockReturnValue({ data: undefined, isLoading: true })
    const { container } = render(<FamilyGroupPanel studentId={SUBJECT} schoolId={SCHOOL} />)
    expect(container.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('renders the not-linked empty state with a Link CTA when family is null', () => {
    mockUseStudentFamily.mockReturnValue({ data: { family: null, siblings: [] }, isLoading: false })
    const { getByText } = render(<FamilyGroupPanel studentId={SUBJECT} schoolId={SCHOOL} />)
    expect(getByText('family.group.notLinked')).toBeInTheDocument()
    // Link CTA present (empty-state button).
    expect(getByText('family.group.linkAction').closest('button')).not.toBeNull()
  })

  it('renders the family name, primary contact, and sibling names when linked', () => {
    mockUseStudentFamily.mockReturnValue({ data: linkedFamily(), isLoading: false })
    const { getByText, container } = render(
      <FamilyGroupPanel studentId={SUBJECT} schoolId={SCHOOL} />,
    )
    expect(getByText('Sharma')).toBeInTheDocument()
    expect(container.textContent).toContain('Ram Sharma')
    expect(getByText('Asha Sharma')).toBeInTheDocument()
    expect(getByText('Bikash Sharma')).toBeInTheDocument()
    // The subject student is tagged ("(family.group.you)").
    expect(container.textContent).toContain('family.group.you')
  })

  it('hides write affordances (Unlink header button) when canEdit is false', () => {
    mockUseStudentFamily.mockReturnValue({ data: linkedFamily(), isLoading: false })
    const { queryAllByText } = render(
      <FamilyGroupPanel studentId={SUBJECT} schoolId={SCHOOL} canEdit={false} />,
    )
    // The only "family.group.unlink" nodes come from the header button + the
    // confirm modal, both gated on canEdit — none should render.
    expect(queryAllByText('family.group.unlink')).toHaveLength(0)
  })

  it('hides the Link CTA when no schoolId is in context', () => {
    mockUseStudentFamily.mockReturnValue({ data: { family: null, siblings: [] }, isLoading: false })
    const { queryByText } = render(<FamilyGroupPanel studentId={SUBJECT} />)
    expect(queryByText('family.group.linkAction')).toBeNull()
  })

  it('renders an error+retry state (NOT the Link CTA) when the family query errors', () => {
    // On fetch error data is undefined; the panel must NOT fall through to the
    // "not linked" empty state, which would falsely offer to link a NEW family
    // and risk duplicate membership.
    mockUseStudentFamily.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    })
    const { getByText, queryByText } = render(
      <FamilyGroupPanel studentId={SUBJECT} schoolId={SCHOOL} />,
    )
    expect(getByText('family.group.loadError')).toBeInTheDocument()
    expect(queryByText('family.group.notLinked')).toBeNull()
    expect(queryByText('family.group.linkAction')).toBeNull()
  })
})
