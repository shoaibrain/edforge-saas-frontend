import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { AttendanceTrend } from '../AttendanceTrend'

describe('AttendanceTrend', () => {
  afterEach(() => cleanup())

  it('renders an area sparkline (two paths + end dot) when series has >= 2 points', () => {
    const { container } = render(<AttendanceTrend rate={73} series={[88, 84, 79, 72, 76, 70, 73]} />)
    expect(container.querySelectorAll('svg path')).toHaveLength(2) // area + line
    expect(container.querySelector('svg circle')).toBeTruthy() // end dot
  })

  it('falls back to a bar (no spark svg) when only a rate is provided', () => {
    const { container } = render(<AttendanceTrend rate={73} />)
    // No sparkline <path>; the bar is plain divs.
    expect(container.querySelector('svg path')).toBeNull()
    expect(container.textContent).toContain('73%')
  })

  it('renders an em-dash and "no data" label when neither rate nor series is given', () => {
    const { getByLabelText, container } = render(<AttendanceTrend />)
    expect(getByLabelText('Attendance: no data')).toBeTruthy()
    expect(container.textContent).toContain('—')
  })

  it('treats a single-point series as "rate only" (no sparkline)', () => {
    const { container } = render(<AttendanceTrend series={[91]} />)
    expect(container.querySelector('svg path')).toBeNull()
    expect(container.textContent).toContain('91%')
  })

  it('applies the 90%-at-risk threshold colors (not the 60/80 dashboard scheme)', () => {
    // jsdom serializes hex inline styles to rgb(). 85% must be WARNING
    // (#EF9F27 = rgb(239,159,39)), proving the 80/90 model — under 60/80 it
    // would be GOOD.
    const warn = render(<AttendanceTrend rate={85} />)
    expect(warn.container.innerHTML).toContain('rgb(239, 159, 39)')
    cleanup()
    const danger = render(<AttendanceTrend rate={79.9} />)
    expect(danger.container.innerHTML).toContain('rgb(226, 75, 74)')
    cleanup()
    const good = render(<AttendanceTrend rate={90} />)
    expect(good.container.innerHTML).toContain('rgb(29, 158, 117)')
  })

  it('exposes a descriptive aria-label including the trend direction', () => {
    const { getByRole } = render(<AttendanceTrend rate={73} series={[80, 75, 73]} trend="declining" />)
    expect(getByRole('img').getAttribute('aria-label')).toBe('Attendance 73 percent, trend declining')
  })

  it('renders a trend caret only when trend is provided', () => {
    const withTrend = render(<AttendanceTrend rate={73} trend="improving" />)
    const before = withTrend.container.querySelectorAll('svg').length
    cleanup()
    const without = render(<AttendanceTrend rate={73} />)
    const after = without.container.querySelectorAll('svg').length
    expect(before).toBeGreaterThan(after)
  })

  it('formats the percentage in the requested locale (Devanagari for ne-NP)', () => {
    const { container } = render(<AttendanceTrend rate={73} locale="ne-NP" />)
    // ne-NP renders 73 as ७३
    expect(container.textContent).toContain('७३')
  })
})
