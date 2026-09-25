/// <reference types="@testing-library/jest-dom" />
/**
 * FamilyTab — Grant Portal Access visibility (#373 F3).
 *
 * The control used to be gated on `!hasPortalAccess`, so it disappeared for
 * exactly the guardians whose portal link was broken (flag true, user link
 * destroyed). These tests pin the widened condition: the control follows
 * `email` + the handler, never the advisory flag.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen } from '@testing-library/react'

// The billing family-group panel consumes the M0 useFamily hooks; it is not
// under test here, so it is stubbed out to keep this suite query-client free.
vi.mock('../FamilyGroupPanel', () => ({
  FamilyGroupPanel: () => <div data-testid="mock-family-group-panel" />,
}))

// i18n is not initialized in the unit test environment (repo convention).
// Echo the key so assertions are independent of the loaded resource bundle.
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return String(opts.defaultValue)
      return key
    },
  }),
}))

import { FamilyTab } from '../FamilyTab'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

type Guardian = NonNullable<StudentProfileResponseDto['guardians']>[number]

const GRANT_LABEL = 'actions.grantPortalAccess'

function makeGuardian(overrides: Partial<Guardian> = {}): Guardian {
  return {
    guardianId: 'g-1',
    firstName: 'Bina',
    lastName: 'Thapa',
    relationship: 'mother',
    email: 'guardian.one@example.test',
    phone: '+9779800000000',
    isPrimary: true,
    hasPortalAccess: false,
    canPickup: true,
    ...overrides,
  } as Guardian
}

function makeStudent(guardians: Guardian[]): StudentProfileResponseDto {
  return {
    studentId: 's-1',
    firstName: 'Nisha',
    lastName: 'Rai',
    guardians,
    emergencyContacts: [],
  } as unknown as StudentProfileResponseDto
}

/** The row's action bar only exists once the row is expanded. */
function expandFirstRow() {
  fireEvent.click(screen.getByLabelText('Expand'))
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('FamilyTab — Grant Portal Access control visibility', () => {
  it('renders the control for a guardian whose hasPortalAccess is already true', () => {
    const onGrantPortalAccess = vi.fn()
    render(
      <FamilyTab
        student={makeStudent([makeGuardian({ hasPortalAccess: true })])}
        onGrantPortalAccess={onGrantPortalAccess}
        canEdit
      />,
    )
    expandFirstRow()

    expect(screen.getByText(GRANT_LABEL)).toBeInTheDocument()
  })

  it('still renders the control for a guardian whose hasPortalAccess is false', () => {
    render(
      <FamilyTab
        student={makeStudent([makeGuardian({ hasPortalAccess: false })])}
        onGrantPortalAccess={vi.fn()}
        canEdit
      />,
    )
    expandFirstRow()

    expect(screen.getByText(GRANT_LABEL)).toBeInTheDocument()
  })

  it('invokes the handler with the guardian when the control is clicked in the flag-true state', () => {
    const onGrantPortalAccess = vi.fn()
    const guardian = makeGuardian({ hasPortalAccess: true })
    render(
      <FamilyTab
        student={makeStudent([guardian])}
        onGrantPortalAccess={onGrantPortalAccess}
        canEdit
      />,
    )
    expandFirstRow()
    fireEvent.click(screen.getByText(GRANT_LABEL))

    expect(onGrantPortalAccess).toHaveBeenCalledTimes(1)
    expect(onGrantPortalAccess).toHaveBeenCalledWith(
      expect.objectContaining({ guardianId: 'g-1', hasPortalAccess: true }),
    )
  })

  it('hides the control when the guardian has no email address', () => {
    render(
      <FamilyTab
        student={makeStudent([makeGuardian({ hasPortalAccess: true, email: undefined })])}
        onGrantPortalAccess={vi.fn()}
        canEdit
      />,
    )
    expandFirstRow()

    expect(screen.queryByText(GRANT_LABEL)).toBeNull()
  })

  it('hides the control when no grant handler is supplied (read-only viewer)', () => {
    render(
      <FamilyTab student={makeStudent([makeGuardian({ hasPortalAccess: true })])} canEdit />,
    )
    expandFirstRow()

    expect(screen.queryByText(GRANT_LABEL)).toBeNull()
  })

  it('hides the control when the operator cannot edit', () => {
    render(
      <FamilyTab
        student={makeStudent([makeGuardian({ hasPortalAccess: true })])}
        onGrantPortalAccess={vi.fn()}
        canEdit={false}
      />,
    )
    expandFirstRow()

    expect(screen.queryByText(GRANT_LABEL)).toBeNull()
  })
})
