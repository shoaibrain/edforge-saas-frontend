import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LandingRoot } from '../LandingRoot'

describe('LandingRoot', () => {
  afterEach(() => {
    cleanup()
    delete document.documentElement.dataset.surface
  })

  it('sets data-surface="landing" on the document element when mounted', () => {
    render(<LandingRoot>child</LandingRoot>)
    expect(document.documentElement.dataset.surface).toBe('landing')
  })

  it('clears data-surface on unmount when no previous value existed', () => {
    const { unmount } = render(<LandingRoot>child</LandingRoot>)
    unmount()
    expect(document.documentElement.dataset.surface).toBeUndefined()
  })

  it('restores a previous data-surface value on unmount', () => {
    document.documentElement.dataset.surface = 'authed'
    const { unmount } = render(<LandingRoot>child</LandingRoot>)
    expect(document.documentElement.dataset.surface).toBe('landing')
    unmount()
    expect(document.documentElement.dataset.surface).toBe('authed')
  })

  it('renders a <main> landmark wrapping children', () => {
    const { getByRole } = render(
      <LandingRoot>
        <p>content</p>
      </LandingRoot>
    )
    const main = getByRole('main')
    expect(main).toBeInTheDocument()
    expect(main.id).toBe('lp-main')
    expect(main.textContent).toBe('content')
  })
})
