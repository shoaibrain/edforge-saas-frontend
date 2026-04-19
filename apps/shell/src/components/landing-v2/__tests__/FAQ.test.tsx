import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { FAQ } from '../sections/faq/FAQ'
import { FAQ as FAQ_STRINGS } from '../landing.strings'

describe('FAQ', () => {
  afterEach(() => cleanup())

  it('renders the heading + eyebrow', () => {
    const { getByRole, getByText } = render(<FAQ />)
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(/Have questions/i)
    expect(getByText('FAQS')).toBeInTheDocument()
  })

  it('renders 6 question triggers with aria-expanded state', () => {
    const { getAllByRole } = render(<FAQ />)
    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(FAQ_STRINGS.items.length)
  })

  it('opens the first item by default per design spec', () => {
    const { getAllByRole } = render(<FAQ />)
    const buttons = getAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')
  })

  it('clicking item 3 closes item 1 and opens item 3', () => {
    const { getAllByRole } = render(<FAQ />)
    const buttons = getAllByRole('button')
    fireEvent.click(buttons[2])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true')
  })

  it('renders every question and its answer text', () => {
    const { getByText } = render(<FAQ />)
    for (const item of FAQ_STRINGS.items) {
      expect(getByText(item.q)).toBeInTheDocument()
      expect(getByText(item.a)).toBeInTheDocument()
    }
  })
})
