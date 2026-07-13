/**
 * Sheet primitive — bottom-sheet anatomy + Headless Dialog semantics.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sheet } from '../Sheet'

describe('Sheet', () => {
  it('renders a dialog with the sheet anatomy (handle, panel classes, aria)', () => {
    render(
      <Sheet open onClose={() => undefined} ariaLabel="Account">
        <p>content</p>
      </Sheet>
    )

    expect(screen.getByRole('dialog', { name: 'Account' })).toBeTruthy()

    const panel = document.querySelector('[data-presentation="sheet"]')
    expect(panel).not.toBeNull()
    expect(panel!.className).toContain('ui-sheet')
    expect(panel!.querySelector('.ui-sheet-handle')).not.toBeNull()
    expect(screen.getByText('content')).toBeTruthy()
  })

  it('renders a visible DialogTitle when title is provided', () => {
    render(
      <Sheet open onClose={() => undefined} title="Change role">
        <p>body</p>
      </Sheet>
    )
    expect(screen.getByText('Change role')).toBeTruthy()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Sheet open onClose={onClose} ariaLabel="Account">
        <p>content</p>
      </Sheet>
    )
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
