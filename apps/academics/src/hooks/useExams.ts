/**
 * useExams — exam list/create hooks (school + term scoped).
 *
 * Exams are keyed at the (school, academicYear, term) level, not per-section.
 * Slice 1: list + create. Later slices add exam-courses, score entry, results.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreateExamDto, ExamListResponseDto, ExamResponseDto } from '@aibrains/shared-types'
import {
  getExams,
  getExamPattern,
  createExam,
  parseApiError,
  type ExamListParams,
} from '../services/academics.service'

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (params: ExamListParams) => [...examKeys.lists(), params] as const,
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
