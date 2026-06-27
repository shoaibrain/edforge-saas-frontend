import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

const mockData = {
  yearMonth: '2026-06',
  rowCount: 2,
  generatedAt: '2026-06-27T00:00:00.000Z',
  rows: [
    { studentId: 's1', studentName: 'Aarav Sharma', gradeLevel: 'Gr 5', presentDays: 18, absentDays: 1, excusedDays: 0, totalSchoolDays: 19 },
    { studentId: 's2', studentName: 'Bhavna Poudel', gradeLevel: 'Gr 5', presentDays: 19, absentDays: 0, excusedDays: 0, totalSchoolDays: 19 },
  ],
}

vi.mock('../../../hooks/useAttendance', () => ({
  useExportIemisAttendance: () => ({ data: mockData, mutate: vi.fn(), isPending: false, isError: false }),
}))

import { IemisExportPanel } from '../IemisExportPanel'

afterEach(cleanup)

describe('IemisExportPanel', () => {
  it('renders the export rows in a data table with student avatars', () => {
    render(<IemisExportPanel schoolId="sch-1" academicYearId="ay-1" />)
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument()
    expect(screen.getByText('Bhavna Poudel')).toBeInTheDocument()
    // IdentityCell renders a DiceBear avatar img per student (the missing-avatar fix).
    expect(screen.getAllByRole('img').length).toBeGreaterThanOrEqual(2)
  })
})
