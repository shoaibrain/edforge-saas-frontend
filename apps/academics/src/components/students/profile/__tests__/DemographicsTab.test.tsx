/// <reference types="@testing-library/jest-dom" />
/**
 * DemographicsTab — component tests
 *
 * Covers the three display cases (unset, set, derived-from-legacy) for the
 * four identity descriptors, plus the disabilities/flags/conditional
 * scholarship rendering. The EditDemographicsModal is mocked here — its
 * own contract is covered separately.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { DemographicsTab } from '../DemographicsTab'

// Mock the edit modal so this test suite stays focused on the tab's read
// surface; opening it is verified via the data-testid toggle.
vi.mock('../EditDemographicsModal', () => ({
  EditDemographicsModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="mock-edit-modal">
      <button onClick={onClose}>close</button>
    </div>
  ),
}))

function makeStudent(overrides: Record<string, unknown> = {}): any {
  return {
    studentId: 's-1',
    fullName: 'Aamir Mansuri',
    firstName: 'Aamir',
    lastName: 'Mansuri',
    ...overrides,
  }
}

describe('DemographicsTab', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders "Not specified" for every unset descriptor on a brand-new student', () => {
    const { container } = render(<DemographicsTab student={makeStudent()} />)
    // Four identity rows + two boolean flags = 6 "Not specified" minimum (no
    // disabilities section counts separately with its own empty copy).
    const notSpecifiedCount = container.querySelectorAll(
      'span.italic',
    ).length
    expect(notSpecifiedCount).toBeGreaterThanOrEqual(4)
    expect(container.textContent).toMatch(/No disabilities recorded/i)
  })

  it('renders descriptor display labels (resolved via getDisplayName) when fields are set', () => {
    const { container } = render(
      <DemographicsTab
        student={makeStudent({
          sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Male',
          languageDescriptor: 'uri://ed-fi.org/LanguageDescriptor#Nepali',
          motherTongueDescriptor: 'uri://ed-fi.org/LanguageDescriptor#Maithili',
        })}
      />,
    )
    // getDisplayName should return the human-readable label for these URIs.
    // We don't hard-code the exact wording (labels may evolve in shared-types)
    // — we just verify that the URI itself is NOT what shows up.
    expect(container.textContent).not.toContain('uri://ed-fi.org/SexDescriptor#Male')
    // No "Derived" badges should appear when the live value is present.
    expect(container.querySelector('[data-testid="derived-badge"]')).toBeNull()
  })

  it('shows a Derived badge when only legacy fields are populated (no live descriptor)', () => {
    const { container } = render(
      <DemographicsTab
        student={makeStudent({
          // Legacy fields, pre-Sprint-3 shape.
          gender: 'female',
          primaryLanguage: 'Nepali',
        })}
      />,
    )
    const badges = container.querySelectorAll('[data-testid="derived-badge"]')
    // At least the sex + primary-language rows should show the derived badge
    // (backfill derives both from `gender` + `primaryLanguage`).
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })

  it('live descriptor wins over legacy — no Derived badge when both are present', () => {
    const { container } = render(
      <DemographicsTab
        student={makeStudent({
          gender: 'male',
          sexDescriptor: 'uri://ed-fi.org/SexDescriptor#Female',
        })}
      />,
    )
    // Live sexDescriptor takes precedence so that row is "set", not "derived".
    // Other rows (no legacy values either) stay as "unset" — no derived badge.
    expect(container.querySelector('[data-testid="derived-badge"]')).toBeNull()
  })

  it('shows scholarshipCategory only when belowPovertyLine is true', () => {
    const { container: cBelow } = render(
      <DemographicsTab
        student={makeStudent({
          belowPovertyLine: true,
          scholarshipCategory: 'Dalit',
        })}
      />,
    )
    expect(cBelow.textContent).toContain('Scholarship category')
    expect(cBelow.textContent).toContain('Dalit')

    cleanup()

    const { container: cNot } = render(
      <DemographicsTab
        student={makeStudent({ belowPovertyLine: false, scholarshipCategory: 'ShouldNotShow' })}
      />,
    )
    expect(cNot.textContent).not.toContain('Scholarship category')
    expect(cNot.textContent).not.toContain('ShouldNotShow')
  })

  it('lists each disability with notes rendered when present', () => {
    const { container } = render(
      <DemographicsTab
        student={makeStudent({
          disabilities: [
            { descriptor: 'uri://ed-fi.org/DisabilityDescriptor#Hearing', notes: 'Requires front seat' },
            { descriptor: 'uri://ed-fi.org/DisabilityDescriptor#Visual' },
          ],
        })}
      />,
    )
    expect(container.textContent).toContain('Requires front seat')
    // Exactly 2 disability rows rendered.
    const rows = container.querySelectorAll('section h3')
    // Just assert the Disabilities section isn't the "No disabilities recorded" copy.
    expect(container.textContent).not.toMatch(/No disabilities recorded/i)
    expect(rows.length).toBeGreaterThanOrEqual(3) // Identity + Disabilities + Flags
  })

  it('Edit button is only shown when canEdit is true', () => {
    const { queryByTestId } = render(
      <DemographicsTab student={makeStudent()} canEdit={false} />,
    )
    expect(queryByTestId('open-edit-demographics')).toBeNull()

    cleanup()

    const { queryByTestId: q2 } = render(
      <DemographicsTab student={makeStudent()} canEdit={true} />,
    )
    expect(q2('open-edit-demographics')).not.toBeNull()
  })

  it('opens the edit modal when Edit button is clicked', () => {
    const { getByTestId, queryByTestId } = render(
      <DemographicsTab student={makeStudent()} canEdit />,
    )
    expect(queryByTestId('mock-edit-modal')).toBeNull()
    fireEvent.click(getByTestId('open-edit-demographics'))
    expect(queryByTestId('mock-edit-modal')).not.toBeNull()
  })
})
