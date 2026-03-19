/**
 * useClasswork Hooks
 *
 * React Query hooks for classwork items, topics, and reordering.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  getClassworkItems,
  createClassworkItem,
  updateClassworkItem,
  deleteClassworkItem,
  createClassworkTopic,
  updateClassworkTopic,
  deleteClassworkTopic,
  reorderClassworkItems,
} from '../services/academics.service'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const classworkKeys = {
  all: ['classwork'] as const,
  section: (sectionId: string) => [...classworkKeys.all, sectionId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

export function useClassworkItems(sectionId: string, schoolId: string, enabled = true) {
  return useQuery({
    queryKey: classworkKeys.section(sectionId),
    queryFn: () => getClassworkItems(sectionId, schoolId),
    enabled: enabled && !!sectionId && !!schoolId,
    staleTime: 2 * 60 * 1000,
  })
}

// ============================================================================
// CLASSWORK ITEM MUTATIONS
// ============================================================================

export function useCreateClassworkItem(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClassworkItem,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
      toast.success('Classwork item created')
    },
    onError: () => toast.error('Failed to create classwork item'),
  })
}

export function useUpdateClassworkItem(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      schoolId,
      sectionId: secId,
      data,
    }: {
      itemId: string
      schoolId: string
      sectionId: string
      data: Record<string, unknown>
    }) => updateClassworkItem(itemId, schoolId, secId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
      toast.success('Classwork item updated')
    },
    onError: () => toast.error('Failed to update classwork item'),
  })
}

export function useDeleteClassworkItem(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      itemId,
      schoolId,
      sectionId: secId,
    }: {
      itemId: string
      schoolId: string
      sectionId: string
    }) => deleteClassworkItem(itemId, schoolId, secId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
      toast.success('Classwork item deleted')
    },
    onError: () => toast.error('Failed to delete classwork item'),
  })
}

// ============================================================================
// TOPIC MUTATIONS
// ============================================================================

export function useCreateClassworkTopic(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createClassworkTopic,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
      toast.success('Topic created')
    },
    onError: () => toast.error('Failed to create topic'),
  })
}

export function useUpdateClassworkTopic(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      topicId,
      schoolId,
      sectionId: secId,
      data,
    }: {
      topicId: string
      schoolId: string
      sectionId: string
      data: { name?: string; sortOrder?: number }
    }) => updateClassworkTopic(topicId, schoolId, secId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
    },
    onError: () => toast.error('Failed to update topic'),
  })
}

export function useDeleteClassworkTopic(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      topicId,
      schoolId,
      sectionId: secId,
    }: {
      topicId: string
      schoolId: string
      sectionId: string
    }) => deleteClassworkTopic(topicId, schoolId, secId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
      toast.success('Topic deleted')
    },
    onError: () => toast.error('Failed to delete topic'),
  })
}

// ============================================================================
// REORDER
// ============================================================================

export function useReorderClassworkItems(sectionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: reorderClassworkItems,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: classworkKeys.section(sectionId) })
    },
    onError: () => toast.error('Failed to reorder items'),
  })
}
