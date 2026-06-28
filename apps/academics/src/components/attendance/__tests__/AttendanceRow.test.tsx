/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceRow — lock-granularity tests (Story 2 / F2.T4).
 *
 * A locked row (day-presence already recorded in another section) must still
 * allow Tardy + Excused, but NOT flip Present↔Absent. The backend is advisory
 * (it never 403s an override), so this constraint is purely the frontend's.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import { AttendanceRow } from '../AttendanceRow'

afterEach(cleanup)

const baseProps = {
  studentId: 'stu-1',
  studentName: 'Aarav Sharma',
  currentStatus: null,
  notes: '',
  onStatusChange: vi.fn(),
  onNotesChange: vi.fn(),
}

describe('AttendanceRow — unlocked (normal entry)', () => {
  it('renders the full Present/Absent/Tardy/Excused/Remote button set', () => {
    const { getByLabelText } = render(<AttendanceRow {...baseProps} onStatusChange={vi.fn()} />)
    expect(getByLabelText('Mark Present')).toBeInTheDocument()
    expect(getByLabelText('Mark Absent')).toBeInTheDocument()
    expect(getByLabelText('Mark Tardy')).toBeInTheDocument() // `late` → "Tardy"
    expect(getByLabelText('Mark Excused')).toBeInTheDocument()
    expect(getByLabelText('Mark Remote')).toBeInTheDocument()
  })
})

describe('AttendanceRow — locked (daily_presence)', () => {
  it('shows the "recorded in" hint and only Tardy/Excused overrides', () => {
    const { getByLabelText, queryByLabelText, getByText } = render(
      <AttendanceRow {...baseProps} onStatusChange={vi.fn()} locked lockedHint="Already present in Math" />,
    )
    // Ownership copy, not "locked by".
    expect(getByText('Already present in Math')).toBeInTheDocument()
    // Allowed overrides present…
    expect(getByLabelText('Mark Tardy')).toBeInTheDocument()
    expect(getByLabelText('Mark Excused')).toBeInTheDocument()
    // …presence flip NOT offered.
    expect(queryByLabelText('Mark Present')).toBeNull()
    expect(queryByLabelText('Mark Absent')).toBeNull()
    expect(queryByLabelText('Mark Remote')).toBeNull()
  })

  it('records a Tardy override (late) when clicked on a locked row', () => {
    const onStatusChange = vi.fn()
    const { getByLabelText } = render(
      <AttendanceRow {...baseProps} onStatusChange={onStatusChange} locked lockedHint="Already present in Math" />,
    )
    fireEvent.click(getByLabelText('Mark Tardy'))
    expect(onStatusChange).toHaveBeenCalledWith('late')
  })

  it('blocks Present/Absent keyboard shortcuts but allows Tardy on a locked row', () => {
    const onStatusChange = vi.fn()
    const { getByRole } = render(
      <AttendanceRow {...baseProps} onStatusChange={onStatusChange} locked lockedHint="Already present in Math" />,
    )
    const row = getByRole('row')
    fireEvent.keyDown(row, { key: 'p' }) // present — blocked
    fireEvent.keyDown(row, { key: 'a' }) // absent — blocked
    expect(onStatusChange).not.toHaveBeenCalled()
    fireEvent.keyDown(row, { key: 't' }) // tardy — allowed
    expect(onStatusChange).toHaveBeenCalledWith('late')
  })
})

describe('AttendanceRow — inline details (reason + note)', () => {
  it('toggles the inline panel via the message control and labels it by state', () => {
    const onToggleDetails = vi.fn()
    const { getByLabelText, rerender } = render(
      <AttendanceRow {...baseProps} currentStatus="absent" onStatusChange={vi.fn()} onToggleDetails={onToggleDetails} />,
    )
    fireEvent.click(getByLabelText('Add note or reason'))
    expect(onToggleDetails).toHaveBeenCalledTimes(1)
    rerender(
      <AttendanceRow {...baseProps} currentStatus="absent" notes="late bus" onStatusChange={vi.fn()} onToggleDetails={onToggleDetails} />,
    )
    expect(getByLabelText('Edit note or reason')).toBeInTheDocument()
  })

  it('shows the Reason field for absent/excused, and only a Note for present', () => {
    const { getByText, queryByText, rerender } = render(
      <AttendanceRow {...baseProps} currentStatus="absent" detailsOpen onStatusChange={vi.fn()} onExcuseTypeChange={vi.fn()} />,
    )
    expect(getByText('Reason')).toBeInTheDocument()
    expect(getByText('Note')).toBeInTheDocument()
    rerender(<AttendanceRow {...baseProps} currentStatus="present" detailsOpen onStatusChange={vi.fn()} />)
    expect(queryByText('Reason')).toBeNull()
    expect(getByText('Note')).toBeInTheDocument()
  })

  it('flags "reason needed" only when absent/excused with no reason chosen', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <AttendanceRow {...baseProps} currentStatus="absent" onStatusChange={vi.fn()} onExcuseTypeChange={vi.fn()} />,
    )
    expect(getByTestId('needs-reason-dot')).toBeInTheDocument()
    rerender(
      <AttendanceRow {...baseProps} currentStatus="absent" excuseType="medical" onStatusChange={vi.fn()} onExcuseTypeChange={vi.fn()} />,
    )
    expect(queryByTestId('needs-reason-dot')).toBeNull()
  })

  it('suppresses roll-call shortcuts while typing in the Note, but not from the row', () => {
    const onStatusChange = vi.fn()
    const onNotesChange = vi.fn()
    const { getByLabelText, getByRole } = render(
      <AttendanceRow {...baseProps} currentStatus="absent" detailsOpen onStatusChange={onStatusChange} onNotesChange={onNotesChange} />,
    )
    const note = getByLabelText('Attendance note')
    fireEvent.change(note, { target: { value: 'parent' } })
    expect(onNotesChange).toHaveBeenCalledWith('parent')
    fireEvent.keyDown(note, { key: 'p' }) // typing "p" in the note must NOT mark Present
    expect(onStatusChange).not.toHaveBeenCalled()
    fireEvent.keyDown(getByRole('row'), { key: 'p' }) // row-level shortcut still works
    expect(onStatusChange).toHaveBeenCalledWith('present')
  })
})
