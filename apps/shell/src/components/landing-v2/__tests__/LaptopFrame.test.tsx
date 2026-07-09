import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LaptopFrame } from '../sections/hero/LaptopFrame'

describe('LaptopFrame', () => {
  it('renders an autoplay <video> with muted + loop + playsInline when not in fallback', () => {
    const { container } = render(<LaptopFrame staticFallback={false} />)
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    // muted/autoplay/loop/playsInline are reflected as properties on HTMLVideoElement
    expect(video?.muted).toBe(true)
    expect(video?.autoplay).toBe(true)
    expect(video?.loop).toBe(true)
    expect(video?.playsInline).toBe(true)
    expect(video?.preload).toBe('metadata')
    expect(video?.getAttribute('src')).toContain('platform-overview.mp4')
    cleanup()
  })

  it('labels the video for assistive tech', () => {
    const { container } = render(<LaptopFrame staticFallback={false} />)
    const video = container.querySelector('video')
    expect(video?.getAttribute('aria-label')).toMatch(/Edforge platform overview/)
    cleanup()
  })

  it('renders the static product dashboard (no <video>) when staticFallback is true', () => {
    const { container, getByText } = render(<LaptopFrame staticFallback={true} />)
    expect(container.querySelector('video')).toBeNull()
    expect(getByText('Sample data')).toBeInTheDocument()
    cleanup()
  })

  it('does NOT autoplay when staticFallback is true (defensive)', () => {
    const { container } = render(<LaptopFrame staticFallback={true} />)
    // Guarantee: if the staticFallback branch ever accidentally keeps a
    // <video>, this test fails because no <video> should be present.
    expect(container.querySelector('[autoplay]')).toBeNull()
    cleanup()
  })
})
