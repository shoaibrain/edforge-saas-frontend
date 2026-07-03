/**
 * WidgetCard — 12-col spans, one-of metric|link, required body slot, and
 * first-class loading/empty states.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { WidgetCard, WidgetGrid } from '../dashboard/WidgetCard'

afterEach(() => cleanup())

describe('WidgetGrid', () => {
  it('lays out a 12-column grid', () => {
    const { container } = render(
      <WidgetGrid>
        <WidgetCard title="A">body</WidgetCard>
      </WidgetGrid>,
    )
    expect(container.firstElementChild?.className).toContain('grid-cols-12')
  })
})

describe('WidgetCard', () => {
  it('maps span to a md:col-span class (full width on mobile)', () => {
    const { container } = render(<WidgetCard title="A" span={8}>body</WidgetCard>)
    const section = container.querySelector('section') as HTMLElement
    expect(section.className).toContain('col-span-12')
    expect(section.className).toContain('md:col-span-8')
  })

  it('renders the body when state is ready', () => {
    render(<WidgetCard title="Attendance">Chart body</WidgetCard>)
    expect(screen.getByText('Chart body')).toBeTruthy()
  })

  it('renders a shimmer skeleton (not the body) when loading', () => {
    const { container } = render(
      <WidgetCard title="A" state="loading">Hidden body</WidgetCard>,
    )
    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByText('Hidden body')).toBeNull()
  })

  it('renders the empty state (not the body) when empty', () => {
    render(
      <WidgetCard title="A" state="empty" empty={{ title: 'No data yet', subtitle: 'come back later' }}>
        Hidden body
      </WidgetCard>,
    )
    expect(screen.getByText('No data yet')).toBeTruthy()
    expect(screen.getByText('come back later')).toBeTruthy()
    expect(screen.queryByText('Hidden body')).toBeNull()
  })

  it('renders a link affordance on the right', () => {
    render(<WidgetCard title="A" link={{ label: 'View all', href: '/students' }}>b</WidgetCard>)
    const link = screen.getByRole('link', { name: /view all/i })
    expect(link.getAttribute('href')).toBe('/students')
  })

  it('renders a quiet metric affordance on the right', () => {
    render(<WidgetCard title="A" metric="18.8% today">b</WidgetCard>)
    expect(screen.getByText('18.8% today')).toBeTruthy()
  })

  it('renders an optional footer', () => {
    render(<WidgetCard title="A" footer={<span>View Finance</span>}>b</WidgetCard>)
    expect(screen.getByText('View Finance')).toBeTruthy()
  })
})
