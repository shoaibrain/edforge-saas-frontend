/**
 * StatusControl — the compact per-row attendance status control.
 *
 * Replaces the always-on 5-button cluster. At rest (hover-capable pointers) it
 * shows ONE pill of the current status (or a dashed "Mark" + caret); on row
 * hover / focus-within it crossfades to the full segmented P/A/T/E/R set in the
 * SAME fixed width (no layout shift) — so a marked OR unmarked row stays ONE
 * click to change with a mouse. On touch / coarse pointers callers pass
 * `expandTrigger="always"` so the full set is always visible (no hover to rely on).
 *
 * Contract preserved from the legacy row buttons: every option keeps
 * `aria-label="Mark <Label>"` + `aria-checked`. The fast roll-call shortcuts
 * (P/A/T/E/R) and vertical nav (↑/↓) stay on the ROW wrapper (AttendanceRow) and
 * must keep working even when a segment is focused — so this control only
 * consumes ←/→/Home/End (intra-radiogroup focus), never the row-level keys.
 */

import { useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { focusRingInset } from '@edforge/ui'
import { ATTENDANCE_STATUS_META, ENTRY_STATUSES, TONE_CLASSES } from '../attendanceStatus'
import type { AttendanceStatus } from '../../../services/academics.service'

export interface StatusControlProps {
  value: AttendanceStatus | null
  onChange: (status: AttendanceStatus) => void
  /** Segments offered (default = entry set; pass LOCKED_OVERRIDE_STATUSES for locked rows). */
  allowed?: AttendanceStatus[]
  disabled?: boolean
  /**
   * 'hover' (default): compact resting pill that reveals the segments on hover /
   * focus-within. 'always': segments always visible (touch / coarse pointers).
   */
  expandTrigger?: 'hover' | 'always'
}

const SEG = 'h-8 w-8'

export function StatusControl({
  value,
  onChange,
  allowed = ENTRY_STATUSES,
  disabled = false,
  expandTrigger = 'hover',
}: StatusControlProps) {
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([])

  const focusIndex = (i: number) => {
    const n = allowed.length
    if (n === 0) return
    const idx = ((i % n) + n) % n
    btnRefs.current[idx]?.focus()
  }

  // Only horizontal nav is consumed here; ↑/↓ and P/A/T/E/R bubble to the row.
  const onSegKeyDown = (e: React.KeyboardEvent, i: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault(); e.stopPropagation(); focusIndex(i + 1); break
      case 'ArrowLeft':
        e.preventDefault(); e.stopPropagation(); focusIndex(i - 1); break
      case 'Home':
        e.preventDefault(); e.stopPropagation(); focusIndex(0); break
      case 'End':
        e.preventDefault(); e.stopPropagation(); focusIndex(allowed.length - 1); break
      default:
        break
    }
  }

  const activeIdx = value ? allowed.indexOf(value) : -1
  const rovingIdx = activeIdx >= 0 ? activeIdx : 0

  const segments = (
    <div role="radiogroup" aria-label="Attendance status" className="flex items-center gap-1">
      {allowed.map((s, i) => {
        const meta = ATTENDANCE_STATUS_META[s]
        const tone = TONE_CLASSES[meta.tone]
        const active = value === s
        return (
          <button
            key={s}
            ref={(el) => {
              btnRefs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`Mark ${meta.label}`}
            title={`${meta.label}${meta.shortcut ? ` (${meta.shortcut})` : ''}`}
            tabIndex={i === rovingIdx ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(s)}
            onKeyDown={(e) => onSegKeyDown(e, i)}
            className={`${SEG} rounded-lg text-sm font-bold transition-colors ${focusRingInset} disabled:opacity-50 ${
              active ? tone.btnActive : `bg-surface-secondary text-text-tertiary ${tone.btnHover}`
            }`}
          >
            {meta.shortLabel}
          </button>
        )
      })}
    </div>
  )

  if (expandTrigger === 'always') {
    return segments
  }

  const restMeta = value ? ATTENDANCE_STATUS_META[value] : null
  const restTone = restMeta ? TONE_CLASSES[restMeta.tone] : null

  return (
    <div className="group/sc relative inline-flex items-center">
      {/* Resting pill — visual only; fades out on hover/focus. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-end gap-1 transition-opacity group-hover/sc:opacity-0 group-focus-within/sc:opacity-0"
      >
        {restMeta && restTone ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${restTone.badgeBg} ${restTone.fg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${restTone.dot}`} />
            {restMeta.label}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-dashed border-border-secondary px-2.5 py-1 text-xs text-text-tertiary">
            Mark
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-text-tertiary" />
      </div>
      {/* Segmented set — interactive; revealed on hover/focus (hover pointers). */}
      <div className="pointer-events-none opacity-0 transition-opacity group-hover/sc:pointer-events-auto group-hover/sc:opacity-100 group-focus-within/sc:pointer-events-auto group-focus-within/sc:opacity-100">
        {segments}
      </div>
    </div>
  )
}
