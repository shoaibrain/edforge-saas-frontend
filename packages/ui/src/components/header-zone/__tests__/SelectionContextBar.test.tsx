import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { SelectionContextBar, type SelectionAction } from '../SelectionContextBar'

afterEach(cleanup)

function makeActions(overrides: Partial<SelectionAction>[] = []): SelectionAction[] {
  const base: SelectionAction[] = [
    {
      id: 'remind',
      label: 'Send reminder',
      applicableIds: ['a', 'b', 'c'],
      onAction: vi.fn(),
    },
    {
      id: 'issue',
      label: 'Issue',
      applicableIds: [],
      disabledReason: 'No drafts in selection',
      onAction: vi.fn(),
    },
    {
      id: 'move',
      label: 'Change section',
      applicableIds: ['a', 'b', 'c', 'd', 'e'],
      locked: true,
      lockedReason: 'Requires Admin',
      onAction: vi.fn(),
    },
  ]
  return base.map((a, i) => ({ ...a, ...(overrides[i] ?? {}) }))
}

describe('SelectionContextBar', () => {
  it('renders as a labelled toolbar with the selection count announced politely', () => {
    const { getByRole, getAllByText } = render(
      <SelectionContextBar selectedCount={5} onClear={vi.fn()} actions={makeActions()} />,
    )
    expect(getByRole('toolbar', { name: 'Selection actions' })).toBeTruthy()
    expect(getAllByText('5 selected').length).toBeGreaterThan(0)
  })

  it('shows a count chip when an action applies to a subset, and confirms with ONLY the subset', () => {
    const actions = makeActions()
    const { getByRole } = render(
      <SelectionContextBar selectedCount={5} onClear={vi.fn()} actions={actions} />,
    )
    const remind = getByRole('button', { name: /Send reminder/ })
    expect(remind.textContent).toContain('3') // subset chip
    fireEvent.click(remind)
    expect(actions[0].onAction).toHaveBeenCalledWith(['a', 'b', 'c'])
  })

  it('disables (aria-disabled + reason tooltip) actions with no applicable rows', () => {
    const actions = makeActions()
    const { getByRole } = render(
      <SelectionContextBar selectedCount={5} onClear={vi.fn()} actions={actions} />,
    )
    const issue = getByRole('button', { name: /Issue/ })
    expect(issue.getAttribute('aria-disabled')).toBe('true')
    expect(issue.getAttribute('title')).toBe('No drafts in selection')
    fireEvent.click(issue)
    expect(actions[1].onAction).not.toHaveBeenCalled()
  })

  it('shows locked actions with a lock + reason instead of hiding them', () => {
    const actions = makeActions()
    const { getByRole } = render(
      <SelectionContextBar selectedCount={5} onClear={vi.fn()} actions={actions} />,
    )
    const move = getByRole('button', { name: /Change section/ })
    expect(move.getAttribute('aria-disabled')).toBe('true')
    expect(move.getAttribute('title')).toBe('Requires Admin')
    fireEvent.click(move)
    expect(actions[2].onAction).not.toHaveBeenCalled()
  })

  it('renders the peek strip on single-select instead of the count', () => {
    const { getByText, queryByText } = render(
      <SelectionContextBar
        selectedCount={1}
        onClear={vi.fn()}
        actions={[]}
        peek={<span>Aafrin Khatun · 78% attendance</span>}
      />,
    )
    expect(getByText('Aafrin Khatun · 78% attendance')).toBeTruthy()
    // The visible count label is replaced by the peek (sr-only live region remains).
    expect(queryByText('1 selected')?.className).toContain('sr-only')
  })

  it('offers "Select all N" when a partial page is selected', () => {
    const onSelectAll = vi.fn()
    const { getByText } = render(
      <SelectionContextBar
        selectedCount={5}
        totalCount={255}
        onSelectAll={onSelectAll}
        onClear={vi.fn()}
        actions={[]}
      />,
    )
    fireEvent.click(getByText('Select all 255'))
    expect(onSelectAll).toHaveBeenCalled()
  })

  it('clears via the ✕ button and via Escape', () => {
    const onClear = vi.fn()
    const { getByRole } = render(
      <SelectionContextBar selectedCount={3} onClear={onClear} actions={[]} />,
    )
    fireEvent.click(getByRole('button', { name: 'Clear selection' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClear).toHaveBeenCalledTimes(2)
  })
})
