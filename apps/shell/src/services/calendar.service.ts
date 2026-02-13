/**
 * Calendar Service
 *
 * API service functions for Calendar domain CRUD operations.
 * Covers Calendars, CalendarDates, Calendar Generation, and Academic Sessions.
 */

import { apiGet, apiPost, apiPatch, apiDelete } from '../lib/api'
import type {
  CalendarResponseDto,
  CalendarListResponseDto,
  CreateCalendarDto,
  UpdateCalendarDto,
  CalendarDateResponseDto,
  CalendarDateListResponseDto,
  CreateCalendarDateDto,
  UpdateCalendarDateDto,
  BulkUpdateCalendarDatesDto,
  CalendarSummaryDto,
  GenerateCalendarDto,
  AcademicSessionResponseDto,
  AcademicSessionListResponseDto,
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
} from '@aibrains/shared-types'

// ============================================================================
// CALENDAR ENTITY
// ============================================================================

export async function getCalendars(schoolId: string): Promise<CalendarListResponseDto> {
  return apiGet<CalendarListResponseDto>(`/schools/${schoolId}/calendars`)
}

export async function getCalendar(schoolId: string, calendarId: string): Promise<CalendarResponseDto> {
  return apiGet<CalendarResponseDto>(`/schools/${schoolId}/calendars/${calendarId}`)
}

export async function createCalendar(schoolId: string, data: CreateCalendarDto): Promise<CalendarResponseDto> {
  return apiPost<CalendarResponseDto, CreateCalendarDto>(`/schools/${schoolId}/calendars`, data)
}

export async function updateCalendar(schoolId: string, calendarId: string, data: UpdateCalendarDto): Promise<CalendarResponseDto> {
  return apiPatch<CalendarResponseDto, UpdateCalendarDto>(`/schools/${schoolId}/calendars/${calendarId}`, data)
}

// ============================================================================
// CALENDAR DATE
// ============================================================================

export async function getCalendarDates(
  schoolId: string,
  params: {
    academicYearId: string
    startDate?: string
    endDate?: string
    month?: number
    eventType?: string
    isInstructionalDay?: boolean
    limit?: number
  }
): Promise<CalendarDateListResponseDto> {
  return apiGet<CalendarDateListResponseDto>(
    `/schools/${schoolId}/calendar-dates`,
    params as Record<string, unknown>
  )
}

export async function getCalendarDate(schoolId: string, date: string): Promise<CalendarDateResponseDto> {
  return apiGet<CalendarDateResponseDto>(`/schools/${schoolId}/calendar-dates/${date}`)
}

export async function createCalendarDate(
  schoolId: string,
  academicYearId: string,
  data: CreateCalendarDateDto
): Promise<CalendarDateResponseDto> {
  return apiPost<CalendarDateResponseDto, CreateCalendarDateDto>(
    `/schools/${schoolId}/calendar-dates?academicYearId=${academicYearId}`,
    data
  )
}

export async function updateCalendarDate(
  schoolId: string,
  date: string,
  data: UpdateCalendarDateDto
): Promise<CalendarDateResponseDto> {
  return apiPatch<CalendarDateResponseDto, UpdateCalendarDateDto>(
    `/schools/${schoolId}/calendar-dates/${date}`,
    data
  )
}

export async function bulkUpdateCalendarDates(
  schoolId: string,
  data: BulkUpdateCalendarDatesDto
): Promise<{ updated: number }> {
  return apiPost<{ updated: number }, BulkUpdateCalendarDatesDto>(
    `/schools/${schoolId}/calendar-dates/bulk-update`,
    data
  )
}

export async function getCalendarStats(
  schoolId: string,
  academicYearId: string
): Promise<CalendarSummaryDto> {
  return apiGet<CalendarSummaryDto>(
    `/schools/${schoolId}/calendar-dates/stats`,
    { academicYearId }
  )
}

// ============================================================================
// CALENDAR GENERATION
// ============================================================================

export async function generateCalendar(
  schoolId: string,
  yearId: string,
  data: GenerateCalendarDto
): Promise<{ calendarId: string; totalDays: number; instructionalDays: number; holidays: number; weekends: number }> {
  return apiPost<
    { calendarId: string; totalDays: number; instructionalDays: number; holidays: number; weekends: number },
    GenerateCalendarDto
  >(`/schools/${schoolId}/academic-years/${yearId}/generate-calendar`, data)
}

// ============================================================================
// ACADEMIC SESSIONS
// ============================================================================

export async function getAcademicSessions(
  schoolId: string,
  academicYearId?: string
): Promise<AcademicSessionListResponseDto> {
  const params: Record<string, unknown> = {}
  if (academicYearId) params.academicYearId = academicYearId
  return apiGet<AcademicSessionListResponseDto>(`/schools/${schoolId}/academic-sessions`, params)
}

export async function getAcademicSession(schoolId: string, sessionId: string): Promise<AcademicSessionResponseDto> {
  return apiGet<AcademicSessionResponseDto>(`/schools/${schoolId}/academic-sessions/${sessionId}`)
}

export async function createAcademicSession(
  schoolId: string,
  data: CreateAcademicSessionDto
): Promise<AcademicSessionResponseDto> {
  return apiPost<AcademicSessionResponseDto, CreateAcademicSessionDto>(
    `/schools/${schoolId}/academic-sessions`,
    data
  )
}

export async function updateAcademicSession(
  schoolId: string,
  sessionId: string,
  data: UpdateAcademicSessionDto
): Promise<AcademicSessionResponseDto> {
  return apiPatch<AcademicSessionResponseDto, UpdateAcademicSessionDto>(
    `/schools/${schoolId}/academic-sessions/${sessionId}`,
    data
  )
}

export async function deleteAcademicSession(schoolId: string, sessionId: string): Promise<void> {
  return apiDelete<void>(`/schools/${schoolId}/academic-sessions/${sessionId}`)
}

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

export const calendarService = {
  getCalendars, getCalendar, createCalendar, updateCalendar,
  getCalendarDates, getCalendarDate, createCalendarDate, updateCalendarDate,
  bulkUpdateCalendarDates, getCalendarStats,
  generateCalendar,
  getAcademicSessions, getAcademicSession, createAcademicSession, updateAcademicSession, deleteAcademicSession,
}
