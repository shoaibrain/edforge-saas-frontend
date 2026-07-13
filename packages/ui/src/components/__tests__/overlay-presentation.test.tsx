/**
 * Modal/Drawer presentation branching — automatic bottom sheet below 640px,
 * classic centered/side dialog otherwise, per-call `presentation` override.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Modal } from '../Modal'
import { Drawer } from '../Drawer'

const originalMatchMedia = window.matchMedia

/** Width-aware matchMedia override (same shape as the global setup stub). */
function setViewportWidth(width: number) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/\(min-width:\s*(\d+(?:\.\d+)?)px\)/)
    const max = query.match(/\(max-width:\s*(\d+(?:\.\d+)?)px\)/)
    let matches = false
    if (min || max) {
      matches =
        (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    }
    return {
      matches,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function panel() {
  const el = document.querySelector('[data-presentation]')
  expect(el).not.toBeNull()
  return el!
}

describe('Modal presentation', () => {
  it('renders centered on desktop', () => {
    setViewportWidth(1280)
    render(
      <Modal open onClose={() => undefined} title="Edit">
        <p>body</p>
      </Modal>
    )
    expect(panel().getAttribute('data-presentation')).toBe('center')
    expect(panel().className).not.toContain('ui-sheet')
  })

  it('renders as a bottom sheet on phone', () => {
    setViewportWidth(375)
    render(
      <Modal open onClose={() => undefined} title="Edit">
        <p>body</p>
      </Modal>
    )
    const el = panel()
    expect(el.getAttribute('data-presentation')).toBe('sheet')
    expect(el.className).toContain('ui-sheet')
    expect(el.querySelector('.ui-sheet-handle')).not.toBeNull()
    // Header (title + close) survives the presentation change
    expect(screen.getByText('Edit')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close modal' })).toBeTruthy()
  })

  it('presentation="center" forces the centered dialog on phone', () => {
    setViewportWidth(375)
    render(
      <Modal open onClose={() => undefined} title="Edit" presentation="center">
        <p>body</p>
      </Modal>
    )
    expect(panel().getAttribute('data-presentation')).toBe('center')
  })
})

describe('Drawer presentation', () => {
  it('renders as the right slide-over on desktop', () => {
    setViewportWidth(1280)
    render(
      <Drawer open onClose={() => undefined} title="Details">
        <p>body</p>
      </Drawer>
    )
    expect(panel().getAttribute('data-presentation')).toBe('side')
  })

  it('renders as a bottom sheet on phone, keeping the pinned footer', () => {
    setViewportWidth(375)
    render(
      <Drawer
        open
        onClose={() => undefined}
        title="Details"
        footer={<button type="button">Save</button>}
      >
        <p>body</p>
      </Drawer>
    )
    const el = panel()
    expect(el.getAttribute('data-presentation')).toBe('sheet')
    expect(el.className).toContain('ui-sheet')
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy()
  })

  it('presentation="side" forces the slide-over on phone', () => {
    setViewportWidth(375)
    render(
      <Drawer open onClose={() => undefined} title="Details" presentation="side">
        <p>body</p>
      </Drawer>
    )
    expect(panel().getAttribute('data-presentation')).toBe('side')
  })
})
