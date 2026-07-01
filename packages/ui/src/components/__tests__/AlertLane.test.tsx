/**
 * AlertLane — behaviour locked by the dashboard handoff:
 * severity order, critical=Acknowledge (no ×), warn/info=dismiss (no ack),
 * session-only state (reset via resetKey), all-clear + collapse-to-chip, a11y.
 *
 * Reduced motion is forced on so framer-motion enter/exit is instant and
 * dismiss removals are synchronous in jsdom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { AlertLane, type DashboardAlert } from '../dashboard/AlertLane'

function forceReducedMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const alerts: DashboardAlert[] = [
  { id: 'i', severity: 'info', title: 'Info title', description: 'info desc', cta: { label: 'Do info', onAction: vi.fn() } },
  { id: 'c', severity: 'critical', title: 'Crit title', description: 'crit desc', cta: { label: 'Review billing', onAction: vi.fn() } },
  { id: 'w', severity: 'warning', title: 'Warn title', description: 'warn desc' },
]

const rowOf = (title: string) =>
  screen.getByText(title).closest('[role="alert"],[role="status"]') as HTMLElement

describe('AlertLane', () => {
  beforeEach(() => {
    cleanup()
    forceReducedMotion()
  })

  it('exposes the lane as a labelled region', () => {
    render(<AlertLane alerts={alerts} />)
    expect(screen.getByRole('region', { name: 'Alerts' })).toBeTruthy()
  })

  it('orders alerts critical → warning → info regardless of input order', () => {
    const { container } = render(<AlertLane alerts={alerts} />)
    const rows = Array.from(container.querySelectorAll('[role="alert"],[role="status"]'))
    expect(rows.map((r) => r.textContent)).toHaveLength(3)
    expect(rows[0].textContent).toContain('Crit title')
    expect(rows[1].textContent).toContain('Warn title')
    expect(rows[2].textContent).toContain('Info title')
  })

  it('gives a critical alert Acknowledge (role=alert) and no dismiss', () => {
    render(<AlertLane alerts={alerts} />)
    const crit = rowOf('Crit title')
    expect(crit.getAttribute('role')).toBe('alert')
    expect(within(crit).getByRole('button', { name: /acknowledge/i })).toBeTruthy()
    expect(within(crit).queryByRole('button', { name: /dismiss/i })).toBeNull()
  })

  it('gives warning/info a dismiss + cta (role=status) and no Acknowledge', () => {
    render(<AlertLane alerts={alerts} />)
    const warn = rowOf('Warn title')
    expect(warn.getAttribute('role')).toBe('status')
    expect(within(warn).getByRole('button', { name: /dismiss/i })).toBeTruthy()
    expect(within(warn).queryByRole('button', { name: /acknowledge/i })).toBeNull()
    const info = rowOf('Info title')
    expect(within(info).getByRole('button', { name: 'Do info' })).toBeTruthy()
  })

  it('dismissing a warning removes it (session state)', () => {
    render(<AlertLane alerts={alerts} />)
    fireEvent.click(within(rowOf('Warn title')).getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Warn title')).toBeNull()
    // the others remain
    expect(screen.getByText('Crit title')).toBeTruthy()
  })

  it('shows the all-clear strip when nothing is live', () => {
    render(<AlertLane alerts={[]} />)
    expect(screen.getByText(/all caught up/i)).toBeTruthy()
  })

  it('collapses to a summary chip and re-expands', () => {
    render(<AlertLane alerts={alerts} />)
    fireEvent.click(screen.getByRole('button', { name: /minimize/i }))
    const chip = screen.getByRole('button', { name: /items need attention/i })
    expect(chip.textContent).toContain('3 items need attention')
    fireEvent.click(chip)
    expect(screen.getByText('Crit title')).toBeTruthy()
  })

  it('resets acknowledged/dismissed state when resetKey changes', () => {
    const { rerender } = render(<AlertLane alerts={alerts} resetKey="admin" />)
    fireEvent.click(within(rowOf('Warn title')).getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Warn title')).toBeNull()
    rerender(<AlertLane alerts={alerts} resetKey="teacher" />)
    expect(screen.getByText('Warn title')).toBeTruthy()
  })
})
