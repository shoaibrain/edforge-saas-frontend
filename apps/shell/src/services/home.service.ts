/**
 * Home Service
 *
 * Thin API wrapper for home page data aggregation.
 * Calls academics endpoints directly via @edforge/api-client
 * (the shell cannot import academics MFE internal modules).
 */

import { apiGet } from '../lib/api'

// ============================================================================
// TYPES
// ============================================================================

export interface AcademicsOverviewResponse {
  enrollment: {
    totalEnrolled: number
    byGradeLevel: Record<string, number>
    byStatus: Record<string, number>
  }
  activeSectionsCount: number
  attendance: {
    date: string
    totalStudents: number
    totalRecorded: number
    present: number
    absent: number
    late: number
    excused: number
    attendanceRate: number
  } | null
}

export interface AttendanceAlertItem {
  studentId: string
  studentName: string
  attendanceRate: number
  totalDays: number
  daysPresent: number
  daysAbsent: number
}

export interface DailyAttendanceSummary {
  date: string
  totalStudents: number
  totalRecorded: number
  present: number
  absent: number
  late: number
  excused: number
  attendanceRate: number
}

export interface AcademicYearResponse {
  yearId: string
  name: string
  startDate: string
  endDate: string
  status: string
}

export interface TeacherSectionItem {
  sectionId: string
  sectionNumber: string
  courseName: string | null
  courseCode: string | null
  currentEnrollment: number
  maxEnrollment: number
  locationRoomNumber: string | null
  isActive: boolean
}

// ============================================================================
// API CALLS
// ============================================================================

export async function getAcademicsOverview(
  schoolId: string,
  academicYearId: string,
  date: string,
): Promise<AcademicsOverviewResponse> {
  return apiGet<AcademicsOverviewResponse>('/academics/dashboard/overview', {
    schoolId,
    academicYearId,
    date,
  })
}

export async function getAttendanceAlerts(
  schoolId: string,
  academicYearId: string,
  threshold: number,
  startDate: string,
  endDate: string,
): Promise<AttendanceAlertItem[]> {
  const res = await apiGet<
    { alerts: AttendanceAlertItem[]; totalAtRiskCount: number } | AttendanceAlertItem[]
  >('/academics/attendance/alerts', {
    schoolId,
    academicYearId,
    threshold,
    startDate,
    endDate,
  })
  return Array.isArray(res) ? res : res.alerts
}

export async function getAttendanceTrend(
  schoolId: string,
  startDate: string,
  endDate: string,
): Promise<DailyAttendanceSummary[]> {
  return apiGet<DailyAttendanceSummary[]>('/academics/attendance/trend', {
    schoolId,
    startDate,
    endDate,
  })
}

export async function getCurrentAcademicYear(
  schoolId: string,
): Promise<AcademicYearResponse | null> {
  try {
    return await apiGet<AcademicYearResponse>(
      `/academics/schools/${schoolId}/academic-years/current`,
    )
  } catch {
    return null
  }
}

export async function getTeacherSections(
  schoolId: string,
  academicYearId?: string,
): Promise<{ items: TeacherSectionItem[] }> {
  const params: Record<string, unknown> = {
    schoolId,
    isActive: true,
    limit: 50,
  }
  if (academicYearId) params.academicYearId = academicYearId
  return apiGet<{ items: TeacherSectionItem[] }>('/academics/sections', params)
}
