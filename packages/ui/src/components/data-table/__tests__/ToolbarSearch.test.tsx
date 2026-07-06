/**
 * ToolbarSearch — regression net for the UAT search-overlap defect.
 *
 * The failure class was an OVERLAY construction: an absolutely-positioned icon
 * over the input plus a hand-tuned compensating `padding-left`. These tests
 * fail if that construction ever returns — the icon must be a flex SIBLING and
 * the input must carry no left-padding compensation. They also lock the
 * trailing magnifier ⇄ ✕ morph, the removed `/` chip, and the `/`/Esc keys.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { useState } from 'react'
import { ToolbarSearch } from '../ToolbarSearch'

function Harness({ initial = '', onChangeSpy }: { initial?: string; onChangeSpy?: (v: string) => void }) {
  const [value, setValue] = useState(initial)
  return (
    <ToolbarSearch
      value={value}
      onChange={(v) => {
        setValue(v)
        onChangeSpy?.(v)
      }}
      placeholder="Search receipts or students…"
      aria-label="Search payments"
    />
  )
}

afterEach(cleanup)

describe('ToolbarSearch — no overlay construction (regression net)', () => {
  it('never absolutely positions the icon over the input', () => {
    const { container } = render(<Harness />)
    // The whole failure mode is a layered icon. Nothing in the field may be
    // absolutely/fixed positioned over the text.
    expect(container.querySelector('[class*="absolute"]')).toBeNull()
    expect(container.querySelector('[class*="fixed"]')).toBeNull()
  })

  it('carries no compensating left padding on the input', () => {
    render(<Harness />)
    const input = screen.getByPlaceholderText('Search receipts or students…')
    // ps-3 (12px) is the field's own inset — anything larger means the input is
    // dodging an overlaid icon, i.e. the bug is back.
    expect(input.className).toMatch(/(^|\s)ps-3(\s|$)/)
    expect(input.className).not.toMatch(/ps-(7|8|9|10|11|12)/)
  })

  it('renders the icon slot AFTER the input (trailing), as a sibling button', () => {
    const { container } = render(<Harness />)
    const wrapper = container.firstElementChild as HTMLElement
    const input = wrapper.querySelector('input')!
    const button = wrapper.querySelector('button')!
    // DOM order: input first, action button (icon) after it.
    expect(input.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(button.querySelector('svg')).toBeTruthy()
  })
})

describe('ToolbarSearch — no `/` chip, shortcut lives in the tooltip', () => {
  it('has no visible `/` kbd chip and documents the shortcut in title', () => {
    const { container } = render(<Harness />)
    expect(container.querySelector('kbd')).toBeNull()
    const input = screen.getByPlaceholderText('Search receipts or students…')
    expect(input.getAttribute('title')).toBe('Press / to search')
  })

  it('focuses the field when `/` is pressed outside any field', () => {
    render(<Harness />)
    const input = screen.getByPlaceholderText('Search receipts or students…') as HTMLInputElement
    expect(document.activeElement).not.toBe(input)
    fireEvent.keyDown(document.body, { key: '/' })
    expect(document.activeElement).toBe(input)
  })

  it('does not hijack `/` while typing in another field', () => {
    render(
      <>
        {/* eslint-disable-next-line edforge-design-system/prefer-ui-form-controls -- test fixture */}
        <input data-testid="other" />
        <Harness />
      </>,
    )
    const other = screen.getByTestId('other') as HTMLInputElement
    other.focus()
    fireEvent.keyDown(other, { key: '/' })
    expect(document.activeElement).toBe(other)
  })
})

describe('ToolbarSearch — trailing action morphs to clear', () => {
  it('exposes the magnifier (not a clear button) while empty', () => {
    render(<Harness />)
    const button = screen.getByRole('button', { hidden: true })
    expect(button.getAttribute('tabindex')).toBe('-1')
    expect(button.getAttribute('aria-hidden')).toBe('true')
  })

  it('becomes a real clear button with a value; clears and refocuses', () => {
    const onChangeSpy = vi.fn()
    render(<Harness initial="aakriti" onChangeSpy={onChangeSpy} />)
    const button = screen.getByRole('button', { name: 'Clear search' })
    expect(button.getAttribute('tabindex')).toBe('0')
    fireEvent.click(button)
    expect(onChangeSpy).toHaveBeenLastCalledWith('')
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('Search receipts or students…'),
    )
  })

  it('Escape clears then blurs the field', () => {
    const onChangeSpy = vi.fn()
    render(<Harness initial="aakriti" onChangeSpy={onChangeSpy} />)
    const input = screen.getByPlaceholderText('Search receipts or students…') as HTMLInputElement
    input.focus()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onChangeSpy).toHaveBeenLastCalledWith('')
    expect(document.activeElement).not.toBe(input)
  })
})
