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

// ── Fallback endpoints (used when unified /dashboard/overview fails) ──────

export interface EnrollmentSummaryResponse {
  totalEnrolled: number
  byGradeLevel: Record<string, number>
  byStatus: Record<string, number>
}

export async function getEnrollmentSummary(
  schoolId: string,
  academicYearId: string,
): Promise<EnrollmentSummaryResponse> {
  return apiGet<EnrollmentSummaryResponse>(
    `/academics/schools/${schoolId}/years/${academicYearId}/enrollments/summary`,
  )
}

export async function getAttendanceSummaryForDate(
  schoolId: string,
  date: string,
): Promise<DailyAttendanceSummary> {
  return apiGet<DailyAttendanceSummary>('/academics/attendance/summary', {
    schoolId,
    date,
  })
}

// ── Alert & Trend endpoints ─────────────────────────────────────────────

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

/**
 * Ticket 1.6: Only catch 404 (no academic year configured) → return null.
 * Re-throw all other errors so React Query can properly show loading/error states.
 */
export async function getCurrentAcademicYear(
  schoolId: string,
): Promise<AcademicYearResponse | null> {
  try {
    return await apiGet<AcademicYearResponse>(
      `/schools/${schoolId}/academic-years/current`,
    )
  } catch (error: unknown) {
    const status = (error as { response?: { status?: number } })?.response?.status
    if (status === 404) return null
    throw error
  }
}

// ── Section-level attendance overview ──────────────────────────────────

export interface SectionCompletionItem {
  sectionId: string
  sectionNumber: string
  courseName: string
  studentCount: number
  recordedCount: number
  isComplete: boolean
}

export interface AttendanceOverviewResponse {
  schoolId: string
  date: string
  totalStudents: number
  totalRecorded: number
  attendanceRate: number
  sectionCompletion: {
    totalSections: number
    sectionsWithAttendance: number
    sections: SectionCompletionItem[]
  }
}

export async function getAttendanceOverview(
  schoolId: string,
  academicYearId: string,
  date: string,
): Promise<AttendanceOverviewResponse> {
  return apiGet<AttendanceOverviewResponse>('/academics/attendance/overview', {
    schoolId,
    academicYearId,
    date,
  })
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
