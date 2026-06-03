import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'

// Mutable holders, hoisted so the vi.mock factories can read them safely.
const h = vi.hoisted(() => ({
  ctx: { archetype: null as string | null, country: null as string | null },
}))

vi.mock('@edforge/forms', () => ({ useTenantContext: () => h.ctx }))
vi.mock('react-i18next', () => ({
  // identity translator — assert on the labelKey, not a locale string
  useTranslation: () => ({ t: (k: string) => k }),
}))

import { EntityIdDisplay } from '../EntityIdDisplay'
import { UuidBadge } from '../UuidBadge'

const PABSON_STUDENT = {
  emisStudentId: '1708400128200043',
  studentNumber: 'SSSEB-2026-00044',
  id: 'uuid-1',
}

afterEach(cleanup)

describe('<EntityIdDisplay> — PABSON student', () => {
  beforeEach(() => {
    h.ctx = { archetype: 'PABSON', country: 'NPL' }
  })

  it('renders the EMIS id as primary and studentNumber as secondary (stacked)', () => {
    const { getByTestId } = render(
      <EntityIdDisplay entity="student" data={PABSON_STUDENT} variant="stacked" />,
    )
    const root = getByTestId('entity-id-display')
    expect(root.textContent).toContain('1708400128200043')
    expect(root.textContent).toContain('identifiers.emisStudentId') // label
    expect(getByTestId('entity-id-secondary').textContent).toBe('SSSEB-2026-00044')
  })

  it('masks the EMIS id (government PII) when masked, hiding digits + secondary leak', () => {
    const { getByTestId, queryByTestId } = render(
      <EntityIdDisplay entity="student" data={PABSON_STUDENT} variant="stacked" masked />,
    )
    const root = getByTestId('entity-id-display')
    expect(root.textContent).not.toContain('1708400128200043')
    expect(root.getAttribute('aria-label')).toContain('hidden')
    // secondary is suppressed while masked so the EMIS isn't inferable
    expect(queryByTestId('entity-id-secondary')).toBeNull()
  })

  it('falls back to studentNumber when the EMIS id is missing', () => {
    const { getByTestId } = render(
      <EntityIdDisplay
        entity="student"
        data={{ studentNumber: 'SSSEB-2026-00044', id: 'uuid-1' }}
        variant="stacked"
      />,
    )
    expect(getByTestId('entity-id-display').textContent).toContain('SSSEB-2026-00044')
  })
})

describe('<EntityIdDisplay> — GENERIC tenant', () => {
  beforeEach(() => {
    h.ctx = { archetype: 'GENERIC', country: null }
  })

  it('renders the studentNumber (no EMIS) and is not masked even when masked=true', () => {
    const { getByTestId } = render(
      <EntityIdDisplay entity="student" data={PABSON_STUDENT} variant="stacked" masked />,
    )
    const root = getByTestId('entity-id-display')
    // GENERIC student id is not sensitive → masking is a no-op
    expect(root.textContent).toContain('SSSEB-2026-00044')
    expect(root.textContent).not.toContain('1708400128200043')
  })
})

describe('<UuidBadge>', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('renders a truncated value (never the raw full UUID) with a copy button', () => {
    const { getByRole, container } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    expect(container.textContent).toContain('41136dda…8280')
    expect(container.textContent).not.toContain('41136dda-a0e1-7083-7cb2-985af50d8280')
    expect(getByRole('button')).toBeTruthy()
  })

  it('copies the FULL value to the clipboard on click', () => {
    const { getByRole } = render(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" />)
    fireEvent.click(getByRole('button'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('41136dda-a0e1-7083-7cb2-985af50d8280')
  })

  it('renders an em dash for an empty value and dots when masked', () => {
    const { container, rerender } = render(<UuidBadge value="" />)
    expect(container.textContent).toBe('—')
    rerender(<UuidBadge value="41136dda-a0e1-7083-7cb2-985af50d8280" masked />)
    expect(container.textContent).toContain('••••••••')
    expect(container.textContent).not.toContain('41136dda')
  })
})
