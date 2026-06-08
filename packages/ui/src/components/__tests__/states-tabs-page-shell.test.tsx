import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  Button,
  EmptyState,
  ErrorState,
  InlineAlert,
  LoadingState,
  PageShell,
  SegmentedControl,
  Tabs,
} from '../../index'

describe('state primitives', () => {
  it('renders semantic inline alerts', () => {
    render(
      <InlineAlert variant="warning" title="Heads up">
        Calendar defaults may need review.
      </InlineAlert>
    )

    expect(screen.getByRole('status').textContent).toContain('Heads up')
    expect(screen.getByText('Calendar defaults may need review.')).toBeTruthy()
  })

  it('renders empty, loading, and error states with actions', () => {
    render(
      <>
        <EmptyState title="No schools yet" action={<Button>Add school</Button>} />
        <LoadingState label="Loading settings" />
        <ErrorState title="Could not load settings" action={<Button variant="outline">Retry</Button>} />
      </>
    )

    expect(screen.getByText('No schools yet')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Add school' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Loading settings')
    expect(screen.getByRole('alert').textContent).toContain('Could not load settings')
  })
})

describe('Tabs', () => {
  it('renders accessible tabs and handles selection', () => {
    let selected = 'hierarchy'
    const { rerender } = render(
      <Tabs
        value={selected}
        onChange={(next) => {
          selected = next
        }}
        tabs={[
          { id: 'hierarchy', label: 'Hierarchy', count: 3 },
          { id: 'details', label: 'Details' },
        ]}
      />
    )

    expect(screen.getByRole('tab', { name: /Hierarchy/ }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    rerender(
      <Tabs
        value={selected}
        onChange={(next) => {
          selected = next
        }}
        tabs={[
          { id: 'hierarchy', label: 'Hierarchy', count: 3 },
          { id: 'details', label: 'Details' },
        ]}
      />
    )
    expect(screen.getByRole('tab', { name: 'Details' }).getAttribute('aria-selected')).toBe('true')
  })

  it('moves selection with arrow keys and roving tabindex', () => {
    const onChange = vi.fn()
    render(
      <Tabs
        value="hierarchy"
        onChange={onChange}
        tabs={[
          { id: 'hierarchy', label: 'Hierarchy' },
          { id: 'details', label: 'Details' },
        ]}
      />
    )

    const tablist = screen.getByRole('tablist')
    const selectedTab = screen.getByRole('tab', { name: 'Hierarchy' })
    const otherTab = screen.getByRole('tab', { name: 'Details' })
    expect(selectedTab.getAttribute('tabindex')).toBe('0')
    expect(otherTab.getAttribute('tabindex')).toBe('-1')

    fireEvent.keyDown(tablist, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('details')
  })
})

describe('SegmentedControl', () => {
  it('exposes group semantics with aria-pressed buttons', () => {
    render(
      <SegmentedControl
        aria-label="Density"
        value="comfortable"
        onChange={() => {}}
        tabs={[
          { id: 'comfortable', label: 'Comfortable' },
          { id: 'compact', label: 'Compact' },
        ]}
      />
    )

    expect(screen.getByRole('group', { name: 'Density' })).toBeTruthy()
    const selected = screen.getByRole('button', { name: 'Comfortable' })
    expect(selected.getAttribute('aria-pressed')).toBe('true')
    expect(selected.getAttribute('role')).not.toBe('tab')
  })
})

describe('PageShell', () => {
  it('renders semantic main layout with recipe width classes', () => {
    render(<PageShell variant="wizard">Wizard body</PageShell>)

    const main = screen.getByRole('main')
    expect(main.className).toContain('max-w-3xl')
    expect(main.textContent).toBe('Wizard body')
  })
})
