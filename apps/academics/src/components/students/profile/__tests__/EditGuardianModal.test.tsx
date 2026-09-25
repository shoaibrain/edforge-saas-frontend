/// <reference types="@testing-library/jest-dom" />
/**
 * EditGuardianModal — component tests
 *
 * The defect (shoaibrain/edforge-saas-frontend#373 F2) was that nothing
 * consumed `editGuardianId`, so Edit Guardian was inert. These tests pin the
 * two behaviours that make the replacement modal correct rather than merely
 * present: it hydrates from the guardian matched by `guardianId`, and it
 * submits the WHOLE guardians array with only that entry replaced — spreading
 * the stored guardian so `guardianId`, `hasPortalAccess` and fields the form
 * does not expose survive the write.
 *
 * Only Modal/ModalFooter/Button are stubbed; the form controls are the real
 * @edforge/ui primitives, matching the EditDemographicsModal test pattern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import type * as EdforgeUi from '@edforge/ui'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

const mutateAsyncSpy = vi.fn().mockResolvedValue({ studentId: 's-1' })
vi.mock('../../../../hooks', () => ({
  useUpdateStudent: () => ({
    mutateAsync: mutateAsyncSpy,
    isPending: false,
  }),
}))

vi.mock('@edforge/forms', () => ({
  useTenantContext: () => ({ archetype: 'PABSON', country: 'NPL' }),
}))

vi.mock('@edforge/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof EdforgeUi>()),
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, ...rest }: React.ComponentProps<'button'>) => <button {...rest}>{children}</button>,
}))

import { EditGuardianModal } from '../EditGuardianModal'

const GUARDIAN_A = {
  guardianId: 'g-1',
  firstName: 'Bimala',
  lastName: 'Thapa',
  relationship: 'mother' as const,
  email: 'bimala@example.com',
  phone: '9800000001',
  isPrimary: true,
  canPickup: true,
  hasPortalAccess: true,
  occupation: 'Teacher',
  alternatePhone: '9800000009',
}

const GUARDIAN_B = {
  guardianId: 'g-2',
  firstName: 'Ramesh',
  lastName: 'Thapa',
  relationship: 'uncle' as const,
  email: 'ramesh@example.com',
  phone: '9800000002',
  isPrimary: false,
  canPickup: false,
  hasPortalAccess: false,
}

function makeStudent(overrides: Record<string, unknown> = {}): StudentProfileResponseDto {
  return {
    studentId: 's-1',
    fullName: 'Test Student',
    guardians: [GUARDIAN_A, GUARDIAN_B],
    ...overrides,
  } as StudentProfileResponseDto
}

describe('EditGuardianModal', () => {
  beforeEach(() => {
    cleanup()
    mutateAsyncSpy.mockClear()
  })

  it('hydrates the form from the guardian matched by guardianId', () => {
    render(
      <EditGuardianModal open onClose={() => {}} student={makeStudent()} guardianId="g-2" />,
    )

    expect(screen.getByDisplayValue('Ramesh')).toBeInTheDocument()
    expect(screen.getByDisplayValue('ramesh@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('9800000002')).toBeInTheDocument()
    // The other guardian's values must not leak into the form.
    expect(screen.queryByDisplayValue('Bimala')).toBeNull()
  })

  it('renders nothing when guardianId matches no guardian', () => {
    const { container } = render(
      <EditGuardianModal open onClose={() => {}} student={makeStudent()} guardianId="g-missing" />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('replaces only the edited guardian and preserves its unexposed fields', async () => {
    const onClose = vi.fn()
    const { container } = render(
      <EditGuardianModal open onClose={onClose} student={makeStudent()} guardianId="g-1" />,
    )

    fireEvent.change(screen.getByDisplayValue('9800000001'), {
      target: { value: '9812345678' },
    })

    fireEvent.submit(container.querySelector('form')!)

    await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalledTimes(1))
    const { studentId, data } = mutateAsyncSpy.mock.calls[0][0]

    expect(studentId).toBe('s-1')
    // The whole array is submitted, not just the edited entry.
    expect(data.guardians).toHaveLength(2)

    const edited = data.guardians[0]
    expect(edited.phone).toBe('9812345678')
    expect(edited.guardianId).toBe('g-1')
    // Spread-first is what keeps these alive through the write.
    expect(edited.hasPortalAccess).toBe(true)
    expect(edited.occupation).toBe('Teacher')
    expect(edited.alternatePhone).toBe('9800000009')

    // The untouched guardian is passed through byte-identical.
    expect(data.guardians[1]).toEqual(GUARDIAN_B)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('accepts a relationship outside the add-form subset', () => {
    // GUARDIAN_B is an 'uncle' — a value the enrolment form can produce but
    // AddGuardianModal's five-value enum cannot. It must still hydrate.
    render(
      <EditGuardianModal open onClose={() => {}} student={makeStudent()} guardianId="g-2" />,
    )
    expect(screen.getByRole('button', { name: /relationship/i })).toHaveTextContent('Uncle')
  })
})
