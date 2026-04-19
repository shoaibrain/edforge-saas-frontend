import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { UseCasePanel } from '../components/UseCasePanel'
import type { UseCaseFeature } from '../landing.strings'

const FEATURES: UseCaseFeature[] = [
  { id: 'one', title: 'Feature one', description: 'Desc one', start: 0 },
  { id: 'two', title: 'Feature two', description: 'Desc two', start: 10 },
  { id: 'three', title: 'Feature three', description: 'Desc three', start: 20 },
  { id: 'four', title: 'Feature four', description: 'Desc four', start: 30 },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof UseCasePanel>> = {}) {
  return render(
    <UseCasePanel
      sectionId="test"
      eyebrow="EYEBROW"
      heading={{ lead: 'Lead', serif: 'serif', tail: 'tail' }}
      lede="lede text"
      accent="var(--lp-primary)"
      features={FEATURES}
      videoSrc="/x.mp4"
      videoLength="1:00"
      dashboardFallback={<div>dashboard</div>}
      {...overrides}
    />
  )
}

describe('UseCasePanel', () => {
  afterEach(() => cleanup())

  it('renders the eyebrow, heading, and lede', () => {
    const { getByText, getByRole } = renderPanel()
    expect(getByText('EYEBROW')).toBeInTheDocument()
    expect(getByText('lede text')).toBeInTheDocument()
    expect(getByRole('heading', { level: 2 }).textContent).toMatch(/Lead/)
  })

  it('renders a tablist with one tab per feature', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab')
    expect(tabs).toHaveLength(4)
  })

  it('marks the first tab active by default', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab')
    expect(tabs[0].getAttribute('aria-selected')).toBe('true')
    expect(tabs[1].getAttribute('aria-selected')).toBe('false')
  })

  it('clicking a tab sets it active', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab')
    fireEvent.click(tabs[2])
    expect(tabs[2].getAttribute('aria-selected')).toBe('true')
    expect(tabs[0].getAttribute('aria-selected')).toBe('false')
  })

  it('ArrowDown on a tab moves focus & selection to the next tab', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab') as HTMLButtonElement[]
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'ArrowDown' })
    expect(tabs[1].getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(tabs[1])
  })

  it('ArrowUp on the first tab wraps to the last tab', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab') as HTMLButtonElement[]
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'ArrowUp' })
    expect(tabs[tabs.length - 1].getAttribute('aria-selected')).toBe('true')
  })

  it('End key jumps to the last tab', () => {
    const { getAllByRole } = renderPanel()
    const tabs = getAllByRole('tab') as HTMLButtonElement[]
    tabs[0].focus()
    fireEvent.keyDown(tabs[0], { key: 'End' })
    expect(tabs[tabs.length - 1].getAttribute('aria-selected')).toBe('true')
  })

  it('links the active tab to the panel via aria-labelledby', () => {
    const { getAllByRole, getByRole } = renderPanel()
    const tabs = getAllByRole('tab')
    const panel = getByRole('tabpanel')
    fireEvent.click(tabs[2])
    expect(panel.getAttribute('aria-labelledby')).toContain('test-tab-three')
  })

  it('renders dashboard fallback when showMode="dashboard"', () => {
    const { getByText, container } = renderPanel({ showMode: 'dashboard' })
    expect(getByText('dashboard')).toBeInTheDocument()
    expect(container.querySelector('video')).toBeNull()
  })
})
