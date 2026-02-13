/**
 * useCalendar Hooks
 *
 * React Query hooks for Calendar domain data fetching and mutations.
 * Follows the query key factory pattern from useEducationOrgs.ts.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CalendarResponseDto,
  CalendarListResponseDto,
  CreateCalendarDto,
  UpdateCalendarDto,
  CalendarDateResponseDto,
  CalendarDateListResponseDto,
  UpdateCalendarDateDto,
  BulkUpdateCalendarDatesDto,
  CalendarSummaryDto,
  GenerateCalendarDto,
  AcademicSessionResponseDto,
  AcademicSessionListResponseDto,
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
} from '@aibrains/shared-types'
import {
  getCalendars,
  createCalendar,
  updateCalendar,
  getCalendarDates,
  getCalendarDate,
  updateCalendarDate,
  bulkUpdateCalendarDates,
  getCalendarStats,
  generateCalendar,
  getAcademicSessions,
  getAcademicSession,
  createAcademicSession,
  updateAcademicSession,
  deleteAcademicSession,
} from '../services/calendar.service'

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const calendarKeys = {
  all: ['calendar'] as const,
  calendars: (schoolId: string) => [...calendarKeys.all, 'calendars', schoolId] as const,
  calendar: (schoolId: string, id: string) => [...calendarKeys.calendars(schoolId), id] as const,
  dates: (schoolId: string) => [...calendarKeys.all, 'dates', schoolId] as const,
  dateList: (schoolId: string, params?: Record<string, unknown>) => [...calendarKeys.dates(schoolId), 'list', params] as const,
  date: (schoolId: string, date: string) => [...calendarKeys.dates(schoolId), date] as const,
  stats: (schoolId: string, yearId: string) => [...calendarKeys.all, 'stats', schoolId, yearId] as const,
  sessions: (schoolId: string) => [...calendarKeys.all, 'sessions', schoolId] as const,
  sessionList: (schoolId: string, yearId?: string) => [...calendarKeys.sessions(schoolId), 'list', yearId] as const,
  session: (schoolId: string, id: string) => [...calendarKeys.sessions(schoolId), id] as const,
}

// ============================================================================
// CALENDAR QUERY HOOKS
// ============================================================================

export function useCalendars(schoolId: string, enabled = true) {
  return useQuery<CalendarListResponseDto, Error>({
    queryKey: calendarKeys.calendars(schoolId),
    queryFn: () => getCalendars(schoolId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// CALENDAR DATE QUERY HOOKS
// ============================================================================

export function useCalendarDates(
  schoolId: string,
  params: {
    academicYearId: string
    startDate?: string
    endDate?: string
    month?: number
    eventType?: string
    isInstructionalDay?: boolean
    limit?: number
  },
  enabled = true
) {
  return useQuery<CalendarDateListResponseDto, Error>({
    queryKey: calendarKeys.dateList(schoolId, params as Record<string, unknown>),
    queryFn: () => getCalendarDates(schoolId, params),
    enabled: enabled && !!schoolId && !!params.academicYearId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCalendarDate(schoolId: string, date: string, enabled = true) {
  return useQuery<CalendarDateResponseDto, Error>({
    queryKey: calendarKeys.date(schoolId, date),
    queryFn: () => getCalendarDate(schoolId, date),
    enabled: enabled && !!schoolId && !!date,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCalendarStats(schoolId: string, academicYearId: string, enabled = true) {
  return useQuery<CalendarSummaryDto, Error>({
    queryKey: calendarKeys.stats(schoolId, academicYearId),
    queryFn: () => getCalendarStats(schoolId, academicYearId),
    enabled: enabled && !!schoolId && !!academicYearId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// ACADEMIC SESSION QUERY HOOKS
// ============================================================================

export function useAcademicSessions(schoolId: string, academicYearId?: string, enabled = true) {
  return useQuery<AcademicSessionListResponseDto, Error>({
    queryKey: calendarKeys.sessionList(schoolId, academicYearId),
    queryFn: () => getAcademicSessions(schoolId, academicYearId),
    enabled: enabled && !!schoolId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useAcademicSession(schoolId: string, sessionId: string, enabled = true) {
  return useQuery<AcademicSessionResponseDto, Error>({
    queryKey: calendarKeys.session(schoolId, sessionId),
    queryFn: () => getAcademicSession(schoolId, sessionId),
    enabled: enabled && !!schoolId && !!sessionId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

// ============================================================================
// CALENDAR MUTATION HOOKS
// ============================================================================

export function useCreateCalendar(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<CalendarResponseDto, Error, CreateCalendarDto>({
    mutationFn: (data) => createCalendar(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars(schoolId) })
      toast.success('Calendar created')
    },
    onError: (error) => { toast.error(error.message || 'Failed to create calendar') },
  })
}

export function useUpdateCalendar(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<CalendarResponseDto, Error, { calendarId: string; data: UpdateCalendarDto }>({
    mutationFn: ({ calendarId, data }) => updateCalendar(schoolId, calendarId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars(schoolId) })
      queryClient.setQueryData(calendarKeys.calendar(schoolId, variables.calendarId), result)
      toast.success('Calendar updated')
    },
    onError: (error) => { toast.error(error.message || 'Failed to update calendar') },
  })
}

// ============================================================================
// CALENDAR GENERATION MUTATION
// ============================================================================

export function useGenerateCalendar(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<
    { calendarId: string; totalDays: number; instructionalDays: number; holidays: number; weekends: number },
    Error,
    { yearId: string; data: GenerateCalendarDto }
  >({
    mutationFn: ({ yearId, data }) => generateCalendar(schoolId, yearId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.dates(schoolId) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars(schoolId) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
      toast.success('Calendar generated successfully')
    },
    onError: (error) => { toast.error(error.message || 'Failed to generate calendar') },
  })
}

// ============================================================================
// CALENDAR DATE MUTATION HOOKS
// ============================================================================

export function useUpdateCalendarDate(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<CalendarDateResponseDto, Error, { date: string; data: UpdateCalendarDateDto }>({
    mutationFn: ({ date, data }) => updateCalendarDate(schoolId, date, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.dates(schoolId) })
      queryClient.setQueryData(calendarKeys.date(schoolId, variables.date), result)
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
    },
    onError: (error) => { toast.error(error.message || 'Failed to update calendar date') },
  })
}

export function useBulkUpdateCalendarDates(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<{ updated: number }, Error, BulkUpdateCalendarDatesDto>({
    mutationFn: (data) => bulkUpdateCalendarDates(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.dates(schoolId) })
      queryClient.invalidateQueries({ queryKey: calendarKeys.all })
      toast.success('Dates updated')
    },
    onError: (error) => { toast.error(error.message || 'Failed to bulk update dates') },
  })
}

// ============================================================================
// ACADEMIC SESSION MUTATION HOOKS
// ============================================================================

export function useCreateAcademicSession(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<AcademicSessionResponseDto, Error, CreateAcademicSessionDto>({
    mutationFn: (data) => createAcademicSession(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sessions(schoolId) })
      toast.success('Session created')
    },
    onError: (error) => { toast.error(error.message || 'Failed to create session') },
  })
}

export function useUpdateAcademicSession(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<AcademicSessionResponseDto, Error, { sessionId: string; data: UpdateAcademicSessionDto }>({
    mutationFn: ({ sessionId, data }) => updateAcademicSession(schoolId, sessionId, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sessions(schoolId) })
      queryClient.setQueryData(calendarKeys.session(schoolId, variables.sessionId), result)
      toast.success('Session updated')
    },
    onError: (error) => { toast.error(error.message || 'Failed to update session') },
  })
}

export function useDeleteAcademicSession(schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (sessionId) => deleteAcademicSession(schoolId, sessionId),
    onSuccess: (_, sessionId) => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.sessions(schoolId) })
      queryClient.removeQueries({ queryKey: calendarKeys.session(schoolId, sessionId) })
      toast.success('Session deleted')
    },
    onError: (error) => { toast.error(error.message || 'Failed to delete session') },
  })
}
