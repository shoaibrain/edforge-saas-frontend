/**
 * BlocksPanel — list + manage multi-day Calendar Blocks for an AY.
 *
 * Sub-section embedded in `CalendarStep` (AcademicSetupTab Step 3). The
 * operator sees this immediately below the calendar grid once the
 * calendar has been generated. Header + filter chips + scrollable list
 * + "+ New Block" button. Edit / Delete affordances per row.
 *
 * Visual list mirrors the bell-schedule pattern in
 * `school-bell-schedule.tsx`. Empty state references the seeded blocks
 * from the locale defaults so the operator understands that a fresh
 * PABSON calendar already has Dashain/Tihar/Summer Vacation pre-loaded
 * before they touch this panel.
 *
 * Block list cards show:
 *   - blockName + descriptor chip
 *   - date range (AD + BS via adToBS when calendarSystem is bikram_sambat)
 *   - day count + child event type
 *   - sub-event count
 *   - Edit (pencil) + Delete (trash) buttons
 *
 * Delete is confirm-modal-gated with explicit copy that cascading the
 * delete will reset the N underlying calendar dates and lose any
 * per-day notes (operator overrides survive the block PATCH but NOT
 * the block DELETE — that's the C4.3.c cascade-delete contract).
 */

import { useState } from 'react'
import type {
  CalendarBlockListItemDto,
  CalendarBlockDescriptor,
  CalendarBlockResponseDto,
} from '@aibrains/shared-types'
import {
  useCalendarBlocks,
  useCalendarBlock,
  useDeleteCalendarBlock,
} from '../../hooks/useCalendarBlocks'
import { BlockDrawer } from './BlockDrawer'
import { adToBS } from '@edforge/date-utils'

// BS month names (English) for the BS-mode date formatter.
const BS_MONTH_NAMES = [
  'Baishakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Pus',
  'Magh',
  'Falgun',
  'Chaitra',
]

// Descriptor → display metadata for chips and filter buttons.
const DESCRIPTOR_META: Record<
  CalendarBlockDescriptor,
  { label: string; fg: string; bgChip: string; borderChip: string; icon: string }
> = {
  religious_festival: {
    label: 'Religious Festival',
    fg: '#7F77DD',
    bgChip: 'rgba(127,119,221,0.08)',
    borderChip: 'rgba(127,119,221,0.2)',
    icon: '🪔',
  },
  school_vacation: {
    label: 'School Vacation',
    fg: '#1D9E75',
    bgChip: 'rgba(29,158,117,0.08)',
    borderChip: 'rgba(29,158,117,0.2)',
    icon: '🏖️',
  },
  exam_block: {
    label: 'Exam Block',
    fg: '#F97316',
    bgChip: 'rgba(249,115,22,0.08)',
    borderChip: 'rgba(249,115,22,0.2)',
    icon: '📝',
  },
  national_observance: {
    label: 'National Observance',
    fg: '#E24B4A',
    bgChip: 'rgba(226,75,74,0.08)',
    borderChip: 'rgba(226,75,74,0.2)',
    icon: '🏛️',
  },
  other: {
    label: 'Other',
    fg: 'rgb(var(--text-tertiary))',
    bgChip: 'rgba(255,255,255,0.05)',
    borderChip: 'rgba(255,255,255,0.08)',
    icon: '📌',
  },
}

const FILTER_OPTIONS: { value: CalendarBlockDescriptor | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'religious_festival', label: 'Religious' },
  { value: 'school_vacation', label: 'Vacation' },
  { value: 'exam_block', label: 'Exam' },
  { value: 'national_observance', label: 'Observance' },
  { value: 'other', label: 'Other' },
]

function formatDate(isoDate: string, calendarSystem: 'gregorian' | 'bikram_sambat'): string {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T12:00:00')
  if (calendarSystem === 'bikram_sambat') {
    try {
      const bs = adToBS(d)
      return `${BS_MONTH_NAMES[bs.month - 1] ?? bs.month} ${bs.day}, ${bs.year}`
    } catch {
      /* fall through to AD */
    }
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ============================================================================
// Component
// ============================================================================

export interface BlocksPanelProps {
  schoolId: string
  academicYearId: string
  academicYearStartDate: string
  academicYearEndDate: string
  calendarSystem: 'gregorian' | 'bikram_sambat'
}

export function BlocksPanel({
  schoolId,
  academicYearId,
  academicYearStartDate,
  academicYearEndDate,
  calendarSystem,
}: BlocksPanelProps) {
  const [filter, setFilter] = useState<CalendarBlockDescriptor | 'all'>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [deletingBlock, setDeletingBlock] = useState<CalendarBlockListItemDto | null>(null)

  const { data, isLoading, isError, error } = useCalendarBlocks(schoolId, academicYearId, {
    descriptor: filter === 'all' ? undefined : filter,
  })
  const deleteMutation = useDeleteCalendarBlock(schoolId)

  // Lazily fetch the full block (with subEvents) when entering edit mode.
  const editingBlockQuery = useCalendarBlock(
    schoolId,
    editingBlockId ?? '',
    !!editingBlockId,
  )

  const items = data?.items ?? []

  function openCreate() {
    setEditingBlockId(null)
    setDrawerOpen(true)
  }

  function openEdit(blockId: string) {
    setEditingBlockId(blockId)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setEditingBlockId(null)
  }

  async function confirmDelete() {
    if (!deletingBlock) return
    await deleteMutation.mutateAsync({
      blockId: deletingBlock.blockId,
      blockName: deletingBlock.blockName,
    })
    setDeletingBlock(null)
  }

  // The full edit-mode block is what BlockDrawer needs. While the GET is
  // in flight, keep the drawer closed; once the query resolves, the
  // drawer renders with the populated block.
  const blockToEdit: CalendarBlockResponseDto | null =
    editingBlockId && editingBlockQuery.data ? editingBlockQuery.data : null
  const editLoadInFlight = !!editingBlockId && editingBlockQuery.isLoading

  return (
    <section
      className="bg-[rgb(var(--surface-primary))] border border-[rgba(55,138,221,0.15)] rounded-xl p-3.5 mt-3"
      aria-labelledby="multi-day-events-heading"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3
            id="multi-day-events-heading"
            className="text-xs font-semibold text-[rgb(var(--text-primary))]"
          >
            Multi-Day Events
          </h3>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
            Declare Dashain, vacations, exam blocks, and other multi-day events. Each block writes one calendar-date row per day in the range.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))]"
        >
          + New Block
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                active
                  ? 'bg-[rgb(var(--action-primary-bg))]/15 border-[rgb(var(--border-focus)/0.35)] text-[rgb(var(--action-secondary-fg))]'
                  : 'bg-transparent border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* List */}
      {isLoading && (
        <div className="text-xs text-[rgb(var(--text-tertiary))] py-6 text-center">
          Loading blocks…
        </div>
      )}

      {isError && (
        <div className="text-xs text-[rgb(var(--state-danger-fg))] py-6 text-center">
          Failed to load blocks: {error?.message ?? 'Unknown error'}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div className="bg-[rgba(255,255,255,0.02)] border border-dashed border-[rgb(var(--border-primary))] rounded-xl px-3 py-6 text-center">
          <p className="text-xs text-[rgb(var(--text-tertiary))]">
            {filter === 'all'
              ? 'No multi-day blocks yet. Click "+ New Block" to declare your first one (Dashain, Summer Vacation, exam window, etc.).'
              : `No "${FILTER_OPTIONS.find((o) => o.value === filter)?.label}" blocks. Adjust the filter above or create one.`}
          </p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((block) => {
            const meta = DESCRIPTOR_META[block.blockDescriptor] ?? DESCRIPTOR_META.other
            return (
              <li
                key={block.blockId}
                className="border border-[rgb(var(--border-primary))] rounded-xl p-3 hover:bg-[rgba(255,255,255,0.02)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base flex-shrink-0" aria-hidden>
                        {meta.icon}
                      </span>
                      <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))] truncate">
                        {block.blockName}
                      </h4>
                      <span
                        className="flex-shrink-0 text-xs font-medium px-1.5 py-0.5 rounded border"
                        style={{
                          background: meta.bgChip,
                          borderColor: meta.borderChip,
                          color: meta.fg,
                        }}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[rgb(var(--text-secondary))] mb-1">
                      {formatDate(block.startDate, calendarSystem)} —{' '}
                      {formatDate(block.endDate, calendarSystem)}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--text-tertiary))]">
                      <span>
                        {block.childDateCount} day{block.childDateCount === 1 ? '' : 's'}
                      </span>
                      <span aria-hidden>·</span>
                      <span className="capitalize">{block.childEventType.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(block.blockId)}
                      className="px-2 py-1 text-xs font-medium text-[rgb(var(--text-tertiary))] hover:bg-[rgba(255,255,255,0.04)] rounded"
                      aria-label={`Edit ${block.blockName}`}
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBlock(block)}
                      className="px-2 py-1 text-xs font-medium text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgba(255,255,255,0.04)] rounded"
                      aria-label={`Delete ${block.blockName}`}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {/* Create / Edit drawer — only mount when we have data ready */}
      {drawerOpen && !editLoadInFlight && (
        <BlockDrawer
          open={drawerOpen}
          onClose={closeDrawer}
          schoolId={schoolId}
          academicYearId={academicYearId}
          academicYearStartDate={academicYearStartDate}
          academicYearEndDate={academicYearEndDate}
          calendarSystem={calendarSystem}
          blockToEdit={blockToEdit}
        />
      )}

      {/* Delete confirm modal — inline (matches school-rooms pattern) */}
      {deletingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.40)] px-4">
          <div className="bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl max-w-md w-full p-5">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-2">
              Delete "{deletingBlock.blockName}"?
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] leading-relaxed mb-1">
              This will cascade-delete the block plus all{' '}
              <strong>{deletingBlock.childDateCount}</strong> underlying calendar date
              {deletingBlock.childDateCount === 1 ? '' : 's'}.
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mb-4">
              Per-day notes on those dates will be lost. To regenerate the SYSTEM
              versions of those dates, re-run Generate Calendar afterward.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingBlock(null)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgba(255,255,255,0.04)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[rgb(var(--state-danger-fg))] text-[rgb(var(--action-primary-fg))] hover:brightness-95 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete Block'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
