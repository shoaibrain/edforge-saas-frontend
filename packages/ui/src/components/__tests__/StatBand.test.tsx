/**
 * StatBand — unit + contract tests (S1).
 *
 * Verifies the handoff contract: one segment per metric, calm-by-default color
 * driven by `state`, exactly one micro-viz per metric composed from existing
 * primitives, live-only pulse, accessible segments, reduced-motion, and
 * RTL-safe logical properties. See docs/design-system/handoff-token-map.md.
 */
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatBand, type StatMetric } from '../StatBand'

const icon = <span data-testid="ic" />

describe('StatBand', () => {
  it('renders one segment per metric from the metrics config', () => {
    const metrics: StatMetric[] = [
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
      { label: 'C', value: '3' },
    ]
    render(<StatBand metrics={metrics} />)
    expect(screen.getAllByRole('status')).toHaveLength(3)
    expect(screen.getByRole('group', { name: 'Key metrics' })).toBeTruthy()
  })

  it('drives the single accent color from each metric.state', () => {
    render(
      <StatBand
        metrics={[
          { label: 'At-risk', value: '20', state: 'critical' },
          { label: 'Attendance', value: '0%', state: 'warn' },
        ]}
      />,
    )
    const critical = screen.getByRole('status', { name: 'At-risk: 20' })
    expect(critical.querySelector('.text-\\[rgb\\(var\\(--state-danger-fg\\)\\)\\]')).toBeTruthy()
    const warn = screen.getByRole('status', { name: 'Attendance: 0%' })
    expect(warn.querySelector('.text-\\[rgb\\(var\\(--state-warning-fg\\)\\)\\]')).toBeTruthy()
  })

  it('renders a neutral value for state="normal" (no semantic color)', () => {
    render(<StatBand metrics={[{ label: 'Enrolled', value: '255', state: 'normal' }]} />)
    const seg = screen.getByRole('status', { name: 'Enrolled: 255' })
    expect(seg.getAttribute('data-state')).toBe('normal')
    expect(seg.querySelector('.text-\\[rgb\\(var\\(--text-primary\\)\\)\\]')).toBeTruthy()
    // no attention tick for a normal segment
    expect(seg.querySelector('[aria-hidden="true"].absolute.inset-x-4.top-0')).toBeNull()
  })

  it('keeps a neutral value for state="good" unless emphasizeValue opts in', () => {
    render(
      <StatBand
        metrics={[
          { label: 'Collected', value: 'NPR 8,000', state: 'good' },
          { label: 'Paid', value: 'NPR 20,000', state: 'good', emphasizeValue: true },
        ]}
      />,
    )
    const plain = screen.getByRole('status', { name: 'Collected: NPR 8,000' })
    expect(plain.querySelector('.text-3xl')?.className).toContain('text-[rgb(var(--text-primary))]')
    const emphasized = screen.getByRole('status', { name: 'Paid: NPR 20,000' })
    expect(emphasized.querySelector('.text-3xl')?.className).toContain(
      'text-[rgb(var(--state-success-fg))]',
    )
  })

  it('renders exactly one micro-viz per metric (delta only, no pill)', () => {
    render(<StatBand metrics={[{ label: 'Enrolled', value: '255', delta: { dir: 'up', val: '+6' } }]} />)
    expect(screen.getByText('+6')).toBeTruthy()
  })

  it('renders the status pill by composing StatusPill', () => {
    render(
      <StatBand
        metrics={[{ label: 'At-risk', value: '20', state: 'critical', pill: { tone: 'critical', text: '20 critical' } }]}
      />,
    )
    // StatusPill renders a bordered span with the danger tokens.
    const pill = screen.getByText('20 critical')
    expect(pill.className).toContain('border')
    expect(pill.className).toContain('state-danger-fg')
  })

  it('renders the SABER meter by composing AnimatedProgressBar with a target notch', () => {
    const { container } = render(
      <StatBand metrics={[{ label: 'Attendance', value: '0%', state: 'warn', meter: { pct: 0, target: 90 } }]} />,
    )
    expect(screen.getByRole('progressbar')).toBeTruthy()
    // the target notch is positioned via a logical inline-start offset
    const notch = container.querySelector('span[aria-hidden="true"][style*="inset-inline-start"]')
    expect(notch).toBeTruthy()
    expect((notch as HTMLElement).style.insetInlineStart).toBe('90%')
  })

  it('renders the readiness donut by composing the shared Ring primitive', () => {
    const { container } = render(
      <StatBand metrics={[{ label: 'Readiness', value: '50%', donut: { pct: 50 } }]} />,
    )
    // Ring renders an <svg> with a track + progress circle (two circles).
    const circles = container.querySelectorAll('svg circle')
    expect(circles.length).toBe(2)
  })

  it('applies the live pulse only for state="live"', () => {
    const { container } = render(
      <StatBand
        metrics={[
          { label: 'Live Now', value: '1', state: 'live', icon },
          { label: 'Total', value: '10', state: 'normal', icon },
        ]}
      />,
    )
    const pulses = container.querySelectorAll('.motion-reduce\\:hidden')
    expect(pulses.length).toBe(1)
  })

  it('exposes each segment as role="status" with an accessible label', () => {
    render(<StatBand metrics={[{ label: 'Grade Levels', value: '13' }]} />)
    expect(screen.getByRole('status', { name: 'Grade Levels: 13' })).toBeTruthy()
  })

  it('draws a divider between segments (first segment has none)', () => {
    // App is LTR-only (en + ne); physical `border-s` renders reliably in this
    // Tailwind build where logical `border-s` did not.
    render(
      <StatBand
        metrics={[
          { label: 'A', value: '1' },
          { label: 'B', value: '2' },
        ]}
      />,
    )
    const segs = screen.getAllByRole('status')
    expect(segs[1].className).toContain('border-s')
    expect(segs[0].className).toContain('first:border-l-0')
  })

  it('renders an animated-icon signature and marks the segment ef-motion', () => {
    const { container } = render(
      <StatBand metrics={[{ label: 'Enrolled', value: '255', iconSignature: 'students' }]} />,
    )
    const seg = screen.getByRole('status', { name: 'Enrolled: 255' })
    // `.ef-motion` lets the AnimatedIcon signature hover-replay (CSS-driven).
    expect(seg.className).toContain('ef-motion')
    // AnimatedIcon renders an <svg> glyph inside the chip.
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders a clickable segment as a toggle button and fires onClick', () => {
    const onClick = vi.fn()
    render(
      <StatBand
        metrics={[
          { label: 'Awaiting', value: '1', state: 'warn', active: true, onClick },
        ]}
      />,
    )
    const btn = screen.getByRole('button', { name: 'Awaiting: 1' })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    btn.click()
    expect(onClick).toHaveBeenCalled()
  })

  it('warns at runtime if a metric is given more than one micro-viz', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { label: 'X', value: '1', delta: { dir: 'up', val: '+1' }, pill: { tone: 'good', text: 'ok' } }
    render(<StatBand metrics={[bad as unknown as StatMetric]} />)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('only one is allowed'))
    warn.mockRestore()
  })
})
