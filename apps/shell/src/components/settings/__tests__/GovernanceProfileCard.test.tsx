import { describe, it, expect, beforeEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { GovernanceProfileCard } from '../GovernanceProfileCard'

/**
 * GF3.4 — the panel reads the *resolved* archetype profile and the GF3.1
 * feature matrix. These tests pin the operator-facing contract: PABSON locks
 * NPR / Asia/Kathmandu / Bikram Sambat, GENERIC leaves them open, and the
 * degrade rules (NPL→PABSON, unknown→GENERIC) hold here exactly as in the
 * registry — so a regression in resolution surfaces as a visible UI change.
 */
describe('GovernanceProfileCard', () => {
  beforeEach(() => cleanup())

  const card = () => document.querySelector('[data-testid="governance-profile-card"]') as HTMLElement

  it('shows PABSON-locked regional defaults', () => {
    render(<GovernanceProfileCard archetype="PABSON" country="NPL" />)
    const text = card().textContent ?? ''
    expect(text).toContain('PABSON')
    expect(text).toContain('NPR')
    expect(text).toContain('Asia/Kathmandu')
    expect(text).toContain('Bikram Sambat')
  })

  it('shows GENERIC as operator-choice across the board', () => {
    render(<GovernanceProfileCard archetype="GENERIC" country="USA" />)
    const text = card().textContent ?? ''
    expect(text).toContain('Generic')
    // currency/timezone/calendar all unconstrained → no lock, three "Operator's choice"
    const matches = text.match(/Operator's choice/g) ?? []
    expect(matches.length).toBe(3)
  })

  it('degrades a Nepal tenant with no archetype to the PABSON profile', () => {
    render(<GovernanceProfileCard archetype={null} country="NPL" />)
    const text = card().textContent ?? ''
    expect(text).toContain('PABSON')
    expect(text).toContain('NPR')
  })

  it('degrades an unknown archetype to GENERIC', () => {
    render(<GovernanceProfileCard archetype="CBSE_IN" country="IND" />)
    const text = card().textContent ?? ''
    expect(text).toContain('Generic')
    expect(text).toContain("Operator's choice")
  })

  it('renders a lock indicator only on the locked rows for PABSON', () => {
    render(<GovernanceProfileCard archetype="PABSON" country="NPL" />)
    const locks = within(card()).queryAllByLabelText('Locked by governance body')
    // currency + timezone + calendar are each locked to one value
    expect(locks.length).toBe(3)
  })
})
