/// <reference types="@testing-library/jest-dom" />
/**
 * EditDemographicsModal — component tests
 *
 * Covers dropdown population (sourced from listDescriptorUris), the dynamic
 * disabilities array, conditional scholarshipCategory, and the final PATCH
 * payload shape (empty strings become undefined; empty disability rows are
 * dropped).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'

// Capture the mutation function so we can assert what the modal submits.
const mutateAsyncSpy = vi.fn().mockResolvedValue({ studentId: 's-1' })
vi.mock('../../../../hooks', () => ({
  useUpdateStudentDescriptors: () => ({
    mutateAsync: mutateAsyncSpy,
    isPending: false,
  }),
}))

// Modal + ModalFooter + Button from @edforge/ui render as simple passthroughs
// in tests to keep focus on the form behavior.
vi.mock('@edforge/ui', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, ...rest }: any) => <button {...rest}>{children}</button>,
}))

import { EditDemographicsModal } from '../EditDemographicsModal'

function makeStudent(overrides: Record<string, unknown> = {}): any {
  return {
    studentId: 's-1',
    fullName: 'Aamir Mansuri',
    ...overrides,
  }
}

describe('EditDemographicsModal', () => {
  beforeEach(() => {
    cleanup()
    mutateAsyncSpy.mockClear()
  })

  it('populates the sex dropdown from listDescriptorUris("SexDescriptor")', () => {
    const { container } = render(
      <EditDemographicsModal student={makeStudent()} onClose={() => {}} />,
    )
    const sexSelect = container.querySelector<HTMLSelectElement>('#sexDescriptor')
    expect(sexSelect).not.toBeNull()
    // First option is the "not specified" placeholder; at least one real
    // SexDescriptor URI should follow.
    const options = Array.from(sexSelect!.options).map((o) => o.value)
    expect(options[0]).toBe('')
    expect(options.slice(1).every((v) => v.startsWith('uri://ed-fi.org/SexDescriptor'))).toBe(true)
    expect(options.length).toBeGreaterThanOrEqual(2)
  })

  it('shows scholarshipCategory input only when belowPovertyLine is checked', () => {
    const { container, getByLabelText } = render(
      <EditDemographicsModal student={makeStudent()} onClose={() => {}} />,
    )
    expect(container.querySelector('#scholarshipCategory')).toBeNull()

    const below = getByLabelText(/below poverty line/i) as HTMLInputElement
    fireEvent.click(below)
    expect(container.querySelector('#scholarshipCategory')).not.toBeNull()

    fireEvent.click(below) // uncheck
    expect(container.querySelector('#scholarshipCategory')).toBeNull()
  })

  it('adds and removes disability rows via +/- buttons', () => {
    const { container, getByTestId } = render(
      <EditDemographicsModal student={makeStudent()} onClose={() => {}} />,
    )
    expect(container.querySelectorAll('[data-testid^="disability-row-"]').length).toBe(0)

    fireEvent.click(getByTestId('add-disability'))
    fireEvent.click(getByTestId('add-disability'))
    expect(container.querySelectorAll('[data-testid^="disability-row-"]').length).toBe(2)

    const remove = container.querySelectorAll<HTMLButtonElement>(
      'button[aria-label="Remove disability"]',
    )
    fireEvent.click(remove[0])
    expect(container.querySelectorAll('[data-testid^="disability-row-"]').length).toBe(1)
  })

  it('hydrates form from existing student values', () => {
    const { container } = render(
      <EditDemographicsModal
        student={makeStudent({
          sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Male',
          ethnicityDescriptor: 'uri://ed-fi.org/EthnicityDescriptor#Dalit',
          belowPovertyLine: true,
          scholarshipCategory: 'Janajati',
          disabilities: [
            { descriptor: 'uri://ed-fi.org/DisabilityDescriptor#Hearing', notes: 'front seat' },
          ],
        })}
        onClose={() => {}}
      />,
    )
    const sexSelect = container.querySelector<HTMLSelectElement>('#sexDescriptor')!
    expect(sexSelect.value).toBe('uri://ed-fi.org/SexDescriptor#Male')

    const ethnicity = container.querySelector<HTMLInputElement>('#ethnicityDescriptor')!
    expect(ethnicity.value).toBe('uri://ed-fi.org/EthnicityDescriptor#Dalit')

    const scholar = container.querySelector<HTMLInputElement>('#scholarshipCategory')!
    expect(scholar.value).toBe('Janajati')

    // One disability row hydrated from the student.
    expect(container.querySelectorAll('[data-testid^="disability-row-"]').length).toBe(1)
  })

  it('submits a PATCH payload with empty strings collapsed and empty disability rows dropped', async () => {
    const onClose = vi.fn()
    const { container, getByTestId, getByLabelText } = render(
      <EditDemographicsModal
        student={makeStudent({
          sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Female',
        })}
        onClose={onClose}
      />,
    )

    // Toggle belowPovertyLine ON then OFF so the form is dirty but the
    // scholarshipCategory field is hidden again (i.e. not included in patch).
    const below = getByLabelText(/below poverty line/i) as HTMLInputElement
    fireEvent.click(below)
    fireEvent.click(below)

    // Add an empty disability row — it should be dropped from the payload.
    fireEvent.click(getByTestId('add-disability'))

    // Also flip isTransferred ON to prove boolean flags are always present.
    const transferred = getByLabelText(/transferred from another school/i) as HTMLInputElement
    fireEvent.click(transferred)

    const form = container.querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => expect(mutateAsyncSpy).toHaveBeenCalledTimes(1))
    const [call] = mutateAsyncSpy.mock.calls
    const patch = call[0].data

    expect(patch.sexDescriptor).toBe('uri://ed-fi.org/SexDescriptor#Female')
    expect(patch.languageDescriptor).toBeUndefined()
    expect(patch.motherTongueDescriptor).toBeUndefined()
    expect(patch.ethnicityDescriptor).toBeUndefined()
    expect(patch.isTransferred).toBe(true)
    expect(patch.belowPovertyLine).toBe(false)
    expect(patch.scholarshipCategory).toBeUndefined()
    expect(Array.isArray(patch.disabilities)).toBe(true)
    // Empty disability row was added but never filled in → dropped.
    expect(patch.disabilities).toHaveLength(0)

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})
