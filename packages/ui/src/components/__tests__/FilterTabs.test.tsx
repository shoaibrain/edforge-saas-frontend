import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterTabs } from '../FilterTabs'

const tabs = [
  { key: 'all', label: 'All', count: 12 },
  { key: 'active', label: 'Active', count: 4 },
  { key: 'archived', label: 'Archived' },
]

describe('FilterTabs', () => {
  it('renders semantic tabs with the active tab selected', () => {
    render(<FilterTabs tabs={tabs} activeTab="active" onTabChange={() => undefined} />)

    expect(screen.getByRole('tab', { name: /All/ }).getAttribute('aria-selected')).toBe('false')
    expect(screen.getByRole('tab', { name: /Active/ }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('calls onTabChange when a tab is clicked', async () => {
    const onTabChange = vi.fn()
    render(<FilterTabs tabs={tabs} activeTab="all" onTabChange={onTabChange} />)

    await userEvent.click(screen.getByRole('tab', { name: /Archived/ }))

    expect(onTabChange).toHaveBeenCalledWith('archived')
  })

  it('supports arrow-key roving focus', async () => {
    render(<FilterTabs tabs={tabs} activeTab="all" onTabChange={() => undefined} />)

    const all = screen.getByRole('tab', { name: /All/ })
    const active = screen.getByRole('tab', { name: /Active/ })
    const archived = screen.getByRole('tab', { name: /Archived/ })

    all.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(active)

    await userEvent.keyboard('{End}')
    expect(document.activeElement).toBe(archived)

    await userEvent.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(all)
  })
})
