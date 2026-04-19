import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { DemoVideo } from '../components/DemoVideo'

describe('DemoVideo', () => {
  it('renders a <video> in video mode with correct autoplay attributes', () => {
    const { container } = render(
      <DemoVideo src="/landing/task-router.mp4" showMode="video" />
    )
    const video = container.querySelector('video')
    expect(video).not.toBeNull()
    expect(video?.muted).toBe(true)
    expect(video?.autoplay).toBe(true)
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

  it('renders the caption badge when caption is provided', () => {
    const { getByText } = render(
      <DemoVideo src="/x.mp4" caption="Budget clarity, not spreadsheets" />
    )
    expect(getByText('Budget clarity, not spreadsheets')).toBeInTheDocument()
    cleanup()
  })

  it('renders a play/pause button with accessible label', () => {
    const { getByRole } = render(<DemoVideo src="/x.mp4" />)
    // Default state is "playing", so the button label should be "Pause..."
    const btn = getByRole('button', { name: /pause/i })
    expect(btn).toBeInTheDocument()
    cleanup()
  })

  it('renders a progress bar with valuenow=0 before metadata loads', () => {
    const { getByRole } = render(<DemoVideo src="/x.mp4" />)
    const bar = getByRole('progressbar', { name: /video progress/i })
    expect(bar.getAttribute('aria-valuenow')).toBe('0')
    cleanup()
  })

  it('renders duration label when `length` is provided', () => {
    const { getByText } = render(<DemoVideo src="/x.mp4" length="1:42" />)
    expect(getByText('1:42')).toBeInTheDocument()
    cleanup()
  })
})
