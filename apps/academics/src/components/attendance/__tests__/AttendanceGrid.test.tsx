/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceGrid — entry behavior tests.
 *
 * The grid does NOT pre-select anyone (operator feedback 2026-06-27, reversing the
 * earlier absentee-first auto-Present). A fresh roster starts unmarked; the
 * "All Present" quick action is the one-click path. Locked students (Story 2) are
 * never bulk-marked and are only saved with an explicit Tardy/Excused override.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import { AttendanceGrid } from '../AttendanceGrid'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'
import { mockListViewport } from '../../../../../../test-utils/virtualizer'

afterEach(cleanup)

// The roster is virtualized; give jsdom a non-zero viewport so every fixture row
// renders (otherwise react-virtual windows down to nothing without layout).
mockListViewport()

const students = [
  { studentId: 's1', studentName: 'Aarav Sharma', studentNumber: '001' },
  { studentId: 's2', studentName: 'Bhavna Poudel', studentNumber: '002' },
  { studentId: 's3', studentName: 'Chandra Thapa', studentNumber: '003' },
] as unknown as StudentSectionResponseDto[]

function setup(overrides: Partial<React.ComponentProps<typeof AttendanceGrid>> = {}) {
  const onSave = vi.fn()
  const utils = render(
    <AttendanceGrid
      students={students}
      date="2090-01-15" // future date → not past
      onSave={onSave}
      isSaving={false}
      {...overrides}
    />,
  )
  return { onSave, ...utils }
}

describe('AttendanceGrid — no auto pre-select', () => {
  it('starts with an unmarked roster (0/N) and Save disabled', () => {
    const { getByText } = setup()
    expect(getByText('0 / 3 marked')).toBeInTheDocument()
    expect(getByText('Save Attendance').closest('button')).toBeDisabled()
  })

  it('"All Present" marks everyone and enables Save', () => {
    const { getByText } = setup()
    fireEvent.click(getByText('All Present'))
    expect(getByText('3 / 3 marked')).toBeInTheDocument()
    expect(getByText('Save Attendance').closest('button')).not.toBeDisabled()
  })

  it('All Present then one Absent saves a correct mixed roster', () => {
    const { onSave, getByText, getAllByLabelText } = setup()
    fireEvent.click(getByText('All Present'))
    fireEvent.click(getAllByLabelText('Mark Absent')[0])
    fireEvent.click(getByText('Save Attendance'))
    const records = onSave.mock.calls[0][0]
    expect(records).toHaveLength(3)
    expect(records.filter((r: any) => r.status === 'absent')).toHaveLength(1)
    expect(records.filter((r: any) => r.status === 'present')).toHaveLength(2)
  })

  it('saving only the marked students when the rest are left blank', () => {
    const { onSave, getByText, getAllByLabelText } = setup()
    // Mark just one student present; leave the other two blank.
    fireEvent.click(getAllByLabelText('Mark Present')[0])
    fireEvent.click(getByText('Save Attendance'))
    expect(onSave.mock.calls[0][0]).toHaveLength(1)
  })
})

describe('AttendanceGrid — locked students (Story 2)', () => {
  it('does not bulk-mark or save a locked student via All Present', () => {
    const locked = new Map([['s2', 'Already present in Math']])
    const { onSave, getByText } = setup({ lockedStudents: locked })
    fireEvent.click(getByText('All Present'))
    // s2 is locked → excluded from the bulk action (2 of 3 marked).
    expect(getByText('2 / 3 marked')).toBeInTheDocument()
    fireEvent.click(getByText('Save Attendance'))
    expect(onSave.mock.calls[0][0].map((r: any) => r.studentId).sort()).toEqual(['s1', 's3'])
  })

  it('persists an explicit Tardy override on a locked student', () => {
    const locked = new Map([['s2', 'Already present in Math']])
    const { onSave, getByText } = setup({ lockedStudents: locked })
    const lockedRow = getByText('Already present in Math').closest('[role="row"]') as HTMLElement
    fireEvent.click(within(lockedRow).getByLabelText('Mark Tardy'))
    fireEvent.click(getByText('Save Attendance'))
    const s2 = onSave.mock.calls[0][0].find((r: any) => r.studentId === 's2')
    expect(s2?.status).toBe('late')
  })
})

describe('AttendanceGrid — per_section_granular has no locks (Story 3)', () => {
  it('renders the full entry grid with no lock affordance', () => {
    const { queryByText, getAllByLabelText } = setup({ lockedStudents: undefined })
    expect(queryByText(/Already .* in /i)).toBeNull()
    expect(getAllByLabelText('Mark Present')).toHaveLength(3)
    expect(getAllByLabelText('Mark Absent')).toHaveLength(3)
  })
})

describe('AttendanceGrid — existing records (return visit)', () => {
  it('shows saved values (marked) rather than a blank roster', () => {
    const { getByText } = setup({
      existingRecords: [
        { studentId: 's1', status: 'absent' as const },
        { studentId: 's2', status: 'present' as const },
        { studentId: 's3', status: 'excused' as const },
      ],
    })
    expect(getByText('3 / 3 marked')).toBeInTheDocument()
  })
})

describe('AttendanceGrid — filter chips', () => {
  it('renders filter chips and hides the Locked chip when there are no locks', () => {
    const { getByRole } = setup()
    const chips = within(getByRole('group', { name: 'Filter students' }))
    expect(chips.getByRole('button', { name: /Unmarked/ })).toBeInTheDocument()
    expect(chips.queryByRole('button', { name: /Locked/ })).toBeNull()
  })

  it('shows the Locked chip when a student is locked', () => {
    const locked = new Map([['s2', 'Already present in Math']])
    const { getByRole } = setup({ lockedStudents: locked })
    const chips = within(getByRole('group', { name: 'Filter students' }))
    expect(chips.getByRole('button', { name: /Locked/ })).toBeInTheDocument()
  })

  it('the Unmarked filter narrows the roster to unmarked students', () => {
    const { getByRole, getAllByLabelText } = setup()
    // Mark one of the three present, then focus the Unmarked subset.
    fireEvent.click(getAllByLabelText('Mark Present')[0])
    const chips = within(getByRole('group', { name: 'Filter students' }))
    fireEvent.click(chips.getByRole('button', { name: /Unmarked/ }))
    // Two students remain unmarked → two rows (each with its status control).
    expect(getAllByLabelText('Mark Present')).toHaveLength(2)
  })
})
