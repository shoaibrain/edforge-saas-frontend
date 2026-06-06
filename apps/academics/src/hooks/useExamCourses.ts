/**
 * useExamCourses — subjects (exam-courses) attached to an exam.
 *
 * Mutations are only valid while the parent exam is draft/scheduled (backend
 * 409s EXAM_LOCKED otherwise); the UI gates on `acceptsExamCourseMutations`.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  CreateExamCourseDto,
  ExamCourseResponseDto,
  UpdateExamCourseDto,
} from '@aibrains/shared-types'
import {
  getExamCourses,
  createExamCourse,
  updateExamCourse,
  deleteExamCourse,
  parseApiError,
  type ExamCourseListResult,
} from '../services/academics.service'

export const examCourseKeys = {
  all: ['exam-courses'] as const,
  list: (examId: string) => [...examCourseKeys.all, examId] as const,
}

export function useExamCourses(examId: string, enabled = true) {
  return useQuery<ExamCourseListResult, Error>({
    queryKey: examCourseKeys.list(examId),
    queryFn: () => getExamCourses(examId),
    enabled: enabled && !!examId,
    staleTime: 30 * 1000,
  })
}

export function useCreateExamCourse(examId: string) {
  const queryClient = useQueryClient()
  return useMutation<ExamCourseResponseDto, Error, CreateExamCourseDto>({
    mutationFn: (data) => createExamCourse(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examCourseKeys.list(examId) })
      toast.success('Subject added')
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export interface UpdateExamCourseVars {
  examCourseId: string
  data: UpdateExamCourseDto
}

export function useUpdateExamCourse(examId: string) {
  const queryClient = useQueryClient()
  return useMutation<ExamCourseResponseDto, Error, UpdateExamCourseVars>({
    mutationFn: ({ examCourseId, data }) => updateExamCourse(examId, examCourseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examCourseKeys.list(examId) })
      toast.success('Subject updated')
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export function useDeleteExamCourse(examId: string) {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (examCourseId) => deleteExamCourse(examId, examCourseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: examCourseKeys.list(examId) })
      toast.success('Subject removed')
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}
