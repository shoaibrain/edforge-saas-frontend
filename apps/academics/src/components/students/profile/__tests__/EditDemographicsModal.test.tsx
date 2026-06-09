/// <reference types="@testing-library/jest-dom" />
/**
 * EditDemographicsModal — component tests
 *
 * Covers dropdown population (sourced from listDescriptorUris), the dynamic
 * disabilities array, conditional scholarshipCategory, and the final PATCH
 * payload shape (empty strings become undefined; empty disability rows are
 * dropped).
 *
 * The form controls are @edforge/ui primitives (Select/Input/Checkbox/Textarea),
 * so the dropdowns are Headless UI listboxes — assert via the open-and-pick
 * pattern (`getByRole('button')` → click → `findByRole('option')`), not native
 * `<select>` DOM. Only Modal/ModalFooter/Button are stubbed; the form controls
 * are the real primitives.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as EdforgeUi from '@edforge/ui'
import { getDisplayName, listDescriptorUris } from '@aibrains/shared-types'

// Capture the mutation function so we can assert what the modal submits.
const mutateAsyncSpy = vi.fn().mockResolvedValue({ studentId: 's-1' })
vi.mock('../../../../hooks', () => ({
  useUpdateStudentDescriptors: () => ({
    mutateAsync: mutateAsyncSpy,
    isPending: false,
  }),
}))

// Keep the real form primitives (Field/Input/Select/Checkbox/Textarea); only
// Modal/ModalFooter/Button render as passthroughs to avoid the Dialog portal +
// focus-trap machinery and keep the test focused on form behavior.
vi.mock('@edforge/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof EdforgeUi>()),
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

  it('populates the sex dropdown from listDescriptorUris("SexDescriptor")', async () => {
    const user = userEvent.setup()
    render(<EditDemographicsModal student={makeStudent()} onClose={() => {}} />)

    // Open the Sex listbox (the trigger is labelled "Sex" via the Field label).
    await user.click(screen.getByRole('button', { name: 'Sex' }))

    // The "not specified" placeholder leads, followed by each SexDescriptor URI
    // rendered through getDisplayName.
    expect(await screen.findByRole('option', { name: '— Not specified —' })).toBeInTheDocument()
    const expectedLabels = listDescriptorUris('SexDescriptor').map((uri) => getDisplayName(uri, 'en'))
    expect(expectedLabels.length).toBeGreaterThanOrEqual(1)
    for (const label of expectedLabels) {
      expect(screen.getByRole('option', { name: label })).toBeInTheDocument()
    }
  })

  it('shows scholarshipCategory input only when belowPovertyLine is checked', () => {
    render(<EditDemographicsModal student={makeStudent()} onClose={() => {}} />)
    expect(screen.queryByPlaceholderText(/Dalit/i)).toBeNull()

    const below = screen.getByLabelText(/below poverty line/i)
    fireEvent.click(below)
    expect(screen.queryByPlaceholderText(/Dalit/i)).not.toBeNull()

    fireEvent.click(below) // uncheck
    expect(screen.queryByPlaceholderText(/Dalit/i)).toBeNull()
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

    // Sex select trigger reflects the hydrated descriptor's display name.
    const sexLabel = getDisplayName('uri://ed-fi.org/SexDescriptor#Male', 'en')
    expect(screen.getByRole('button', { name: 'Sex' })).toHaveTextContent(sexLabel)

    // Ethnicity + scholarship inputs hydrate from the student.
    expect(screen.getByDisplayValue('uri://ed-fi.org/EthnicityDescriptor#Dalit')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Janajati')).toBeInTheDocument()

    // One disability row hydrated from the student.
    expect(container.querySelectorAll('[data-testid^="disability-row-"]').length).toBe(1)
  })

  it('submits a PATCH payload with empty strings collapsed and empty disability rows dropped', async () => {
    const onClose = vi.fn()
    const { container, getByTestId } = render(
      <EditDemographicsModal
        student={makeStudent({
          sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Female',
        })}
        onClose={onClose}
      />,
    )

    // Toggle belowPovertyLine ON then OFF so the form is dirty but the
    // scholarshipCategory field is hidden again (i.e. not included in patch).
    const below = screen.getByLabelText(/below poverty line/i)
    fireEvent.click(below)
    fireEvent.click(below)

    // Add an empty disability row — it should be dropped from the payload.
    fireEvent.click(getByTestId('add-disability'))

    // Also flip isTransferred ON to prove boolean flags are always present.
    const transferred = screen.getByLabelText(/transferred from another school/i)
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
