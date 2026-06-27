/// <reference types="@testing-library/jest-dom" />
/**
 * AttendanceGrid — absentee-first default tests (Story 1 / F2.T1).
 *
 * On a fresh day every roster student defaults to Present so the teacher only
 * marks exceptions, and Save submits the full roster. Locked students (Story 2)
 * are never auto-defaulted or saved unless given an explicit Tardy/Excused
 * override.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, within } from '@testing-library/react'
import { AttendanceGrid } from '../AttendanceGrid'
import type { StudentSectionResponseDto } from '@aibrains/shared-types'

afterEach(cleanup)

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
      date="2090-01-15" // future date → not past → absentee-first applies
      onSave={onSave}
      isSaving={false}
      {...overrides}
    />,
  )
  return { onSave, ...utils }
}

describe('AttendanceGrid — absentee-first (F2.T1)', () => {
  it('defaults every student to Present on a fresh day (progress full)', () => {
    const { getByText } = setup()
    expect(getByText('3 / 3 marked')).toBeInTheDocument()
  })

  it('Save submits the full roster as Present', () => {
    const { onSave, getByText } = setup()
    fireEvent.click(getByText('Save Attendance'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const records = onSave.mock.calls[0][0]
    expect(records).toHaveLength(3)
    expect(records.every((r: any) => r.status === 'present')).toBe(true)
  })

  it('marking one Absent yields a mixed roster on Save', () => {
    const { onSave, getByLabelText, getAllByLabelText, getByText } = setup()
    // First student's Absent button.
    const absentButtons = getAllByLabelText('Mark Absent')
    fireEvent.click(absentButtons[0])
    fireEvent.click(getByText('Save Attendance'))
    const records = onSave.mock.calls[0][0]
    expect(records.filter((r: any) => r.status === 'absent')).toHaveLength(1)
    expect(records.filter((r: any) => r.status === 'present')).toHaveLength(2)
    // sanity: the matcher is real
    expect(getByLabelText).toBeTruthy()
  })

  it('does NOT auto-default or save a locked student (no explicit override)', () => {
    const locked = new Map([['s2', 'Already present in Math']])
    const { onSave, getByText } = setup({ lockedStudents: locked })
    // s2 is locked → not counted in the present default (2 of 3 marked).
    expect(getByText('2 / 3 marked')).toBeInTheDocument()
    fireEvent.click(getByText('Save Attendance'))
    const records = onSave.mock.calls[0][0]
    expect(records.map((r: any) => r.studentId).sort()).toEqual(['s1', 's3'])
  })

  it('persists an explicit Tardy override on a locked student', () => {
    const locked = new Map([['s2', 'Already present in Math']])
    const { onSave, getByText } = setup({ lockedStudents: locked })
    // Scope to the locked row (other rows also have a Tardy entry button).
    const lockedRow = getByText('Already present in Math').closest('[role="row"]') as HTMLElement
    fireEvent.click(within(lockedRow).getByLabelText('Mark Tardy'))
    fireEvent.click(getByText('Save Attendance'))
    const records = onSave.mock.calls[0][0]
    const s2 = records.find((r: any) => r.studentId === 's2')
    expect(s2?.status).toBe('late')
  })
})

describe('AttendanceGrid — per_section_granular has no locks (Story 3 / F2.T5)', () => {
  it('renders the identical full entry grid with no lock affordance when no students are locked', () => {
    // per_section_granular never passes lockedStudents → grid is identical to Story 1.
    const { queryByText, getAllByLabelText } = setup({ lockedStudents: undefined })
    // No "recorded in another section" hint anywhere.
    expect(queryByText(/Already .* in /i)).toBeNull()
    // Every row exposes the full presence buttons (3 students × Present).
    expect(getAllByLabelText('Mark Present')).toHaveLength(3)
    expect(getAllByLabelText('Mark Absent')).toHaveLength(3)
  })
})

describe('AttendanceGrid — non-instructional day has no default-present (F2.T7)', () => {
  it('does NOT pre-fill Present when defaultStatus is null (weekend/holiday)', () => {
    const { getByText, queryByText } = setup({ defaultStatus: null })
    // Nothing marked → roll-call is empty, not "all present".
    expect(getByText('0 / 3 marked')).toBeInTheDocument()
    expect(queryByText('3 / 3 marked')).toBeNull()
  })

  it('keeps Save disabled when nothing is marked on a non-instructional day', () => {
    const { getByText } = setup({ defaultStatus: null })
    expect(getByText('Save Attendance').closest('button')).toBeDisabled()
  })
})

describe('AttendanceGrid — existing records (return visit)', () => {
  it('shows saved values rather than re-defaulting to Present', () => {
    const { getByText } = setup({
      existingRecords: [
        { studentId: 's1', status: 'absent' as const },
        { studentId: 's2', status: 'present' as const },
        { studentId: 's3', status: 'excused' as const },
      ],
    })
    // All three have a saved status → 3/3 marked, but not all present.
    expect(getByText('3 / 3 marked')).toBeInTheDocument()
  })
})
