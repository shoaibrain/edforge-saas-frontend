/**
 * Step1Recipients — three intersecting modes share ONE persistent selection.
 *
 *   • By student — flat list, search + per-row checkbox.
 *   • By grade  — group-by-grade with tri-state group checkbox; expanding a
 *                  group reveals per-student rows for selective deselection.
 *   • Segments  — Phase 1 ships ONLY the count chips (informational; greyed)
 *                  because the per-student demographic / finance-state data
 *                  needed to make them actionable filters isn't surfaced yet.
 *                  The plan §5b commits to wiring outstanding / new-admission
 *                  / not-billed-this-period to bulkPreview counters in a
 *                  follow-up step; for now the chips render with a "TBD"
 *                  tooltip so operators see what's coming.
 *
 * No drilldown into student profiles; no row actions. This is a
 * select-recipients pane, not a worklist.
 */

import { useMemo, useState } from 'react'
import {
  Search,
  Users,
  Layers,
  X,
  Check,
  ChevronDown,
  Info,
  AlertTriangle,
  UserPlus,
  Bus,
  Home as HomeIcon,
  Award,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import {
  toggleStudent,
  toggleGradeGroup,
  gradeGroupState,
  setMode,
  clearSelection,
  addStudents,
  bucketByGrade,
  summarize,
} from './selection'
import type {
  SelectionState,
  SelectionMode,
  SegmentId,
  StudentSearchResult,
} from './types'

type Translate = (key: string, options?: Record<string, unknown>) => string

export interface Step1RecipientsProps {
  students: StudentSearchResult[]
  selection: SelectionState
  setSelection: (next: SelectionState) => void
  /** Phase 1 — undefined; reserved for the bulkPreview counter wiring landing
   *  in the follow-up (operator first sees a working wizard, then segments
   *  become actionable). */
  previewCounters?: {
    studentsWithBalance?: number
    studentsNotBilledThisPeriod?: number
    studentsNewAdmission?: number
  }
}

export function Step1Recipients({
  students,
  selection,
  setSelection,
  previewCounters,
}: Step1RecipientsProps) {
  const { t } = useTranslation('payments')
  const [q, setQ] = useState('')
  const [openGrades, setOpenGrades] = useState<Set<string>>(() => new Set())

  // ---- Filter pipeline (search → bucket-by-grade) -------------------------
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return students
    return students.filter(s => {
      return (
        s.fullName.toLowerCase().includes(needle) ||
        s.studentId.toLowerCase().includes(needle) ||
        (s.studentNumber ?? '').toLowerCase().includes(needle)
      )
    })
  }, [students, q])

  const grouped = useMemo(() => bucketByGrade(filtered), [filtered])
  const summary = useMemo(() => summarize(selection, students), [selection, students])

  const toggleOpen = (grade: string) => {
    const next = new Set(openGrades)
    if (next.has(grade)) next.delete(grade)
    else next.add(grade)
    setOpenGrades(next)
  }

  const selectAllFiltered = () =>
    setSelection(addStudents(selection, filtered.map(s => s.studentId)))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
      {/* Picker pane */}
      <div className="space-y-4">
        <ModeToggle
          mode={selection.mode}
          onChange={(mode: SelectionMode) => setSelection(setMode(selection, mode))}
        />

        <SearchBar value={q} onChange={setQ} />

        <SegmentChips counters={previewCounters} />

        <div className="flex items-center justify-between text-xs text-[rgb(var(--text-tertiary))]">
          <span>
            {t(
              q
                ? 'bulkGenerate.step1.studentMatchCount'
                : 'bulkGenerate.step1.studentTotalCount',
              { count: filtered.length },
            )}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="text-[rgb(var(--accent-strong))] hover:underline inline-flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              {t(q ? 'bulkGenerate.step1.selectAllMatching' : 'bulkGenerate.step1.selectAll')}
            </button>
            {selection.selectedIds.size > 0 && (
              <button
                type="button"
                onClick={() => setSelection(clearSelection(selection))}
                className="text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" /> {t('bulkGenerate.step1.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Bounded scrollable picker — caps at 60vh so neither the grade
         * accordion (with 14 groups × N expanded students) nor the flat
         * student list (254 rows in dev-pabson-primary) can blow the
         * page height. Internal overflow-y; the rail sticks alongside. */}
        <div className="border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-primary))] max-h-[60vh] overflow-y-auto">
          {selection.mode === 'grade' ? (
            <GradeList
              grouped={grouped}
              selection={selection}
              openGrades={openGrades}
              onToggleOpen={toggleOpen}
              onToggleStudent={(id) => setSelection(toggleStudent(selection, id))}
              onToggleGroup={(ss) => setSelection(toggleGradeGroup(selection, ss))}
              searching={!!q}
            />
          ) : (
            <FlatList
              students={filtered}
              selection={selection}
              onToggle={(id) => setSelection(toggleStudent(selection, id))}
            />
          )}
        </div>
      </div>

      {/* Rail */}
      <RecipientRail summary={summary} totalStudents={students.length} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mode toggle (By grade | By student)
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onChange,
}: {
  mode: SelectionMode
  onChange: (m: SelectionMode) => void
}) {
  const { t } = useTranslation('payments')
  return (
    <div className="inline-flex rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-0.5 text-xs">
      <button
        type="button"
        onClick={() => onChange('grade')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded',
          mode === 'grade'
            ? 'bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] shadow-sm'
            : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]',
        ].join(' ')}
      >
        <Layers className="w-3.5 h-3.5" /> {t('bulkGenerate.step1.byGrade')}
      </button>
      <button
        type="button"
        onClick={() => onChange('student')}
        className={[
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded',
          mode === 'student'
            ? 'bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] shadow-sm'
            : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]',
        ].join(' ')}
      >
        <Users className="w-3.5 h-3.5" /> {t('bulkGenerate.step1.byStudent')}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Search bar
// ---------------------------------------------------------------------------

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useTranslation('payments')
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('bulkGenerate.step1.searchPlaceholder')}
        className="w-full ps-9 pe-3 py-2 text-sm rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-strong))] focus:border-transparent"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Segment chips (Phase 1 — all visible, all greyed pending counter wiring)
// ---------------------------------------------------------------------------

const SEGMENTS: ReadonlyArray<{ id: SegmentId; icon: React.ComponentType<{ className?: string }>; phase: 1 | 2 }> = [
  { id: 'outstanding', icon: AlertTriangle, phase: 1 },
  { id: 'new', icon: UserPlus, phase: 1 },
  { id: 'not-billed-this-period', icon: Info, phase: 1 },
  { id: 'transport', icon: Bus, phase: 2 },
  { id: 'boarders', icon: HomeIcon, phase: 2 },
  { id: 'scholarship', icon: Award, phase: 2 },
]

function SegmentChips({
  counters,
}: {
  counters?: Step1RecipientsProps['previewCounters']
}) {
  const { t } = useTranslation('payments')
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] font-medium uppercase tracking-wider text-[rgb(var(--text-tertiary))] me-1"}>
        {t('bulkGenerate.step1.quickSegments')}
      </span>
      {SEGMENTS.map(seg => {
        const Icon = seg.icon
        const count =
          seg.id === 'outstanding'
            ? counters?.studentsWithBalance
            : seg.id === 'new'
            ? counters?.studentsNewAdmission
            : seg.id === 'not-billed-this-period'
            ? counters?.studentsNotBilledThisPeriod
            : undefined
        const phase2 = seg.phase === 2
        const tooltip = phase2
          ? t('bulkGenerate.step1.phase2Tooltip')
          : t('bulkGenerate.step1.phase1Tooltip')
        return (
          <button
            key={seg.id}
            type="button"
            disabled
            title={tooltip}
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border',
              'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]',
              'text-[rgb(var(--text-tertiary))] opacity-60 cursor-not-allowed',
            ].join(' ')}
          >
            <Icon className="w-3 h-3" />
            <span>{t(`bulkGenerate.step1.segments.${seg.id}`)}</span>
            {count !== undefined && (
              <span className={/* allow-arbitrary-spacing: dense bulk-wizard count chip; pre-token-sweep */ "px-1.5 py-0 text-[10px] rounded bg-[rgb(var(--background-primary))] tabular-nums"}>
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Flat student list (By student mode)
// ---------------------------------------------------------------------------

function FlatList({
  students,
  selection,
  onToggle,
}: {
  students: StudentSearchResult[]
  selection: SelectionState
  onToggle: (id: string) => void
}) {
  if (students.length === 0) {
    return <EmptyHint />
  }
  // No outer border/rounded — the parent scroll container provides them.
  // Just the dividers between rows. Container handles overflow.
  return (
    <div className="divide-y divide-[rgb(var(--border-primary))]">
      {students.map(s => (
        <StudentRow
          key={s.studentId}
          s={s}
          selected={selection.selectedIds.has(s.studentId)}
          onToggle={() => onToggle(s.studentId)}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grade-grouped list (By grade mode)
// ---------------------------------------------------------------------------

function GradeList({
  grouped,
  selection,
  openGrades,
  onToggleOpen,
  onToggleStudent,
  onToggleGroup,
  searching,
}: {
  grouped: Array<{ grade: string; students: StudentSearchResult[] }>
  selection: SelectionState
  openGrades: Set<string>
  onToggleOpen: (grade: string) => void
  onToggleStudent: (id: string) => void
  onToggleGroup: (students: StudentSearchResult[]) => void
  searching: boolean
}) {
  const { t } = useTranslation('payments')
  if (grouped.length === 0) {
    return <EmptyHint />
  }
  // No outer container border/rounded — the parent scroll wrapper owns
  // those. Per-row dividers separate grade groups.
  return (
    <div className="divide-y divide-[rgb(var(--border-primary))]">
      {grouped.map(({ grade, students }) => {
        const state = gradeGroupState(selection, students)
        const selN = students.filter(s => selection.selectedIds.has(s.studentId)).length
        const isOpen = openGrades.has(grade) || searching
        return (
          <div
            key={grade}
            className={state !== 'off' ? 'bg-[rgb(var(--accent-soft))]/10' : ''}
          >
            <div
              role="button"
              tabIndex={0}
              onClick={() => onToggleOpen(grade)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggleOpen(grade)
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-[rgb(var(--background-secondary))]"
            >
              <div
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleGroup(students)
                }}
              >
                <TriCheckbox state={state} />
              </div>
              <div className={/* allow-arbitrary-spacing: fixed count-badge min width, not a type scale */ "inline-flex items-center justify-center min-w-[44px] px-2 py-0.5 rounded-md text-xs font-semibold bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-secondary))]"}>
                {gradeLabel(grade, t)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[rgb(var(--text-primary))]">
                  {t('bulkGenerate.common.studentCount', { count: students.length })}
                </div>
                <div className="text-xs text-[rgb(var(--text-tertiary))]">
                  {selN > 0 ? (
                    <>
                      <b className="text-[rgb(var(--accent-strong))]">
                        {t('bulkGenerate.common.selectedCount', { count: selN })}
                      </b>
                      {' · '}
                      {t('bulkGenerate.common.notSelectedCount', {
                        count: students.length - selN,
                      })}
                    </>
                  ) : (
                    t('bulkGenerate.common.noneSelected')
                  )}
                </div>
              </div>
              <ChevronDown
                className={[
                  'w-4 h-4 text-[rgb(var(--text-tertiary))] transition-transform',
                  isOpen ? 'rotate-180' : '',
                ].join(' ')}
              />
            </div>
            {isOpen && (
              <div className="divide-y divide-[rgb(var(--border-primary))] border-t border-[rgb(var(--border-primary))]">
                {students.map(s => (
                  <StudentRow
                    key={s.studentId}
                    s={s}
                    selected={selection.selectedIds.has(s.studentId)}
                    onToggle={() => onToggleStudent(s.studentId)}
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Atoms
// ---------------------------------------------------------------------------

function StudentRow({
  s,
  selected,
  onToggle,
  compact,
}: {
  s: StudentSearchResult
  selected: boolean
  onToggle: () => void
  compact?: boolean
}) {
  const { t } = useTranslation('payments')
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={[
        'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[rgb(var(--background-secondary))]',
        compact ? 'ps-12' : '',
        selected ? 'bg-[rgb(var(--accent-soft))]/30' : '',
      ].join(' ')}
    >
      <TriCheckbox state={selected ? 'on' : 'off'} />
      <Avatar name={s.fullName} />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[rgb(var(--text-primary))] truncate">
          {s.fullName}
        </div>
        <div className="text-xs text-[rgb(var(--text-tertiary))] truncate">
          {s.studentNumber ?? s.studentId} · {gradeLabel(s.currentGradeLevel, t)}
        </div>
      </div>
    </div>
  )
}

function TriCheckbox({ state }: { state: 'off' | 'mixed' | 'on' }) {
  if (state === 'on') {
    return (
      <span className={/* allow-hardcoded-color: contrast tick on filled accent checkbox */ "inline-flex items-center justify-center w-4 h-4 rounded border bg-[rgb(var(--accent-strong))] border-[rgb(var(--accent-strong))] text-white"}>
        <Check className="w-3 h-3" strokeWidth={3} />
      </span>
    )
  }
  if (state === 'mixed') {
    return (
      <span className={/* allow-hardcoded-color: contrast tick on filled accent checkbox */ "inline-flex items-center justify-center w-4 h-4 rounded border bg-[rgb(var(--accent-strong))] border-[rgb(var(--accent-strong))] text-white"}>
        <span className={/* allow-hardcoded-color: indeterminate dash on filled accent checkbox */ "block w-2 h-0.5 bg-white"} />
      </span>
    )
  }
  return (
    <span className="inline-block w-4 h-4 rounded border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))]" />
  )
}

function Avatar({ name }: { name: string }) {
  // DiceBear adventurer avatars, deterministic by name. Same source as
  // the payments + billing-accounts pages (see
  // `getStudentAvatarUrl` in apps/finance/src/routes/billing/payments/index.tsx).
  // `loading="lazy"` + decoding="async" so a 250-student flat list
  // doesn't block the operator's first paint while DiceBear fans out N
  // SVG requests. The CSS `aspect-square` keeps the layout stable while
  // the SVG fetches.
  const src = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(
    name,
  )}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      aria-hidden="true"
      className="w-7 h-7 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] flex-shrink-0"
    />
  )
}

function EmptyHint() {
  const { t } = useTranslation('payments')
  return (
    <div className="text-center py-10 text-sm text-[rgb(var(--text-tertiary))] border border-dashed border-[rgb(var(--border-primary))] rounded-md">
      {t('bulkGenerate.step1.noStudentsMatch')}
    </div>
  )
}

function gradeLabel(g: string, t: Translate): string {
  if (!g) return t('bulkGenerate.common.unknown')
  return /^\d+$/.test(g) ? t('bulkGenerate.common.gradeLabel', { grade: g }) : g
}

// ---------------------------------------------------------------------------
// Recipient rail (running count + per-grade breakdown)
// ---------------------------------------------------------------------------

function RecipientRail({
  summary,
  totalStudents,
}: {
  summary: ReturnType<typeof summarize>
  totalStudents: number
}) {
  const { t } = useTranslation('payments')
  return (
    <aside className="space-y-3 p-4 border border-[rgb(var(--border-primary))] rounded-md bg-[rgb(var(--background-secondary))] h-fit sticky top-2">
      <div>
        <div className={/* allow-arbitrary-spacing: dense bulk-wizard label; pre-token-sweep */ "text-[11px] uppercase tracking-wider text-[rgb(var(--text-tertiary))]"}>
          {t('bulkGenerate.step1.recipientsSelected')}
        </div>
        <div className="text-2xl font-semibold text-[rgb(var(--text-primary))] mt-0.5">
          {summary.total}
          <span className="text-sm text-[rgb(var(--text-tertiary))]"> / {totalStudents}</span>
        </div>
      </div>

      {summary.perGrade.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-[rgb(var(--text-secondary))]">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> {t('bulkGenerate.step1.gradesCovered')}
            </span>
            <span className="font-semibold">{summary.perGrade.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.perGrade.map(({ grade, count }) => (
              <span
                key={grade}
                className={/* allow-arbitrary-spacing: dense bulk-wizard segment chip; pre-token-sweep */ "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))]"}
              >
                {gradeLabel(grade, t)}
                <span className="px-1 py-0 rounded bg-[rgb(var(--background-secondary))] tabular-nums">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-[rgb(var(--text-tertiary))] leading-relaxed">
          {t('bulkGenerate.step1.emptyRailPrefix')}{' '}
          <b className="text-[rgb(var(--text-primary))]">
            {t('bulkGenerate.step1.byStudent')}
          </b>{' '}
          {t('bulkGenerate.step1.emptyRailSuffix')}
        </p>
      )}
    </aside>
  )
}
