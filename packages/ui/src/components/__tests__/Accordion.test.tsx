import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { Accordion } from '../Accordion'

const ITEMS = [
  { id: 'a', trigger: 'Question A', panel: 'Answer A' },
  { id: 'b', trigger: 'Question B', panel: 'Answer B' },
  { id: 'c', trigger: 'Question C', panel: 'Answer C' },
]

describe('Accordion', () => {
  afterEach(() => cleanup())

  it('renders a button per item with aria-expanded=false by default', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button')
    expect(buttons).toHaveLength(3)
    for (const b of buttons) {
      expect(b.getAttribute('aria-expanded')).toBe('false')
    }
  })

  it('opens an item via click and toggles aria-expanded', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button')
    fireEvent.click(buttons[1])
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(buttons[1])
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false')
  })

  it('single-open mode closes the previous item when another opens', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} defaultOpenId="a" />)
    const buttons = getAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(buttons[2])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true')
  })

  it('allowMultiple lets more than one item stay open', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} allowMultiple />)
    const buttons = getAllByRole('button')
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[2])
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true')
  })

  it('ArrowDown moves focus to the next trigger (and wraps)', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button') as HTMLButtonElement[]
    buttons[0].focus()
    fireEvent.keyDown(buttons[0], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[1])
    fireEvent.keyDown(buttons[1], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[2])
    fireEvent.keyDown(buttons[2], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(buttons[0]) // wraps
  })

  it('ArrowUp moves focus to the previous trigger (and wraps)', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button') as HTMLButtonElement[]
    buttons[0].focus()
    fireEvent.keyDown(buttons[0], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(buttons[2]) // wraps
  })

  it('Home / End jump to first / last trigger', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button') as HTMLButtonElement[]
    buttons[1].focus()
    fireEvent.keyDown(buttons[1], { key: 'End' })
    expect(document.activeElement).toBe(buttons[2])
    fireEvent.keyDown(buttons[2], { key: 'Home' })
    expect(document.activeElement).toBe(buttons[0])
  })

  it('links trigger → panel via aria-controls / aria-labelledby', () => {
    const { getAllByRole } = render(<Accordion items={ITEMS} />)
    const buttons = getAllByRole('button')
    fireEvent.click(buttons[1])
    const panelId = buttons[1].getAttribute('aria-controls')!
    const panel = document.getElementById(panelId)!
    expect(panel.getAttribute('aria-labelledby')).toBe(buttons[1].id)
  })

  it('supports controlled mode via openId + onChange', () => {
    const onChange = vi.fn()
    const { rerender, getAllByRole } = render(
      <Accordion items={ITEMS} openId="a" onChange={onChange} />
    )
    let buttons = getAllByRole('button')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(buttons[2])
    expect(onChange).toHaveBeenCalledWith('c')
    // Parent must rerender; simulate it.
    rerender(<Accordion items={ITEMS} openId="c" onChange={onChange} />)
    buttons = getAllByRole('button')
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true')
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false')
  })
})
