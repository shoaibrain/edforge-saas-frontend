/**
 * SessionManager Component (Task 2.10)
 *
 * Academic Session / Term management UI.
 * Allows creating, editing, and deleting sessions (semesters/quarters)
 * within an academic year. Includes a visual timeline bar.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Save,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import {
  useAcademicSessions,
  useCreateAcademicSession,
  useUpdateAcademicSession,
  useDeleteAcademicSession,
} from '@/hooks/useCalendar'
import type { AcademicSessionResponseDto, CreateAcademicSessionDto } from '@aibrains/shared-types'
import { detectSessionGaps } from '@aibrains/shared-types'

// ============================================================================
// CONSTANTS
// ============================================================================

const TERM_OPTIONS = [
  { value: 'fall_semester',    label: 'Fall Semester' },
  { value: 'spring_semester',  label: 'Spring Semester' },
  { value: 'year_round',      label: 'Year Round' },
  { value: 'summer',          label: 'Summer' },
  { value: 'first_quarter',   label: '1st Quarter' },
  { value: 'second_quarter',  label: '2nd Quarter' },
  { value: 'third_quarter',   label: '3rd Quarter' },
  { value: 'fourth_quarter',  label: '4th Quarter' },
] as const

const TERM_COLORS: Record<string, string> = {
  fall_semester:   'bg-amber-500',
  spring_semester: 'bg-emerald-500',
  year_round:      'bg-blue-500',
  summer:          'bg-orange-500',
  first_quarter:   'bg-violet-500',
  second_quarter:  'bg-cyan-500',
  third_quarter:   'bg-pink-500',
  fourth_quarter:  'bg-lime-500',
}

// ============================================================================
// PROPS
// ============================================================================

interface SessionManagerProps {
  schoolId: string
  academicYearId: string
  academicYearStartDate: string
  academicYearEndDate: string
}

// ============================================================================
// TIMELINE BAR
// ============================================================================

function SessionTimeline({
  sessions,
  yearStart,
  yearEnd,
}: {
  sessions: AcademicSessionResponseDto[]
  yearStart: string
  yearEnd: string
}) {
  const totalMs = new Date(yearEnd).getTime() - new Date(yearStart).getTime()
  if (totalMs <= 0) return null

  return (
    <div className="relative h-8 rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] overflow-hidden">
      {sessions.map((s) => {
        const startMs = Math.max(0, new Date(s.beginDate).getTime() - new Date(yearStart).getTime())
        const endMs = Math.min(totalMs, new Date(s.endDate).getTime() - new Date(yearStart).getTime())
        const left = (startMs / totalMs) * 100
        const width = ((endMs - startMs) / totalMs) * 100

        return (
          <div
            key={s.academicSessionId}
            className={`absolute top-0 bottom-0 ${TERM_COLORS[s.termDescriptor] || 'bg-gray-400'} opacity-70 flex items-center justify-center`}
            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
            title={`${s.sessionName}: ${s.beginDate} to ${s.endDate}`}
          >
            <span className="text-[9px] font-semibold text-white truncate px-1">
              {s.sessionName}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// SESSION FORM
// ============================================================================

interface SessionFormData {
  sessionName: string
  beginDate: string
  endDate: string
  termDescriptor: string
}

const emptyForm: SessionFormData = {
  sessionName: '',
  beginDate: '',
  endDate: '',
  termDescriptor: '',
}

function SessionForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel,
}: {
  initial: SessionFormData
  onSubmit: (data: SessionFormData) => void
  onCancel: () => void
  isLoading: boolean
  submitLabel: string
}) {
  const [form, setForm] = useState<SessionFormData>(initial)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sessionName || !form.beginDate || !form.endDate || !form.termDescriptor) {
      toast.error('All fields are required')
      return
    }
    if (new Date(form.endDate) <= new Date(form.beginDate)) {
      toast.error('End date must be after begin date')
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Session Name</label>
          <input
            type="text"
            value={form.sessionName}
            onChange={(e) => setForm(f => ({ ...f, sessionName: e.target.value }))}
            placeholder="e.g., Fall 2026"
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Term Type</label>
          <select
            value={form.termDescriptor}
            onChange={(e) => setForm(f => ({ ...f, termDescriptor: e.target.value }))}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
            required
          >
            <option value="">Select term...</option>
            {TERM_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Begin Date</label>
          <input
            type="date"
            value={form.beginDate}
            onChange={(e) => setForm(f => ({ ...f, beginDate: e.target.value }))}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">End Date</label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] px-3 py-2.5"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={isLoading} isLoading={isLoading}>
          <Save className="w-4 h-4 mr-1.5" />
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SessionManager({
  schoolId,
  academicYearId,
  academicYearStartDate,
  academicYearEndDate,
}: SessionManagerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading } = useAcademicSessions(schoolId, academicYearId)
  const createSession = useCreateAcademicSession(schoolId)
  const updateSession = useUpdateAcademicSession(schoolId)
  const deleteSession = useDeleteAcademicSession(schoolId)

  const sessions = useMemo(() => {
    if (!data?.items) return []
    return [...data.items].sort(
      (a, b) => new Date(a.beginDate).getTime() - new Date(b.beginDate).getTime()
    )
  }, [data])

  const handleCreate = (form: SessionFormData) => {
    createSession.mutate(
      {
        academicYearId,
        sessionName: form.sessionName,
        beginDate: form.beginDate,
        endDate: form.endDate,
        termDescriptor: form.termDescriptor as CreateAcademicSessionDto['termDescriptor'],
      },
      {
        onSuccess: () => setShowCreate(false),
      }
    )
  }

  const handleUpdate = (sessionId: string, form: SessionFormData) => {
    updateSession.mutate(
      {
        sessionId,
        data: {
          sessionName: form.sessionName,
          beginDate: form.beginDate,
          endDate: form.endDate,
          termDescriptor: form.termDescriptor as CreateAcademicSessionDto['termDescriptor'],
        },
      },
      {
        onSuccess: () => setEditingId(null),
      }
    )
  }

  const handleDelete = (sessionId: string) => {
    deleteSession.mutate(sessionId, {
      onSuccess: () => setDeletingId(null),
    })
  }

  const getTermLabel = (descriptor: string) =>
    TERM_OPTIONS.find(o => o.value === descriptor)?.label || descriptor

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-teal-500" />
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowCreate(true); setEditingId(null) }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Session
        </Button>
      </div>

      {/* Timeline */}
      {sessions.length > 0 && (
        <SessionTimeline
          sessions={sessions}
          yearStart={academicYearStartDate}
          yearEnd={academicYearEndDate}
        />
      )}

      {/* Session Gap Warnings */}
      {sessions.length >= 2 && (() => {
        const gaps = detectSessionGaps(sessions)
        if (gaps.length === 0) return null
        return (
          <div className="space-y-1.5 mb-3">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-[rgba(217,119,6,0.06)] border border-[rgba(217,119,6,0.15)] rounded-lg p-2.5 text-[11px] text-[#D97706] leading-relaxed"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>{gap.dayCount}-day gap</strong> between &ldquo;{gap.beforeSession}&rdquo; (ends {gap.gapStart}) and &ldquo;{gap.afterSession}&rdquo; (starts {gap.gapEnd}).
                  Calendar dates in this range are not assigned to any session.
                </span>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Content */}
      <div className="space-y-3">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
            <span className="ml-2 text-sm text-[rgb(var(--text-tertiary))]">Loading sessions...</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sessions.length === 0 && !showCreate && (
          <div className="text-center py-8">
            <Calendar className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              No sessions defined. Add semesters or quarters to structure your academic year.
            </p>
          </div>
        )}

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4"
            >
              <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3">New Session</h4>
              <SessionForm
                initial={emptyForm}
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                isLoading={createSession.isPending}
                submitLabel="Create"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        {sessions.map((session) => {
          const isEditing = editingId === session.academicSessionId
          const isDeleting = deletingId === session.academicSessionId
          const termColor = TERM_COLORS[session.termDescriptor] || 'bg-gray-400'

          return (
            <motion.div
              key={session.academicSessionId}
              layout
              className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]/30 overflow-hidden"
            >
              {isEditing ? (
                <div className="p-4">
                  <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3">
                    Edit: {session.sessionName}
                  </h4>
                  <SessionForm
                    initial={{
                      sessionName: session.sessionName,
                      beginDate: session.beginDate,
                      endDate: session.endDate,
                      termDescriptor: session.termDescriptor,
                    }}
                    onSubmit={(form) => handleUpdate(session.academicSessionId, form)}
                    onCancel={() => setEditingId(null)}
                    isLoading={updateSession.isPending}
                    submitLabel="Update"
                  />
                </div>
              ) : isDeleting ? (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        Delete "{session.sessionName}"?
                      </p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                        This will remove the session. Calendar dates will not be affected.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(session.academicSessionId)}
                          disabled={deleteSession.isPending}
                          isLoading={deleteSession.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-8 rounded-full ${termColor} flex-shrink-0`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[rgb(var(--text-primary))] truncate">
                          {session.sessionName}
                        </span>
                        <span className="text-[10px] font-medium text-[rgb(var(--text-tertiary))] bg-[rgb(var(--surface-tertiary))] px-1.5 py-0.5 rounded">
                          {getTermLabel(session.termDescriptor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
                        <span>{session.beginDate} &mdash; {session.endDate}</span>
                        {session.totalInstructionalDays > 0 ? (
                          <span className="text-emerald-600 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            {session.totalInstructionalDays} instructional days
                          </span>
                        ) : (
                          <span className="text-amber-500 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                            0 instructional days — generate calendar to sync
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => { setEditingId(session.academicSessionId); setShowCreate(false) }}
                      className="p-1.5 rounded-lg hover:bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit session"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(session.academicSessionId)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
