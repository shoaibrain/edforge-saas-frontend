/**
 * ClassworkDrawer — Slide-over drawer for creating/editing classwork items
 *
 * Uses framer-motion for slide animation + manual backdrop/escape handling.
 * Follows the same pattern as CourseDrawer (no @headlessui Dialog).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  Loader2,
  ClipboardList,
  HelpCircle,
  FileText,
  MessageCircle,
} from 'lucide-react'
import { z } from 'zod'
import type {
  ClassworkItemResponseDto,
  ClassworkTopicResponseDto,
  ClassworkItemType,
} from '@aibrains/shared-types'
import {
  useCreateClassworkItem,
  useUpdateClassworkItem,
} from '../../../hooks/useClasswork'

// ============================================================================
// FORM SCHEMA
// ============================================================================

const classworkFormSchema = z.object({
  type: z.enum(['assignment', 'quiz', 'material', 'question']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().or(z.literal('')),
  topicId: z.string().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
  possiblePoints: z
    .union([z.literal(''), z.coerce.number().min(0).max(10000)])
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
  status: z.enum(['draft', 'published']),
})

/** Raw form state (before Zod transform) */
interface ClassworkFormData {
  type: 'assignment' | 'quiz' | 'material' | 'question'
  title: string
  description: string
  topicId: string
  dueDate: string
  possiblePoints: number | ''
  status: 'draft' | 'published'
}

// ============================================================================
// TYPE CONFIG
// ============================================================================

const TYPE_OPTIONS: Array<{
  value: ClassworkItemType
  label: string
  icon: typeof ClipboardList
  color: string
  bg: string
}> = [
  { value: 'assignment', label: 'Assignment', icon: ClipboardList, color: 'text-[rgb(var(--state-info-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]' },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-amber-500', bg: 'bg-[rgb(var(--state-warning-fg))]/10' },
  { value: 'material', label: 'Material', icon: FileText, color: 'text-[rgb(var(--state-info-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]' },
  { value: 'question', label: 'Question', icon: MessageCircle, color: 'text-[rgb(var(--state-success-fg))]', bg: 'bg-[rgb(var(--state-success-bg)/0.18)]' },
]

// ============================================================================
// PROPS
// ============================================================================

interface ClassworkDrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback to close the drawer */
  onClose: () => void
  /** Section this classwork belongs to */
  sectionId: string
  /** School context */
  schoolId: string
  /** Existing item for edit mode (omit for create) */
  editItem?: ClassworkItemResponseDto | null
  /** Pre-selected type when opening from menu (create mode) */
  defaultType?: ClassworkItemType
  /** Available topics for the topic dropdown */
  topics?: ClassworkTopicResponseDto[]
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ClassworkDrawer({
  open,
  onClose,
  sectionId,
  schoolId,
  editItem,
  defaultType,
  topics = [],
}: ClassworkDrawerProps) {
  const isEditMode = !!editItem
  const panelRef = useRef<HTMLDivElement>(null)

  // Mutations
  const createMutation = useCreateClassworkItem(sectionId)
  const updateMutation = useUpdateClassworkItem(sectionId)
  const isPending = createMutation.isPending || updateMutation.isPending

  // Form state
  const [form, setForm] = useState<ClassworkFormData>(() => getInitialForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  function getInitialForm(): ClassworkFormData {
    if (editItem) {
      return {
        type: editItem.type,
        title: editItem.title,
        description: editItem.description ?? '',
        topicId: editItem.topicId ?? '',
        dueDate: editItem.dueDate ? editItem.dueDate.split('T')[0] : '',
        possiblePoints: editItem.possiblePoints ?? '',
        status: editItem.status === 'scheduled' ? 'published' : editItem.status,
      }
    }
    return {
      type: defaultType ?? 'assignment',
      title: '',
      description: '',
      topicId: '',
      dueDate: '',
      possiblePoints: '',
      status: 'draft',
    }
  }

  // Reset form when drawer opens/changes
  useEffect(() => {
    if (open) {
      setForm(getInitialForm())
      setErrors({})
      setIsDirty(false)
      setShowDiscardConfirm(false)
    }
  }, [open, editItem?.itemId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleAttemptClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isDirty]) // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  const updateField = useCallback(<K extends keyof ClassworkFormData>(key: K, value: ClassworkFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const handleAttemptClose = useCallback(() => {
    if (isDirty && !isPending) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }, [isDirty, isPending, onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleAttemptClose()
    }
  }

  // Submit
  const handleSubmit = useCallback(async () => {
    // Validate
    const result = classworkFormSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString()
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message
        }
      }
      setErrors(fieldErrors)
      return
    }

    const validated = result.data

    if (isEditMode && editItem) {
      // Build partial update payload (only changed fields)
      const updates: Record<string, unknown> = {}
      if (validated.title !== editItem.title) updates.title = validated.title
      if ((validated.description || '') !== (editItem.description || '')) updates.description = validated.description || undefined
      if ((validated.topicId || '') !== (editItem.topicId || '')) updates.topicId = validated.topicId || null
      if (validated.status !== editItem.status) updates.status = validated.status

      const editDueDate = editItem.dueDate ? editItem.dueDate.split('T')[0] : ''
      if ((validated.dueDate || '') !== editDueDate) {
        updates.dueDate = validated.dueDate || null
      }

      const formPoints = typeof validated.possiblePoints === 'number' ? validated.possiblePoints : undefined
      if (formPoints !== editItem.possiblePoints) {
        updates.possiblePoints = formPoints ?? null
      }

      await updateMutation.mutateAsync({
        itemId: editItem.itemId,
        schoolId,
        sectionId,
        data: updates,
      })
    } else {
      await createMutation.mutateAsync({
        sectionId,
        schoolId,
        type: validated.type,
        title: validated.title,
        description: validated.description || undefined,
        topicId: validated.topicId || undefined,
        dueDate: validated.dueDate || undefined,
        possiblePoints: typeof validated.possiblePoints === 'number' ? validated.possiblePoints : undefined,
        status: validated.status,
      })
    }

    onClose()
  }, [form, isEditMode, editItem, sectionId, schoolId, createMutation, updateMutation, onClose])

  // Whether points/due date fields apply
  const showPointsAndDue = form.type === 'assignment' || form.type === 'quiz'

  // Drawer title
  const title = isEditMode ? 'Edit Classwork' : 'Create Classwork'

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="classwork-drawer-title">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.30)] backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-full sm:max-w-xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] flex-shrink-0">
                      <ClipboardList className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2
                          id="classwork-drawer-title"
                          className="text-lg font-semibold text-text-primary truncate"
                        >
                          {title}
                        </h2>
                        {isEditMode && (
                          <span className="flex-shrink-0 text-xs bg-[rgb(var(--state-warning-bg)/0.18)] text-amber-700 dark:bg-[rgb(var(--state-warning-fg))]/20 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                            Editing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAttemptClose}
                    className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors flex-shrink-0"
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable form content */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Type selector — compact inline pills */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">Type</label>
                    <div className="flex flex-wrap gap-2">
                      {TYPE_OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        const isSelected = form.type === opt.value
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateField('type', opt.value)}
                            disabled={isEditMode}
                            className={`
                              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                              ${isSelected
                                ? `border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--text-secondary))]  ring-1 ring-[rgb(var(--border-focus)/0.35)]`
                                : 'border-border-primary bg-surface-primary text-text-secondary hover:bg-surface-secondary'
                              }
                              ${isEditMode ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isSelected ? opt.color : 'text-text-tertiary'}`} />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="cw-title" className="block text-xs font-medium text-text-secondary mb-1.5">
                      Title <span className="text-[rgb(var(--state-danger-fg))]">*</span>
                    </label>
                    <input
                      id="cw-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      placeholder="e.g. Chapter 3 Reading Response"
                      className={`w-full px-3 py-2 text-sm bg-surface-primary border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors ${errors.title ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-primary'}`}
                      autoFocus
                    />
                    {errors.title && <p className="mt-1 text-xs text-[rgb(var(--state-danger-fg))]">{errors.title}</p>}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="cw-desc" className="block text-xs font-medium text-text-secondary mb-1.5">
                      Description
                    </label>
                    <textarea
                      id="cw-desc"
                      value={form.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder={form.type === 'question' ? 'Write your question here...' : 'Add instructions or details...'}
                      rows={form.type === 'material' || form.type === 'question' ? 5 : 4}
                      className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors resize-y min-h-20"
                    />
                  </div>

                  {/* Topic */}
                  <div>
                    <label htmlFor="cw-topic" className="block text-xs font-medium text-text-secondary mb-1.5">
                      Topic
                    </label>
                    <select
                      id="cw-topic"
                      value={form.topicId}
                      onChange={(e) => updateField('topicId', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                    >
                      <option value="">No topic</option>
                      {topics.map((t) => (
                        <option key={t.topicId} value={t.topicId}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date + Points — only for assignment/quiz */}
                  {showPointsAndDue && (
                    <div className="space-y-4 p-4 bg-surface-secondary/50 rounded-lg border border-border-secondary">
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                        {form.type === 'quiz' ? 'Quiz Settings' : 'Assignment Settings'}
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cw-due" className="block text-xs font-medium text-text-secondary mb-1.5">
                            Due Date
                          </label>
                          <input
                            id="cw-due"
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => updateField('dueDate', e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="cw-points" className="block text-xs font-medium text-text-secondary mb-1.5">
                            Points Possible
                          </label>
                          <input
                            id="cw-points"
                            type="number"
                            min={0}
                            max={10000}
                            value={form.possiblePoints}
                            onChange={(e) => updateField('possiblePoints', e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="100"
                            className={`w-full px-3 py-2 text-sm bg-surface-primary border rounded-lg text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors ${errors.possiblePoints ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-primary'}`}
                          />
                          {errors.possiblePoints && <p className="mt-1 text-xs text-[rgb(var(--state-danger-fg))]">{errors.possiblePoints}</p>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Status toggle */}
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-2">Visibility</label>
                    <div className="flex gap-2">
                      {(['draft', 'published'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateField('status', s)}
                          className={`
                            inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all
                            ${form.status === s
                              ? s === 'published'
                                ? 'border-[rgb(var(--state-success-border))] bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]  ring-1 ring-[rgb(var(--state-success-border)/0.35)]'
                                : 'border-amber-500 bg-[rgb(var(--state-warning-fg))]/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/20'
                              : 'border-border-primary bg-surface-primary text-text-secondary hover:bg-surface-secondary'
                            }
                          `}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${form.status === s ? (s === 'published' ? 'bg-[rgb(var(--state-success-bg)/0.18)]0' : 'bg-[rgb(var(--state-warning-fg))]') : 'bg-text-tertiary'}`} />
                          {s === 'draft' ? 'Draft' : 'Published'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50">
                  <button
                    type="button"
                    onClick={handleAttemptClose}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg hover:bg-[rgb(var(--background-secondary))] transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : isEditMode ? (
                      'Save Changes'
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>

                {/* Discard confirmation overlay */}
                <AnimatePresence>
                  {showDiscardConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)] backdrop-blur-sm rounded-l-xl"
                    >
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-surface-primary rounded-xl shadow-lg border border-border-primary p-6 mx-8 max-w-sm"
                      >
                        <h3 className="text-sm font-semibold text-text-primary mb-2">
                          Discard changes?
                        </h3>
                        <p className="text-sm text-text-secondary mb-4">
                          You have unsaved changes. Are you sure you want to close?
                        </p>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowDiscardConfirm(false)}
                            className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-secondary rounded-lg transition-colors"
                          >
                            Keep Editing
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowDiscardConfirm(false); onClose() }}
                            className="px-3 py-1.5 text-sm font-medium text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] rounded-lg transition-colors"
                          >
                            Discard
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
