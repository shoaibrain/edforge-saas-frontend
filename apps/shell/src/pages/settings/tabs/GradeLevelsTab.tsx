/**
 * Grade Levels Tab — P2 of the Saraswati grade-levels unblock.
 *
 * Read/write surface for `School.enabledGradeLevels` against the
 * `PATCH /schools/{id}/grade-levels` endpoint shipped in Phase 1.
 *
 * Catalog is the immutable global set (`GRADE_LEVEL_OPTIONS`); schools
 * select which codes they offer. Ed-Fi descriptor mapping is shown as a
 * read-only pill on every entry so operators understand how each code
 * collapses for IEMIS/Ed-Fi reporting (PG/NUR → ECD, LKG/UKG → PPC, etc.).
 *
 * ABAC: the tab is mounted unconditionally (matches the rest of
 * school-detail.tsx — the school page itself is the gate). This component
 * enforces `gradelevels:edit` locally: when missing, a read-only banner
 * is shown and every checkbox + Save are disabled.
 */

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, RotateCcw, Info } from 'lucide-react'
import {
  GRADE_LEVEL_OPTIONS,
  GRADE_RANGE_TO_DESCRIPTOR,
  type UpdateSchoolGradeLevelsDto,
} from '@aibrains/shared-types'
import type { School } from '@edforge/types'
import { usePermission } from '@edforge/abac'
import { tenantService } from '@/services/tenant.service'

// ============================================================================
// CATALOG GROUPING (display only — code identity is what's persisted)
// ============================================================================

interface GradeBand {
  id: string
  label: string
  emoji: string
  codes: string[]
}

const BANDS: GradeBand[] = [
  {
    id: 'early-childhood',
    label: 'Early Childhood',
    emoji: '🧸',
    codes: ['ECD', 'PPC', 'PG', 'NUR', 'LKG', 'UKG', 'PK', 'K'],
  },
  {
    id: 'primary',
    label: 'Primary',
    emoji: '✏️',
    codes: ['1', '2', '3', '4', '5'],
  },
  {
    id: 'middle',
    label: 'Middle',
    emoji: '📚',
    codes: ['6', '7', '8'],
  },
  {
    id: 'high',
    label: 'High / Secondary',
    emoji: '🎓',
    codes: ['9', '10', '11', '12'],
  },
]

const LABEL_BY_CODE: Record<string, string> = Object.fromEntries(
  GRADE_LEVEL_OPTIONS.map((o) => [o.value, o.label])
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface GradeLevelsTabProps {
  schoolId: string
  school: School
}

export default function GradeLevelsTab({ schoolId, school }: GradeLevelsTabProps) {
  const canEdit = usePermission('edit', 'gradelevels', schoolId)
  const queryClient = useQueryClient()

  const initial = useMemo(
    () => new Set<string>(school.enabledGradeLevels ?? []),
    [school.enabledGradeLevels]
  )
  const [selected, setSelected] = useState<Set<string>>(initial)

  const isDirty = useMemo(() => {
    if (selected.size !== initial.size) return true
    for (const code of selected) if (!initial.has(code)) return true
    return false
  }, [selected, initial])

  const mutation = useMutation({
    mutationFn: (dto: UpdateSchoolGradeLevelsDto) =>
      tenantService.patchSchoolGradeLevels(schoolId, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(['school', schoolId], updated)
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] })
      toast.success('Grade levels updated')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: unknown } }; message?: string } | undefined
      const msg = e?.response?.data?.message ?? e?.message ?? 'Failed to update grade levels'
      toast.error(Array.isArray(msg) ? msg.join(', ') : String(msg))
    },
  })

  function toggle(code: string) {
    if (!canEdit) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  function reset() {
    setSelected(new Set(initial))
  }

  function save() {
    const payload = orderByCatalog(selected)
    if (payload.length === 0) {
      toast.error('Select at least one grade level before saving')
      return
    }
    mutation.mutate({ enabledGradeLevels: payload })
  }

  const hasZero = selected.size === 0
  const saveDisabled = !canEdit || !isDirty || mutation.isPending || hasZero

  return (
    <div className="space-y-5">
      {!canEdit && (
        <div className="flex items-start gap-2 bg-[rgba(55,138,221,0.05)] border border-[rgba(55,138,221,0.18)] rounded-lg px-3 py-2 text-xs text-[#378ADD]">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            You can view but not change this school's enabled grade levels. Contact a Principal or
            Tenant Admin to edit.
          </span>
        </div>
      )}

      <div className="flex items-start gap-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2 text-xs text-[rgb(var(--text-tertiary))]">
        <Info size={14} className="mt-0.5 shrink-0 text-[rgb(var(--text-secondary))]" />
        <span>
          Pick the grade levels this school actually runs. The arrow shows how each code is
          reported to Ed-Fi / IEMIS. Codes are globally curated and cannot be added per-school —
          if you need a new one, contact platform support.
        </span>
      </div>

      <div className="space-y-4">
        {BANDS.map((band) => (
          <BandSection
            key={band.id}
            band={band}
            selected={selected}
            canEdit={canEdit}
            onToggle={toggle}
          />
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-4">
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          {selected.size} of {GRADE_LEVEL_OPTIONS.length} selected
          {isDirty && <span className="ml-2 text-[#EF9F27]">• unsaved changes</span>}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={!isDirty || mutation.isPending}
            className="text-xs px-3 py-1.5 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[rgb(var(--text-secondary))] hover:bg-[rgba(255,255,255,0.08)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saveDisabled}
            className="text-xs px-3 py-1.5 rounded-md bg-[#1D9E75] text-[rgb(var(--action-primary-fg))] hover:bg-[#168862] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Save size={12} /> {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// BAND SECTION
// ============================================================================

interface BandSectionProps {
  band: GradeBand
  selected: Set<string>
  canEdit: boolean
  onToggle: (code: string) => void
}

function BandSection({ band, selected, canEdit, onToggle }: BandSectionProps) {
  return (
    <div className="bg-[rgb(var(--background-primary))] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.05)] flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[rgba(127,119,221,0.1)] flex items-center justify-center text-sm">
          {band.emoji}
        </div>
        <h4 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{band.label}</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
        {band.codes.map((code) => (
          <GradeLevelOption
            key={code}
            code={code}
            checked={selected.has(code)}
            disabled={!canEdit}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SINGLE OPTION
// ============================================================================

interface GradeLevelOptionProps {
  code: string
  checked: boolean
  disabled: boolean
  onToggle: (code: string) => void
}

function GradeLevelOption({ code, checked, disabled, onToggle }: GradeLevelOptionProps) {
  const label = LABEL_BY_CODE[code] ?? code
  const descriptor = GRADE_RANGE_TO_DESCRIPTOR[code]

  return (
    <label
      className={[
        'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
        checked
          ? 'bg-[rgba(29,158,117,0.08)] border-[rgba(29,158,117,0.4)]'
          : 'bg-[rgb(var(--background-secondary))] border-[rgba(255,255,255,0.08)]',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-[#1D9E75]/40',
      ].join(' ')}
    >
      <span className="flex items-center gap-2 min-w-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={() => onToggle(code)}
          className="accent-[#1D9E75]"
          aria-label={label}
        />
        <span className="font-medium text-[rgb(var(--text-primary))] truncate">{label}</span>
      </span>
      {descriptor && (
        <span
          className="shrink-0 text-xs uppercase tracking-wide px-1.5 py-0.5 rounded bg-[rgba(127,119,221,0.1)] text-[#7F77DD]"
          title={`Ed-Fi descriptor for ${code}`}
        >
          → {descriptor}
        </span>
      )}
    </label>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Return the selected codes in canonical catalog order (matches
 * `GRADE_LEVEL_OPTIONS` ordering — the backend stores the array but doesn't
 * sort it, so we send it pre-sorted so the UI doesn't see "saved" data
 * reorder on refetch).
 */
function orderByCatalog(selected: Set<string>): string[] {
  return GRADE_LEVEL_OPTIONS.filter((o) => selected.has(o.value)).map((o) => o.value)
}
