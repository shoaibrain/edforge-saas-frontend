/**
 * useExams — exam list/detail/create hooks + lifecycle transitions
 * (school + term scoped).
 *
 * Exams are keyed at the (school, academicYear, term) level, not per-section.
 * Slice 1: list + create. Slice 2: detail + status transitions. Later slices
 * add exam-courses + score entry.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CreateExamDto,
  ExamListResponseDto,
  ExamResponseDto,
  ExamStatus,
} from '@aibrains/shared-types'
import {
  getExams,
  getExam,
  getExamPattern,
  createExam,
  transitionExamStatus,
  parseApiError,
  type ExamListParams,
} from '../services/academics.service'

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (params: ExamListParams) => [...examKeys.lists(), params] as const,
  details: () => [...examKeys.all, 'detail'] as const,
  detail: (examId: string, schoolId: string) => [...examKeys.details(), examId, schoolId] as const,
  pattern: () => [...examKeys.all, 'pattern'] as const,
}

/**
 * List exams for a school, optionally scoped to an academic year / term.
 */
export function useExams(params: ExamListParams, enabled = true) {
  return useQuery<ExamListResponseDto, Error>({
    queryKey: examKeys.list(params),
    queryFn: () => getExams(params),
    enabled: enabled && !!params.schoolId,
    staleTime: 60 * 1000,
  })
}

/**
 * Load a single exam (detail route).
 */
export function useExam(examId: string, schoolId: string, enabled = true) {
  return useQuery<ExamResponseDto, Error>({
    queryKey: examKeys.detail(examId, schoolId),
    queryFn: () => getExam(examId, schoolId),
    enabled: enabled && !!examId && !!schoolId,
    staleTime: 30 * 1000,
  })
}

/**
 * The tenant archetype's allowed exam types (drives the examType dropdown).
 */
export function useExamPattern(enabled = true) {
  return useQuery<{ archetype: string | null; examPattern: string[] }, Error>({
    queryKey: examKeys.pattern(),
    queryFn: () => getExamPattern(),
    enabled,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}

export function useCreateExam() {
  const queryClient = useQueryClient()
  return useMutation<ExamResponseDto, Error, CreateExamDto>({
    mutationFn: (data) => createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      toast.success('Exam created')
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}

export interface TransitionExamStatusVars {
  examId: string
  schoolId: string
  targetStatus: ExamStatus
  notes?: string
}

export function useTransitionExamStatus() {
  const queryClient = useQueryClient()
  return useMutation<ExamResponseDto, Error, TransitionExamStatusVars>({
    mutationFn: ({ examId, schoolId, targetStatus, notes }) =>
      transitionExamStatus(examId, schoolId, targetStatus, notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [...examKeys.details(), updated.examId] })
      queryClient.invalidateQueries({ queryKey: examKeys.lists() })
      toast.success(`Exam moved to ${updated.status.replace(/_/g, ' ')}`)
    },
    onError: (error) => {
      toast.error(parseApiError(error).message)
    },
  })
}
