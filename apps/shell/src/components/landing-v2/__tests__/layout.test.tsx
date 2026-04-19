import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Container } from '../components/layout/Container'
import { Eyebrow } from '../components/layout/Eyebrow'
import { Hairline } from '../components/layout/Hairline'

describe('Container', () => {
  it('renders with the default lp-container class', () => {
    const { container } = render(<Container>x</Container>)
    expect((container.firstChild as HTMLElement).className).toMatch(/\blp-container\b/)
    cleanup()
  })

  it('adds lp-container--wide when wide is true', () => {
    const { container } = render(<Container wide>x</Container>)
    expect((container.firstChild as HTMLElement).className).toMatch(/lp-container--wide/)
    cleanup()
  })

  it('accepts and renders an id', () => {
    const { container } = render(<Container id="sec-1">x</Container>)
    expect((container.firstChild as HTMLElement).id).toBe('sec-1')
    cleanup()
  })
})

describe('Eyebrow', () => {
  it('renders uppercase tracked label', () => {
    const { getByText } = render(<Eyebrow>For district leaders</Eyebrow>)
    const el = getByText('For district leaders')
    expect(el.style.textTransform).toBe('uppercase')
    expect(el.style.letterSpacing).toBe('0.14em')
    cleanup()
  })

  it('accepts a color override', () => {
    const { getByText } = render(<Eyebrow color="#ff0000">Accent</Eyebrow>)
    expect(getByText('Accent').style.color).toBe('rgb(255, 0, 0)')
    cleanup()
  })
})

describe('Hairline', () => {
  it('renders a horizontal separator', () => {
    const { getByRole } = render(<Hairline />)
    const sep = getByRole('separator')
    expect(sep.getAttribute('aria-orientation')).toBe('horizontal')
    cleanup()
  })
})
