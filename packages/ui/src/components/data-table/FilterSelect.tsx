import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Check, ChevronDown, ListFilter, X } from 'lucide-react'
import { cn, focusRingInset } from '../../utils'
import type { StatusTone } from '../StatusBadge'
import { DEFAULT_DATA_TABLE_LABELS } from './labels'
import type { DataTableLabels } from './types'

export interface FilterSelectOption {
  value: string
  label: string
  /** Faceted count shown right-aligned in the menu. */
  count?: number
  /**
   * Semantic tone for the leading dot — reuses the row status-pill taxonomy
   * (StatusBadge tone) so trigger, menu and table agree. Omit for a neutral
   * ring dot.
   */
  tone?: StatusTone
  /** Non-selectable option (kept visible, greyed). */
  disabled?: boolean
}

export interface FilterSelectProps {
  /** Facet name shown before the middot, e.g. "Status" → `Status · All`. */
  label: string
  options: FilterSelectOption[]
  /** Selected option values. */
  value: string[]
  onChange: (next: string[]) => void
  /** Leading facet icon. Defaults to a filter glyph. */
  icon?: ReactNode
  /** Allow multiple selections (default true). Single-select closes on pick. */
  multiple?: boolean
  /** Menu heading; defaults to `Filter by <label>`. */
  menuLabel?: string
  /** Footer hint text (e.g. "16 payments"). */
  hint?: string
  /**
   * Zero-count handling. `dim` (default) keeps the option visible but greyed;
   * `hide` removes it. The contract dims — hiding makes users doubt the state
   * exists.
   */
  zeroBehavior?: 'dim' | 'hide'
  /** Word shown when nothing is selected. Default "All". */
  allLabel?: string
  labels?: DataTableLabels
  /** Extra classes on the wrapper. */
  className?: string
}

const TONE_DOT: Record<StatusTone, string> = {
  success: 'bg-[rgb(var(--state-success-fg))]',
  warning: 'bg-[rgb(var(--state-warning-fg))]',
  danger: 'bg-[rgb(var(--state-danger-fg))]',
  info: 'bg-[rgb(var(--state-info-fg))]',
  neutral: 'bg-[rgb(var(--text-tertiary))]',
}

const EASE = 'ease-[cubic-bezier(0.32,0.72,0,1)]'

function Dot({ tone, className }: { tone?: StatusTone; className?: string }) {
  if (!tone || tone === 'neutral') {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'h-2 w-2 flex-none rounded-full border border-[rgb(var(--text-tertiary))]',
          className,
        )}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn('h-2 w-2 flex-none rounded-full', TONE_DOT[tone], className)}
    />
  )
}

/**
 * The trigger's value fragment — reads like a sentence:
 *   `Status · All` · `Status · Completed` · `Status · Completed +2`
 */
function TriggerValue({
  selected,
  allLabel,
}: {
  selected: FilterSelectOption[]
  allLabel: string
}) {
  if (selected.length === 0) {
    return (
      <span className="text-[rgb(var(--text-secondary))]">{allLabel}</span>
    )
  }
  if (selected.length === 1) {
    return (
      <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[rgb(var(--text-primary))]">
        <Dot tone={selected[0].tone} className="h-1.5 w-1.5" />
        <span className="truncate">{selected[0].label}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-[rgb(var(--text-primary))]">
      <span className="inline-flex items-center">
        {selected.slice(0, 3).map((opt, i) => (
          <Dot
            key={opt.value}
            tone={opt.tone}
            className={cn(
              'h-1.5 w-1.5',
              i > 0 && '-ml-1 ring-2 ring-[rgb(var(--background-secondary))]',
            )}
          />
        ))}
      </span>
      <span className="truncate">
        {selected[0].label} +{selected.length - 1}
      </span>
    </span>
  )
}

/**
 * Listbox contents — rendered inside the open popover panel. Lives as its own
 * component so its mount effect (focus the selected/first option) runs exactly
 * when the menu opens.
 */
function FilterSelectMenu({
  options,
  value,
  onToggle,
  onClear,
  multiple,
  menuLabel,
  hint,
  clearLabel,
  close,
}: {
  options: FilterSelectOption[]
  value: string[]
  onToggle: (val: string, close: () => void) => void
  onClear: () => void
  multiple: boolean
  menuLabel: string
  hint?: string
  clearLabel: string
  close: () => void
}) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Indices of the options that can hold focus (disabled ones are skipped).
  const focusableIndexes = options
    .map((o, i) => (o.disabled ? -1 : i))
    .filter((i) => i >= 0)

  // Roving tabindex: exactly ONE option is a tab stop at a time, so the whole
  // listbox is a single stop (Tab moves out of it, not option-by-option). Start
  // on the first selected option, else the first focusable one.
  const [activeIndex, setActiveIndex] = useState(() => {
    const sel = options.findIndex((o) => !o.disabled && value.includes(o.value))
    return sel >= 0 ? sel : (focusableIndexes[0] ?? -1)
  })

  // On open, land focus on the active option so arrow-keys + Enter work at once.
  useEffect(() => {
    if (activeIndex >= 0) optionRefs.current[activeIndex]?.focus()
    // Run once, when the menu mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const moveTo = (index: number) => {
    if (index < 0) return
    setActiveIndex(index)
    optionRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (focusableIndexes.length === 0) return
    const pos = focusableIndexes.indexOf(activeIndex)
    let nextPos = pos
    if (event.key === 'ArrowDown') nextPos = Math.min(pos + 1, focusableIndexes.length - 1)
    else if (event.key === 'ArrowUp') nextPos = Math.max(pos - 1, 0)
    else if (event.key === 'Home') nextPos = 0
    else if (event.key === 'End') nextPos = focusableIndexes.length - 1
    moveTo(focusableIndexes[nextPos < 0 ? 0 : nextPos])
  }

  return (
    <>
      <div className="px-2.5 pb-1 pt-1.5 font-mono text-2xs font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
        {menuLabel}
      </div>
      {/* Only the options live inside role=listbox. The Clear button sits in the
          footer OUTSIDE it, so its keydowns never leak into arrow navigation. */}
      <div
        role="listbox"
        aria-label={menuLabel}
        aria-multiselectable={multiple || undefined}
        onKeyDown={handleKeyDown}
      >
        {options.map((option, i) => {
          const isSelected = value.includes(option.value)
          const isZero = option.count === 0
          return (
            <button
              key={option.value}
              ref={(el) => {
                optionRefs.current[i] = el
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              disabled={option.disabled}
              tabIndex={i === activeIndex ? 0 : -1}
              onFocus={() => setActiveIndex(i)}
              onClick={() => !option.disabled && onToggle(option.value, close)}
              className={cn(
                'flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))]',
                'motion-reduce:transition-none',
                focusRingInset,
                isSelected && 'text-[rgb(var(--text-primary))]',
                isZero && 'opacity-40',
                option.disabled && 'cursor-not-allowed opacity-40',
              )}
            >
              <Dot tone={option.tone} />
              <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
              {option.count != null && (
                <span className="font-mono text-2xs tabular-nums text-[rgb(var(--text-tertiary))]">
                  {option.count}
                </span>
              )}
              <Check
                aria-hidden="true"
                className={cn(
                  'h-3.5 w-3.5 flex-none text-[rgb(var(--state-success-fg))] transition-opacity motion-reduce:transition-none',
                  isSelected ? 'opacity-100' : 'opacity-0',
                )}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-[rgb(var(--border-primary)/0.35)] px-2.5 pb-1 pt-2">
        {hint ? (
          <span className="text-2xs text-[rgb(var(--text-tertiary))]">{hint}</span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={onClear}
          disabled={value.length === 0}
          className={cn(
            'rounded px-2 py-1 text-xs font-semibold text-[rgb(var(--text-secondary))] transition-colors',
            'hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))]',
            'disabled:pointer-events-none disabled:opacity-40',
            'motion-reduce:transition-none',
            focusRingInset,
          )}
        >
          {clearLabel}
        </button>
      </div>
    </>
  )
}

/**
 * FilterSelect — the canonical unified-toolbar facet control.
 *
 * One quiet `label · value` trigger that opens a `role="listbox"` menu, in
 * place of an always-mounted row of preset pills. The trigger stays compact
 * regardless of how many options exist (6 statuses or 16); the menu carries
 * the tone dots, faceted counts and multi-select. Built once here and reused
 * for Status, Gateway and any future facet — see `DataTableFacetedFilter`
 * (client columns) and the toolbar's `presets` fold.
 *
 * Accessibility: `role="listbox"`/`role="option"`, arrow-key navigation, Esc
 * and outside-click close and return focus to the trigger (Headless UI
 * Popover). All motion is one-shot and gated behind `prefers-reduced-motion`.
 */
export function FilterSelect({
  label,
  options,
  value,
  onChange,
  icon,
  multiple = true,
  menuLabel,
  hint,
  zeroBehavior = 'dim',
  allLabel = 'All',
  labels,
  className,
}: FilterSelectProps) {
  const resolvedLabels = labels ?? DEFAULT_DATA_TABLE_LABELS
  const active = value.length > 0
  const selected = value
    .map((val) => options.find((opt) => opt.value === val))
    .filter((opt): opt is FilterSelectOption => !!opt)

  const visibleOptions =
    zeroBehavior === 'hide'
      ? options.filter((opt) => opt.count !== 0 || value.includes(opt.value))
      : options

  const toggle = (val: string, close: () => void) => {
    if (!multiple) {
      onChange(value.includes(val) ? [] : [val])
      close()
      return
    }
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val])
  }

  return (
    <Popover className={cn('relative inline-block flex-none', className)}>
      {({ open }) => (
        <>
          {/* Bordered wrapper owns the border/tint/radius. The clear (✕) is a
              real sibling <button>, NOT nested inside the trigger button, so
              there is no interactive-in-interactive nesting and the ✕ is
              keyboard-operable. The chevron stays inside the single trigger
              button (unambiguous focus-return on Esc/outside-click). */}
          <div
            className={cn(
              'inline-flex h-9 max-w-60 items-center overflow-hidden rounded-lg border text-sm font-medium transition-colors',
              'whitespace-nowrap motion-reduce:transition-none',
              active
                ? 'border-[var(--mint-border)] bg-[var(--mint-soft)] text-[rgb(var(--text-primary))]'
                : open
                  ? 'border-[rgb(var(--border-primary)/0.6)] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))]'
                  : 'border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-primary)/0.6)] hover:bg-[rgb(var(--background-secondary))]',
            )}
          >
            <PopoverButton
              aria-haspopup="listbox"
              aria-label={resolvedLabels.filterAriaLabel(label)}
              className={cn(
                'inline-flex h-full min-w-0 items-center gap-1.5 border-0 bg-transparent pl-2.5',
                active ? 'pr-1' : 'pr-2.5',
                focusRingInset,
              )}
            >
              <span
                className={cn(
                  'flex-none',
                  active ? 'text-[rgb(var(--mint))]' : 'text-[rgb(var(--text-tertiary))]',
                )}
              >
                {icon ?? <ListFilter className="h-3.5 w-3.5" />}
              </span>
              <span className="flex-none text-[rgb(var(--text-secondary))]">{label}</span>
              <span aria-hidden="true" className="flex-none text-[rgb(var(--text-tertiary))]">
                ·
              </span>
              <span className="inline-flex min-w-0 items-center">
                <TriggerValue selected={selected} allLabel={allLabel} />
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'ml-0.5 h-3.5 w-3.5 flex-none text-[rgb(var(--text-tertiary))] transition-transform duration-200 motion-reduce:transition-none',
                  EASE,
                  open && 'rotate-180',
                )}
              />
            </PopoverButton>
            {active && (
              <button
                type="button"
                aria-label={resolvedLabels.clearFilter}
                onClick={() => onChange([])}
                className={cn(
                  'mr-1.5 grid h-5 w-5 flex-none place-items-center rounded text-[rgb(var(--text-tertiary))]',
                  'hover:bg-[rgb(var(--mint-border)/0.4)] hover:text-[rgb(var(--text-primary))]',
                  focusRingInset,
                )}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Entry-only CSS animation (not a Headless transition) so the panel
              unmounts synchronously on close — focus returns to the trigger,
              and there is nothing to hang under prefers-reduced-motion. */}
          <PopoverPanel
            anchor="bottom start"
            className={cn(
              'z-50 [--anchor-gap:6px] min-w-56 origin-top rounded-xl border p-1',
              'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-elevated))] shadow-popover',
              'focus:outline-none',
              'animate-fade-in motion-reduce:animate-none',
            )}
          >
            {({ close }) => (
              <FilterSelectMenu
                options={visibleOptions}
                value={value}
                onToggle={toggle}
                onClear={() => onChange([])}
                multiple={multiple}
                menuLabel={menuLabel ?? `Filter by ${label.toLowerCase()}`}
                hint={hint}
                clearLabel="Clear"
                close={close}
              />
            )}
          </PopoverPanel>
        </>
      )}
    </Popover>
  )
}
