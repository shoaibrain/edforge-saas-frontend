import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { useLandingSeo } from '../hooks/useLandingSeo'

function Harness({ title }: { title?: string }) {
  useLandingSeo(title)
  return null
}

describe('useLandingSeo', () => {
  const originalTitle = 'App title before landing'

  beforeEach(() => {
    document.title = originalTitle
    document.head
      .querySelectorAll('link[rel="canonical"]')
      .forEach((n) => n.remove())
  })

  afterEach(() => {
    cleanup()
    document.title = originalTitle
  })

  it('sets document.title to the default landing title on mount', () => {
    render(<Harness />)
    expect(document.title).toMatch(/Edforge/)
  })

  it('sets a custom title when provided', () => {
    render(<Harness title="Custom Marketing Title" />)
    expect(document.title).toBe('Custom Marketing Title')
  })

  it('inserts a canonical link when none existed', () => {
    render(<Harness />)
    const canonical = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    )
    expect(canonical).not.toBeNull()
    expect(canonical?.getAttribute('href')).toBe('https://www.edforge.app/')
  })

  it('restores the previous document.title on unmount', () => {
    const { unmount } = render(<Harness />)
    expect(document.title).not.toBe(originalTitle)
    unmount()
    expect(document.title).toBe(originalTitle)
  })

  it('removes the canonical link on unmount when it created it', () => {
    const { unmount } = render(<Harness />)
    unmount()
    expect(
      document.head.querySelector('link[rel="canonical"]')
    ).toBeNull()
  })

  it('preserves a pre-existing canonical link on unmount', () => {
    const existing = document.createElement('link')
    existing.setAttribute('rel', 'canonical')
    existing.setAttribute('href', 'https://www.edforge.app/home')
    document.head.appendChild(existing)

    const { unmount } = render(<Harness />)
    unmount()

    const restored = document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    )
    expect(restored).not.toBeNull()
    expect(restored?.getAttribute('href')).toBe('https://www.edforge.app/home')
  })
})
