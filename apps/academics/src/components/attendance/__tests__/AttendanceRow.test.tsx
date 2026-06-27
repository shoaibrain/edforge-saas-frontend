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
