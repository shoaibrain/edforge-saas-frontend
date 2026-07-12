import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DemoVideo } from '../components/DemoVideo'

describe('DemoVideo', () => {
  it('renders a muted looping <video> without the autoplay attribute (plays on visibility)', () => {
    const { container } = render(
      <DemoVideo src="/landing/task-router.mp4" showMode="video" />
    )
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.muted).toBe(true)
    // Playback starts via IntersectionObserver, not the autoplay attribute —
    // below-the-fold videos must not all decode on page load.
    expect(video?.autoplay).toBe(false)
    expect(video?.loop).toBe(true)
    expect(video?.playsInline).toBe(true)
    expect(video?.getAttribute('src')).toBe('/landing/task-router.mp4')
    cleanup()
  })

  it('renders only the dashboard fallback in dashboard mode (no <video>)', () => {
    const { container, getByText } = render(
      <DemoVideo src="/x.mp4" showMode="dashboard">
        <div>Static dashboard mock</div>
      </DemoVideo>
    )
    expect(container.querySelector('video')).toBeNull()
    expect(getByText('Static dashboard mock')).toBeInTheDocument()
    cleanup()
  })

  it('renders a play/pause button with accessible label', () => {
    const { getByRole } = render(<DemoVideo src="/x.mp4" />)
    // Default state is "playing", so the button label should be "Pause..."
    const btn = getByRole('button', { name: /pause/i })
    expect(btn).toBeInTheDocument()
    cleanup()
  })

  it('renders a keyboard-operable seek slider with valuenow=0 before metadata loads', () => {
    const { getByRole } = render(<DemoVideo src="/x.mp4" />)
    const bar = getByRole('slider', { name: /seek video/i })
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    expect(bar.getAttribute('tabindex')).toBe('0')
    cleanup()
  })
})
