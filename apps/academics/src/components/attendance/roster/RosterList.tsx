/**
 * RosterList — bounded, virtualized student list for the attendance grid.
 *
 * Owns the `@tanstack/react-virtual` windowing, the scroll element, and the
 * keyboard navigation model. Only the inner list scrolls (the grid's column
 * header + toolbar are flex-shrink-0 siblings above it), so page height stays
 * capped no matter how large the roster is.
 *
 * Keyboard nav under virtualization: off-screen rows unmount, so a far ↑/↓/Home/
 * End target may not be mounted when we try to focus it. We scrollToIndex, then
 * focus immediately if the row is already in the window, else stash the index in
 * `pendingFocus` and let the post-render effect focus it once the row mounts and
 * registers its imperative ref.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { AttendanceRow, type AttendanceRowRef } from '../AttendanceRow'
import type { AttendanceStatus } from '../../../services/academics.service'
import { useAcademicsI18n } from '../../../lib/i18n'

export interface RosterEntry {
  studentId: string
  studentName: string
  studentNumber?: string
  status: AttendanceStatus | null
  notes: string
  excuseType?: string
}

export interface RosterListProps {
  entries: RosterEntry[]
  isPastDate: boolean
  expandTrigger: 'hover' | 'always'
  lockedStudents?: Map<string, string>
  editingIds: Set<string>
  onStatusChange: (studentId: string, status: AttendanceStatus) => void
  onNotesChange: (studentId: string, notes: string) => void
  onExcuseTypeChange: (studentId: string, excuseType: string) => void
  onStartEdit: (studentId: string) => void
  onCorrectionSave: (studentId: string) => void
  onCorrectionCancel: (studentId: string) => void
  detailsOpenIds: Set<string>
  onToggleDetails: (studentId: string) => void
}

const ROW_H = 56

export function RosterList({
  entries,
  isPastDate,
  expandTrigger,
  lockedStudents,
  editingIds,
  onStatusChange,
  onNotesChange,
  onExcuseTypeChange,
  onStartEdit,
  onCorrectionSave,
  onCorrectionCancel,
  detailsOpenIds,
  onToggleDetails,
}: RosterListProps) {
  const { t } = useAcademicsI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<string, AttendanceRowRef>>(new Map())
  const pendingFocus = useRef<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_H,
    overscan: 8,
    getItemKey: (i) => entries[i]?.studentId ?? i,
    // First-paint size before the ResizeObserver measures the real bounded
    // container; the observer corrects it immediately in the browser. Also makes
    // the list render a sane window under SSR / jsdom (where RO never fires).
    initialRect: { width: 0, height: 800 },
  })

  const focusRowAt = useCallback(
    (index: number) => {
      const n = entries.length
      if (n === 0) return
      const idx = Math.max(0, Math.min(n - 1, index))
      setActiveIndex(idx)
      virtualizer.scrollToIndex(idx, { align: 'auto' })
      const ref = rowRefs.current.get(entries[idx].studentId)
      if (ref) ref.focus()
      else pendingFocus.current = idx // focused by the effect once it mounts
    },
    [entries, virtualizer],
  )

  const items = virtualizer.getVirtualItems()

  useEffect(() => {
    if (pendingFocus.current == null) return
    const id = entries[pendingFocus.current]?.studentId
    const ref = id ? rowRefs.current.get(id) : undefined
    if (ref) {
      ref.focus()
      pendingFocus.current = null
    }
  }, [items, entries])

  if (entries.length === 0) {
    return <div className="flex-1 py-8 text-center text-sm text-text-tertiary">{t('attendance.empty.noSearchMatches')}</div>
  }

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto scrollbar-thin" role="presentation">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {items.map((vi) => {
          const entry = entries[vi.index]
          if (!entry) return null
          const id = entry.studentId
          return (
            <div
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <AttendanceRow
                ref={(inst) => {
                  if (inst) rowRefs.current.set(id, inst)
                  else rowRefs.current.delete(id)
                }}
                studentId={id}
                studentName={entry.studentName}
                studentNumber={entry.studentNumber}
                currentStatus={entry.status}
                notes={entry.notes}
                excuseType={entry.excuseType}
                onStatusChange={(s) => onStatusChange(id, s)}
                onNotesChange={(n) => onNotesChange(id, n)}
                onExcuseTypeChange={(e) => onExcuseTypeChange(id, e)}
                detailsOpen={detailsOpenIds.has(id)}
                onToggleDetails={() => onToggleDetails(id)}
                isPastDate={isPastDate}
                isEditing={editingIds.has(id)}
                onStartEdit={() => onStartEdit(id)}
                onCorrectionSave={() => onCorrectionSave(id)}
                onCorrectionCancel={() => onCorrectionCancel(id)}
                onArrowUp={() => focusRowAt(vi.index - 1)}
                onArrowDown={() => focusRowAt(vi.index + 1)}
                locked={lockedStudents?.has(id)}
                lockedHint={lockedStudents?.get(id)}
                expandTrigger={expandTrigger}
                tabIndex={vi.index === activeIndex ? 0 : -1}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
