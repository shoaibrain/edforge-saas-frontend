import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { PillarCard } from '../sections/pillars/PillarCard'

const PALETTE = { bg: '#fadbc8', ink: '#8a3e1a', accent: '#f47e3e' }

describe('PillarCard', () => {
  afterEach(() => cleanup())

  it('renders title + description + visual', () => {
    const { getByText } = render(
      <PillarCard
        title="Run school operations"
        description="SIS, enrollment, attendance"
        palette={PALETTE}
        visual={<div data-testid="visual">visual</div>}
        colSpan={7}
      />
    )
    expect(getByText('Run school operations')).toBeInTheDocument()
    expect(getByText('SIS, enrollment, attendance')).toBeInTheDocument()
  })

  it('renders as an <a> with the provided href', () => {
    const { getByRole } = render(
      <PillarCard
        title="t"
        description="d"
        palette={PALETTE}
        visual={null}
        colSpan={6}
        href="/product/core"
      />
    )
    const link = getByRole('link')
    expect(link.getAttribute('href')).toBe('/product/core')
  })

  it('defaults href to "#" when not provided', () => {
    const { getByRole } = render(
      <PillarCard title="t" description="d" palette={PALETTE} visual={null} colSpan={6} />
    )
    expect(getByRole('link').getAttribute('href')).toBe('#')
  })

  it('applies the correct grid column span', () => {
    const { getByRole } = render(
      <PillarCard title="t" description="d" palette={PALETTE} visual={null} colSpan={7} />
    )
    expect((getByRole('link') as HTMLElement).style.gridColumn).toBe('span 7')
  })

  it('elevates on hover (translateY -4px)', () => {
    const { getByRole } = render(
      <PillarCard title="t" description="d" palette={PALETTE} visual={null} colSpan={6} />
    )
    const link = getByRole('link') as HTMLElement
    // default state
    expect(link.style.transform).toBe('translateY(0)')
    fireEvent.mouseEnter(link)
    expect(link.style.transform).toBe('translateY(-4px)')
    fireEvent.mouseLeave(link)
    expect(link.style.transform).toBe('translateY(0)')
  })

  it('rotates the +-button on focus (keyboard parity with hover)', () => {
    const { getByRole, container } = render(
      <PillarCard title="t" description="d" palette={PALETTE} visual={null} colSpan={6} />
    )
    const link = getByRole('link') as HTMLElement
    fireEvent.focus(link)
    const plus = container.querySelector('[aria-hidden]:last-of-type') as HTMLElement
    expect(plus.style.transform).toMatch(/rotate\(90deg\)/)
  })
})
