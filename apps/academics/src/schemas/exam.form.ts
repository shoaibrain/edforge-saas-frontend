/**
 * Exam Form Schema
 *
 * Frontend validation for exam creation. academicYearId + schoolId come from
 * the page context; the form collects name, type, term, dates, and description.
 */

import { z } from 'zod'
import type { ExamStatus } from '@aibrains/shared-types'

export const examFormSchema = z
  .object({
    examName: z
      .string({ required_error: 'Exam name is required' })
      .min(2, 'Exam name must be at least 2 characters')
      .max(200, 'Exam name must not exceed 200 characters'),
    examType: z.string({ required_error: 'Exam type is required' }).min(1, 'Exam type is required'),
    termId: z.string({ required_error: 'Term is required' }).uuid('Select a term'),
    // ELS.6 — scopes the exam to one or more grade codes. Each entry is a
    // local grade code that must be in the school's enabledGradeLevels;
    // the backend rejects out-of-set codes with EXAM_GRADE_LEVEL_NOT_ENABLED.
    // The picker UI sources options from useSchoolEnabledGradeOptions so
    // operators can only pick valid codes by construction.
    gradeLevels: z
      .array(z.string().min(1).max(8))
      .min(1, 'Select at least one grade level'),
    // Stored as YYYY-MM-DD; lexical compare is correct for that format.
    startDate: z.string({ required_error: 'Start date is required' }).min(1, 'Start date is required'),
    endDate: z.string({ required_error: 'End date is required' }).min(1, 'End date is required'),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional().or(z.literal('')),
  })
  .refine((d) => d.startDate <= d.endDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })

export type ExamFormData = z.infer<typeof examFormSchema>

// ============================================================================
// STATUS DISPLAY
// ============================================================================

export const EXAM_STATUS_META: Record<ExamStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))] dark:bg-[rgb(var(--background-tertiary))]0/20 ' },
  scheduled: { label: 'Scheduled', className: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/20 ' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' },
  closed: { label: 'Closed', className: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] dark:bg-[rgb(var(--state-info-bg)/0.18)]0/20 ' },
  published: { label: 'Published', className: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] dark:bg-[rgb(var(--state-success-bg)/0.18)]0/20 ' },
}

export function getExamStatusMeta(status: ExamStatus) {
  return EXAM_STATUS_META[status] ?? EXAM_STATUS_META.draft
}

/** Archetype exam-pattern keys are free-form strings (e.g. 'midterm'); title-case for display. */
export function humanizeExamType(value: string): string {
  return value
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
