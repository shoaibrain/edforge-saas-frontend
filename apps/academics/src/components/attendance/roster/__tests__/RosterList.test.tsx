import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { RosterList, type RosterEntry } from '../RosterList'
import { mockListViewport } from '../../../../../../../test-utils/virtualizer'

afterEach(cleanup)
// Small viewport so a large roster is genuinely windowed (not all rows mounted).
mockListViewport(400)

const noop = () => undefined

function makeEntries(n: number): RosterEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    studentId: `s-${i}`,
    studentName: `Student ${i}`,
    studentNumber: `N-${i}`,
    status: null,
    notes: '',
  }))
}

function setup(entries: RosterEntry[]) {
  return render(
    <RosterList
      entries={entries}
      isPastDate={false}
      expandTrigger="always"
      editingIds={new Set()}
      onStatusChange={noop}
      onNotesChange={noop}
      onExcuseTypeChange={noop}
      onStartEdit={noop}
      onCorrectionSave={noop}
      onCorrectionCancel={noop}
      detailsOpenIds={new Set()}
      onToggleDetails={noop}
    />,
  )
}

describe('RosterList — virtualization', () => {
  it('windows a large roster (renders far fewer rows than entries)', () => {
    setup(makeEntries(60))
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(60)
    expect(screen.getByText('Student 0')).toBeInTheDocument()
    expect(screen.queryByText('Student 59')).toBeNull() // far off-screen → not mounted
  })

  it('renders every row for a small roster', () => {
    setup(makeEntries(3))
    expect(screen.getByText('Student 0')).toBeInTheDocument()
    expect(screen.getByText('Student 1')).toBeInTheDocument()
    expect(screen.getByText('Student 2')).toBeInTheDocument()
  })

  it('moves focus to the next row on ArrowDown', () => {
    setup(makeEntries(5))
    const rows = screen.getAllByRole('row')
    rows[0].focus()
    expect(rows[0]).toHaveFocus()
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' })
    expect(rows[1]).toHaveFocus()
  })

  it('shows an empty-state message when there are no entries', () => {
    setup([])
    expect(screen.getByText('No students match your search.')).toBeInTheDocument()
  })
})
