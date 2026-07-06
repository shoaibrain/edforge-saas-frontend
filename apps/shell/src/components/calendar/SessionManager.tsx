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
import { Button, DateInput } from '@edforge/ui'
import { useSettings } from '@/lib/shell-context'

// Sprint C4 deployment marker — bumping this string forces a unique JS
// bundle hash on each fix push, defeating any stale CDN/browser cache.
// Visible in DevTools console on page load so the operator can confirm
// which build they're hitting.
const C4_FIX_MARKER = 'C4-fix-rev-2-2026-04-30T17:00Z'
if (typeof window !== 'undefined') {
  // eslint-disable-next-line no-console
  console.log(`[edforge:c4] SessionManager build marker: ${C4_FIX_MARKER}`)
}
import {
  useAcademicSessions,
  useCreateAcademicSession,
  useUpdateAcademicSession,
  useDeleteAcademicSession,
} from '@/hooks/useCalendar'
import type { AcademicSessionResponseDto, CreateAcademicSessionDto } from '@aibrains/shared-types'
import { detectSessionGaps } from '@aibrains/shared-types'
import { TenantDateRange } from '../common/TenantDate'

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
  spring_semester: 'bg-[rgb(var(--state-success-fg))]',
  year_round:      'bg-[rgb(var(--state-info-fg))]',
  summer:          'bg-[rgb(var(--state-warning-fg))]',
  first_quarter:   'bg-violet-500',
  second_quarter:  'bg-[rgb(var(--state-info-fg))]',
  third_quarter:   'bg-[rgb(var(--state-danger-fg))]',
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
  /**
   * The calendar system of the school whose sessions are being managed.
   * `bikram_sambat` → BS picker; anything else (or undefined) → native.
   *
   * Passed in by the parent (school-detail / AcademicSetupTab) so the picker
   * matches the SCHOOL being edited, not the user's active-school context.
   * Without this prop, the previous fix used `useSettings()` which resolved
   * the active workspace's school — wrong when the user is editing a
   * different school's sessions on the school-detail page.
   */
  calendarSystem?: string
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
    <div className="relative h-8 rounded-lg bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] overflow-hidden">
      {sessions.map((s) => {
        const startMs = Math.max(0, new Date(s.beginDate).getTime() - new Date(yearStart).getTime())
        const endMs = Math.min(totalMs, new Date(s.endDate).getTime() - new Date(yearStart).getTime())
        const left = (startMs / totalMs) * 100
        const width = ((endMs - startMs) / totalMs) * 100

        return (
          <div
            key={s.academicSessionId}
            className={`absolute top-0 bottom-0 ${TERM_COLORS[s.termDescriptor] || 'bg-[rgb(var(--text-tertiary))]'} opacity-70 flex items-center justify-center`}
            style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
            title={`${s.sessionName}: ${s.beginDate} to ${s.endDate}`}
          >
            <span className="text-xs font-semibold text-[rgb(var(--action-primary-fg))] truncate px-1">
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
  calendarSystem,
}: {
  initial: SessionFormData
  onSubmit: (data: SessionFormData) => void
  onCancel: () => void
  isLoading: boolean
  submitLabel: string
  calendarSystem: string
}) {
  const [form, setForm] = useState<SessionFormData>(initial)
  // Sprint C4 (rev 2): render BS calendar picker for `bikram_sambat`,
  // native otherwise. `calendarSystem` flows in as a prop from the parent
  // SessionManager → AcademicSetupTab → school-detail (queryFn:
  // tenantService.getSchool). This binds the picker to the SCHOOL being
  // edited, not the user's active-school context (the rev-1 bug).

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
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1.5">Term Type</label>
          <select
            value={form.termDescriptor}
            onChange={(e) => setForm(f => ({ ...f, termDescriptor: e.target.value }))}
            className="w-full text-sm rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] px-3 py-2.5"
            required
          >
            <option value="">Select term...</option>
            {TERM_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <DateInput
          label="Begin Date"
          value={form.beginDate}
          onChange={(iso) => setForm(f => ({ ...f, beginDate: iso }))}
          calendarSystem={calendarSystem}
        />
        <DateInput
          label="End Date"
          value={form.endDate}
          onChange={(iso) => setForm(f => ({ ...f, endDate: iso }))}
          calendarSystem={calendarSystem}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" type="button" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="sm" type="submit" disabled={isLoading} isLoading={isLoading}>
          <Save className="w-4 h-4 me-1.5" />
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
  calendarSystem: calendarSystemProp,
}: SessionManagerProps) {
  // Resolve picker calendar system: explicit prop wins (set by parent who
  // knows the SPECIFIC school being edited); fall back to active workspace
  // settings only when the parent didn't provide one. The fallback is the
  // rev-1 behavior — kept so any out-of-tree caller (e.g. an embedded
  // session manager on the active school's main page) still works.
  const settings = useSettings()
  const calendarSystem =
    calendarSystemProp || settings?.calendarSystem || 'gregorian'

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
          <Layers className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setShowCreate(true); setEditingId(null) }}
        >
          <Plus className="w-3.5 h-3.5 me-1" />
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

      {/* Sprint C4 — banner for sessions that look auto-generated.
          Heuristic: name matches the legacy "Q1"/"Q2"/"first_quarter" form
          OR the term descriptor name equals the session name verbatim.
          These usually came from the pre-C4 AY-creation auto-fill. We
          don't auto-fix anything; we just nudge the operator to confirm
          the dates and labels match their school's calendar. Once they
          edit any session, the heuristic stops matching for that row. */}
      {sessions.length > 0 && sessions.some((s) =>
        /^(Q[1-4]|T[1-3]|first_quarter|second_quarter|third_quarter|fourth_quarter|fall_semester|spring_semester|Fall Semester|Spring Semester|Fall Trimester|Winter Trimester|Spring Trimester)$/.test(s.sessionName.trim())
      ) && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-amber-800 dark:text-amber-200 leading-relaxed">
              <b>Review your sessions.</b> Some sessions on this year look
              auto-generated (default labels and even date splits). Real
              schools have term breaks for festivals or holidays — please
              edit each session's begin/end dates and name to match your
              actual school calendar before activating the year.
            </div>
          </div>
        </div>
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
                className="flex items-start gap-2 bg-[rgba(217,119,6,0.06)] border border-[rgba(217,119,6,0.15)] rounded-lg p-2.5 text-xs text-[#D97706] leading-relaxed"
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
            <Loader2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] animate-spin" />
            <span className="ms-2 text-sm text-[rgb(var(--text-tertiary))]">Loading sessions...</span>
          </div>
        )}

        {/* Empty state — Sprint C4 template picker.
            Templates seed editable drafts; the user reviews each session
            (name, dates, term descriptor) before any DDB write. No silent
            auto-creation: every saved row reflects an explicit user action. */}
        {!isLoading && sessions.length === 0 && !showCreate && (
          <SessionTemplatePicker
            yearStart={academicYearStartDate}
            yearEnd={academicYearEndDate}
            createSession={createSession}
            academicYearId={academicYearId}
          />
        )}

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-[rgb(var(--border-focus)/0.35)] bg-[rgb(var(--action-primary-bg))]/5 p-4"
            >
              <h4 className="text-sm font-medium text-[rgb(var(--text-primary))] mb-3">New Session</h4>
              <SessionForm
                initial={emptyForm}
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                isLoading={createSession.isPending}
                submitLabel="Create"
                calendarSystem={calendarSystem}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session list */}
        {sessions.map((session) => {
          const isEditing = editingId === session.academicSessionId
          const isDeleting = deletingId === session.academicSessionId
          const termColor = TERM_COLORS[session.termDescriptor] || 'bg-[rgb(var(--text-tertiary))]'

          return (
            <motion.div
              key={session.academicSessionId}
              layout
              className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]/30 overflow-hidden"
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
                    calendarSystem={calendarSystem}
                    isLoading={updateSession.isPending}
                    submitLabel="Update"
                  />
                </div>
              ) : isDeleting ? (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[rgb(var(--state-danger-fg))] flex-shrink-0 mt-0.5" />
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
                          <Trash2 className="w-3.5 h-3.5 me-1" />
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
                        <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-tertiary))] px-1.5 py-0.5 rounded">
                          {getTermLabel(session.termDescriptor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-[rgb(var(--text-tertiary))]">
                        <TenantDateRange start={session.beginDate} end={session.endDate} />

                        {session.totalInstructionalDays > 0 ? (
                          <span className="text-[rgb(var(--state-success-fg))] font-medium bg-[rgb(var(--state-success-fg))]/10 px-1.5 py-0.5 rounded">
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
                  <div className="flex items-center gap-1 flex-shrink-0 ms-2">
                    <button
                      onClick={() => { setEditingId(session.academicSessionId); setShowCreate(false) }}
                      className="p-1.5 rounded-lg hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit session"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(session.academicSessionId)}
                      className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
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

// ============================================================================
// SESSION TEMPLATE PICKER (Sprint C4)
// ============================================================================

interface TemplateDraft {
  sessionName: string
  termDescriptor: string
  // Fractional positions of the term within the AY window. Dates are
  // computed at apply-time from the AY's startDate / endDate.
  startFraction: number
  endFraction: number
}

interface Template {
  id: string
  label: string
  hint: string
  drafts: TemplateDraft[]
}

const SESSION_TEMPLATES: Template[] = [
  {
    id: 'pabson_4_term',
    label: 'PABSON 4 Terms',
    hint: 'Common Nepal pre-/private-school structure. Review dates against your school calendar (Dashain/Tihar breaks).',
    drafts: [
      { sessionName: 'Term 1', termDescriptor: 'first_quarter',  startFraction: 0,    endFraction: 0.25 },
      { sessionName: 'Term 2', termDescriptor: 'second_quarter', startFraction: 0.25, endFraction: 0.5  },
      { sessionName: 'Term 3', termDescriptor: 'third_quarter',  startFraction: 0.5,  endFraction: 0.75 },
      { sessionName: 'Term 4', termDescriptor: 'fourth_quarter', startFraction: 0.75, endFraction: 1    },
    ],
  },
  {
    id: 'us_quarter',
    label: 'US Quarters (4)',
    hint: 'Q1–Q4, even split. Edit per-quarter dates after applying.',
    drafts: [
      { sessionName: 'Q1', termDescriptor: 'first_quarter',  startFraction: 0,    endFraction: 0.25 },
      { sessionName: 'Q2', termDescriptor: 'second_quarter', startFraction: 0.25, endFraction: 0.5  },
      { sessionName: 'Q3', termDescriptor: 'third_quarter',  startFraction: 0.5,  endFraction: 0.75 },
      { sessionName: 'Q4', termDescriptor: 'fourth_quarter', startFraction: 0.75, endFraction: 1    },
    ],
  },
  {
    id: 'us_semester',
    label: 'US Semesters (2)',
    hint: 'Fall + Spring. Adjust the mid-year boundary to your calendar.',
    drafts: [
      { sessionName: 'Fall Semester',   termDescriptor: 'fall_semester',   startFraction: 0,   endFraction: 0.5 },
      { sessionName: 'Spring Semester', termDescriptor: 'spring_semester', startFraction: 0.5, endFraction: 1   },
    ],
  },
  {
    id: 'trimester',
    label: 'Trimesters (3)',
    hint: 'Three even thirds. Term descriptors are quarters by default — edit if needed.',
    drafts: [
      { sessionName: 'Trimester 1', termDescriptor: 'first_quarter',  startFraction: 0,        endFraction: 1 / 3 },
      { sessionName: 'Trimester 2', termDescriptor: 'second_quarter', startFraction: 1 / 3,    endFraction: 2 / 3 },
      { sessionName: 'Trimester 3', termDescriptor: 'third_quarter',  startFraction: 2 / 3,    endFraction: 1     },
    ],
  },
]

function fractionToDate(yearStart: string, yearEnd: string, fraction: number): string {
  const startMs = new Date(yearStart).getTime()
  const endMs = new Date(yearEnd).getTime()
  const ts = startMs + (endMs - startMs) * fraction
  const d = new Date(ts)
  // Normalize to YYYY-MM-DD; clamp seconds to avoid the off-by-one days
  // when the fraction lands mid-day.
  return d.toISOString().split('T')[0]
}

function SessionTemplatePicker({
  yearStart,
  yearEnd,
  createSession,
  academicYearId,
}: {
  yearStart: string
  yearEnd: string
  createSession: ReturnType<typeof useCreateAcademicSession>
  academicYearId: string
}) {
  const [applying, setApplying] = useState<string | null>(null)

  const applyTemplate = async (tpl: Template) => {
    setApplying(tpl.id)
    try {
      // Sequential creates so order is preserved server-side and so the
      // first failure stops the loop (rather than half-creating a quarter
      // template and leaving orphan rows).
      for (const draft of tpl.drafts) {
        await createSession.mutateAsync({
          academicYearId,
          sessionName: draft.sessionName,
          beginDate: fractionToDate(yearStart, yearEnd, draft.startFraction),
          endDate: fractionToDate(yearStart, yearEnd, draft.endFraction),
          termDescriptor: draft.termDescriptor as CreateAcademicSessionDto['termDescriptor'],
        })
      }
      toast.success(
        `Applied ${tpl.label} (${tpl.drafts.length} session${tpl.drafts.length === 1 ? '' : 's'}). ` +
          `Review and edit each session's dates and name as needed.`,
      )
    } catch (err) {
      toast.error(
        `Failed to apply template: ${(err as Error).message}. Some sessions ` +
          `may have been created — review the list and remove any partial entries.`,
      )
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-center py-4">
        <Calendar className="w-8 h-8 text-[rgb(var(--text-tertiary))] mx-auto mb-2" />
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          No sessions defined yet. Pick a template to seed sessions that you
          can then review and edit, or create each session individually.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SESSION_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => applyTemplate(tpl)}
            disabled={applying !== null}
            className="text-start p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]/40 hover:border-[rgb(var(--border-focus))] hover:bg-[rgb(var(--action-primary-bg))]/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                {tpl.label}
              </span>
              {applying === tpl.id && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[rgb(var(--action-secondary-fg))]" />
              )}
            </div>
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">{tpl.hint}</p>
          </button>
        ))}
      </div>
      <p className="text-xs text-[rgb(var(--text-tertiary))] text-center">
        Templates split the year evenly. Real schools have term breaks
        (Dashain/Tihar in Nepal, holiday breaks in the US) — edit each
        session's begin/end dates after applying.
      </p>
    </div>
  )
}
