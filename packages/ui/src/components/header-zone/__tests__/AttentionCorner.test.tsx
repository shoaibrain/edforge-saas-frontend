import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, act, waitFor } from '@testing-library/react'
import { AttentionCorner, AttentionCornerPill, AttentionCornerShade } from '../AttentionCorner'
import type { Signal } from '../Signal'

afterEach(cleanup)

const SIGNALS: Signal[] = [
  {
    id: 'info-1',
    severity: 'info',
    domain: 'Data quality',
    title: 'Unrecorded attendance today',
    fix: { label: 'Take attendance', onAction: vi.fn() },
  },
  {
    id: 'crit-1',
    severity: 'critical',
    domain: 'Attendance',
    title: 'Students below 80%',
    description: '30-day period',
    fix: { label: 'View details', onAction: vi.fn() },
  },
  {
    id: 'warn-1',
    severity: 'warn',
    domain: 'Attendance',
    title: 'Students below 90%',
  },
]

function renderCorner(props: Partial<React.ComponentProps<typeof AttentionCorner>> = {}) {
  return render(
    <AttentionCorner signals={SIGNALS} {...props}>
      <AttentionCornerPill />
      <AttentionCornerShade />
    </AttentionCorner>,
  )
}

describe('AttentionCorner — pill', () => {
  it('shows severity-segmented counts and the need-attention label', () => {
    const { getByRole } = renderCorner()
    const pill = getByRole('button', { expanded: false })
    // one of each severity
    expect(pill.textContent).toContain('1')
    expect(pill.textContent).toContain('need attention')
  })

  it('excludes acknowledged signals from the pill count but keeps them in the shade', () => {
    const { getByRole, getByText } = renderCorner({ acked: ['crit-1'], onUnack: vi.fn() })
    const pill = getByRole('button', { expanded: false })
    fireEvent.click(pill)
    // Acked critical remains visible in the shade as an "Acknowledged" chip.
    expect(getByText('Acknowledged')).toBeTruthy()
    expect(getByText('Students below 80%')).toBeTruthy()
  })

  it('renders the mint all-clear state when no live signals remain', () => {
    const { getByText } = render(
      <AttentionCorner signals={[]}>
        <AttentionCornerPill />
        <AttentionCornerShade />
      </AttentionCorner>,
    )
    expect(getByText('All clear')).toBeTruthy()
  })

  it('toggles aria-expanded and opens the shade region', () => {
    const { getByRole, queryByRole } = renderCorner()
    expect(queryByRole('region')).toBeNull()
    const pill = getByRole('button', { expanded: false })
    fireEvent.click(pill)
    expect(pill.getAttribute('aria-expanded')).toBe('true')
    expect(getByRole('region', { name: 'Needs attention' })).toBeTruthy()
  })
})

describe('AttentionCorner — shade rows', () => {
  it('ranks rows critical → warn → info', () => {
    const { getByRole, getAllByRole } = renderCorner()
    fireEvent.click(getByRole('button', { expanded: false }))
    const rows = getAllByRole('listitem')
    expect(rows[0].textContent).toContain('Students below 80%')
    expect(rows[1].textContent).toContain('Students below 90%')
    expect(rows[2].textContent).toContain('Unrecorded attendance today')
  })

  it('critical rows offer acknowledge (no dismiss); warn/info offer dismiss (no ack)', () => {
    const { getByRole, getAllByRole } = renderCorner({ onAck: vi.fn() })
    fireEvent.click(getByRole('button', { expanded: false }))
    const [crit, warn] = getAllByRole('listitem')
    expect(crit.querySelector('[aria-label^="Got it"]')).toBeTruthy()
    expect(crit.querySelector('[aria-label^="Dismiss"]')).toBeNull()
    expect(warn.querySelector('[aria-label^="Dismiss"]')).toBeTruthy()
    expect(warn.querySelector('[aria-label^="Got it"]')).toBeNull()
  })

  it('acknowledge fires onAck after the pop; the chip un-acknowledges via onUnack', () => {
    vi.useFakeTimers()
    const onAck = vi.fn()
    const onUnack = vi.fn()
    const { getByRole, getByText, rerender } = render(
      <AttentionCorner signals={SIGNALS} onAck={onAck} onUnack={onUnack}>
        <AttentionCornerPill />
        <AttentionCornerShade />
      </AttentionCorner>,
    )
    fireEvent.click(getByRole('button', { expanded: false }))
    fireEvent.click(getByRole('button', { name: /^Got it/ }))
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(onAck).toHaveBeenCalledWith('crit-1')
    // Simulate the app persisting the ack.
    rerender(
      <AttentionCorner signals={SIGNALS} acked={['crit-1']} onAck={onAck} onUnack={onUnack}>
        <AttentionCornerPill />
        <AttentionCornerShade />
      </AttentionCorner>,
    )
    fireEvent.click(getByText('Acknowledged'))
    expect(onUnack).toHaveBeenCalledWith('crit-1')
    vi.useRealTimers()
  })

  it('dismiss removes the row for the session', () => {
    const { getByRole, getAllByRole, queryByText } = renderCorner()
    fireEvent.click(getByRole('button', { expanded: false }))
    const warnRow = getAllByRole('listitem')[1]
    fireEvent.click(warnRow.querySelector('[aria-label^="Dismiss"]') as HTMLElement)
    expect(queryByText('Students below 90%')).toBeNull()
  })

  it('Escape closes the shade and returns focus to the pill', async () => {
    const { getByRole, queryByRole } = renderCorner()
    const pill = getByRole('button', { expanded: false })
    fireEvent.click(pill)
    fireEvent.keyDown(window, { key: 'Escape' })
    // Collapsed state is immediate; the region unmounts after the exit animation.
    expect(pill.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(pill)
    await waitFor(() => expect(queryByRole('region')).toBeNull())
  })

  it('auto-resolves: a signal that stops being emitted disappears', () => {
    const { getByRole, queryByText, rerender } = renderCorner()
    fireEvent.click(getByRole('button', { expanded: false }))
    rerender(
      <AttentionCorner signals={SIGNALS.filter((s) => s.id !== 'info-1')}>
        <AttentionCornerPill />
        <AttentionCornerShade />
      </AttentionCorner>,
    )
    expect(queryByText('Unrecorded attendance today')).toBeNull()
  })
})
