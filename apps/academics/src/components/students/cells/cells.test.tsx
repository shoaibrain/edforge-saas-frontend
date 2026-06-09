import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import type { GuardianDto } from '@aibrains/shared-types'
import { GradeChip } from './GradeChip'
import { StudentLocationCell } from './StudentLocationCell'
import { GuardianCell } from './GuardianCell'

const g = (over: Partial<GuardianDto>): GuardianDto => ({
  relationship: 'father',
  firstName: 'Ram',
  lastName: 'Sah',
  isPrimary: false,
  hasPortalAccess: false,
  canPickup: true,
  ...over,
})

describe('GradeChip', () => {
  afterEach(() => cleanup())
  it('renders the local grade code verbatim', () => {
    expect(render(<GradeChip grade="ECD" />).container.textContent).toBe('ECD')
  })
  it('renders an em-dash when empty', () => {
    expect(render(<GradeChip grade={undefined} />).container.textContent).toBe('—')
  })
})

describe('StudentLocationCell', () => {
  afterEach(() => cleanup())
  it('renders municipality + district', () => {
    const { container } = render(
      <StudentLocationCell address={{ municipality: 'Kshireshwarnath', district: 'Dhanusha', country: 'NPL' }} />,
    )
    expect(container.textContent).toContain('Kshireshwarnath')
    expect(container.textContent).toContain('Dhanusha')
  })
  it('renders an em-dash when no address', () => {
    expect(render(<StudentLocationCell address={undefined} />).container.textContent).toBe('—')
  })
})

describe('GuardianCell', () => {
  afterEach(() => cleanup())

  it('shows the empty state when there are no guardians', () => {
    expect(render(<GuardianCell guardians={[]} />).container.textContent).toContain('No guardian on file')
    cleanup()
    expect(render(<GuardianCell guardians={undefined} />).container.textContent).toContain('No guardian on file')
  })

  it('summarizes the primary guardian first regardless of input order', () => {
    const { getByRole } = render(
      <GuardianCell
        guardians={[
          g({ firstName: 'Gita', relationship: 'mother', isPrimary: false }),
          g({ firstName: 'Mohan', relationship: 'father', isPrimary: true }),
        ]}
      />,
    )
    // The trigger's accessible name names the primary (Mohan), not Gita.
    expect(getByRole('button').getAttribute('aria-label')).toContain('primary Mohan')
  })

  it('renders a +N overflow chip past three guardians', () => {
    const { container } = render(
      <GuardianCell
        guardians={[g({ firstName: 'A' }), g({ firstName: 'B' }), g({ firstName: 'C' }), g({ firstName: 'D' }), g({ firstName: 'E' })]}
      />,
    )
    expect(container.textContent).toContain('+2')
  })

  it('opens a popover listing every guardian with relationship + badges', () => {
    const { getByRole } = render(
      <GuardianCell
        guardians={[
          g({ firstName: 'Mohan', relationship: 'father', isPrimary: true, hasPortalAccess: true }),
          g({ firstName: 'Gita', relationship: 'mother' }),
        ]}
      />,
    )
    fireEvent.click(getByRole('button'))
    const dialog = getByRole('dialog')
    expect(within(dialog).getByText('Mohan Sah')).toBeTruthy()
    expect(within(dialog).getByText('Gita Sah')).toBeTruthy()
    // Each guardian's relationship is surfaced (not just Primary/Pickup badges).
    expect(within(dialog).getByText('Father')).toBeTruthy()
    expect(within(dialog).getByText('Mother')).toBeTruthy()
    expect(within(dialog).getAllByText(/Primary|Portal|Pickup/i).length).toBeGreaterThan(0)
  })

  it('maps the "guardian" relationship to "Legal Guardian"', () => {
    const { getByRole } = render(
      <GuardianCell guardians={[g({ firstName: 'Ram', relationship: 'guardian', isPrimary: true })]} />,
    )
    fireEvent.click(getByRole('button'))
    expect(within(getByRole('dialog')).getByText('Legal Guardian')).toBeTruthy()
  })
})
