/**
 * useExamScores — score reads + single/bulk writes for an exam.
 *
 * Backend guards writes to exam.status ∈ {scheduled, in_progress}
 * (`acceptsScoreWrites`). The UI mirrors that guard so operators never see a
 * surprise 409.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type {
  BulkExamScoreDto,
  BulkExamScoreResponseDto,
  CreateExamScoreDto,
  ExamScoreResponseDto,
  UpdateExamScoreDto,
} from '@aibrains/shared-types'
import {
  getExamScores,
  createExamScore,
  createBulkExamScores,
  updateExamScore,
  parseApiError,
  type ExamScoreListResult,
  type ExamScoresFilter,
} from '../services/academics.service'

export const examScoreKeys = {
  all: ['exam-scores'] as const,
  list: (examId: string, filter: ExamScoresFilter) =>
    [...examScoreKeys.all, examId, filter] as const,
}

export function useExamScores(
  examId: string,
  filter: ExamScoresFilter,
  enabled = true,
) {
  return useQuery<ExamScoreListResult, Error>({
    queryKey: examScoreKeys.list(examId, filter),
    queryFn: () => getExamScores(examId, filter),
    enabled: enabled && !!examId && !!filter.schoolId,
    staleTime: 30 * 1000,
  })
}

export function useCreateExamScore(examId: string) {
  const queryClient = useQueryClient()
  return useMutation<ExamScoreResponseDto, Error, CreateExamScoreDto>({
    mutationFn: (data) => createExamScore(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...examScoreKeys.all, examId] })
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export interface UpdateExamScoreVars {
  scoreId: string
  data: UpdateExamScoreDto
}

export function useUpdateExamScore(examId: string) {
  const queryClient = useQueryClient()
  return useMutation<ExamScoreResponseDto, Error, UpdateExamScoreVars>({
    mutationFn: ({ scoreId, data }) => updateExamScore(examId, scoreId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...examScoreKeys.all, examId] })
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}

export function useBulkExamScores(examId: string, schoolId: string) {
  const queryClient = useQueryClient()
  return useMutation<BulkExamScoreResponseDto, Error, BulkExamScoreDto>({
    mutationFn: (data) => createBulkExamScores(examId, schoolId, data),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: [...examScoreKeys.all, examId] })
      if (resp.alreadyProcessed) {
        toast.success('Scores already saved (idempotent)')
      } else {
        const created = resp.totalCreated
        const failed = resp.totalFailed
        if (failed > 0) {
          toast.error(`${created} saved, ${failed} failed`)
        } else {
          toast.success(`${created} score${created === 1 ? '' : 's'} saved`)
        }
      }
    },
    onError: (error) => toast.error(parseApiError(error).message),
  })
}
