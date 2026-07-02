import { forwardRef, type InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils'

export interface ToolbarSearchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'prefix' | 'type'> {
  value: string
  onChange: (value: string) => void
  /** Clear handler; defaults to `onChange('')`. */
  onClear?: () => void
  placeholder?: string
  /** Accessible label for the inline clear (×) button. */
  clearLabel?: string
  /** Show the `/` keyboard hint while empty (default true). */
  showKbd?: boolean
  /** Override the wrapper layout/width (default `w-72 max-w-full flex-none`). */
  className?: string
}

/**
 * ToolbarSearch — the canonical unified-toolbar search field ("esearch").
 *
 * One clean field: leading search icon, subtle `--border-primary/0.35` border,
 * mint focus ring, a `/` keyboard hint while empty, and an inline clear (×)
 * button once typed. Extracted from `DataTableToolbar` so standalone toolbars
 * (e.g. the Classrooms Overview) render a pixel-identical search — and so the
 * native `<input>` lives in `@edforge/ui`, not in an app (design-system rule).
 */
export const ToolbarSearch = forwardRef<HTMLInputElement, ToolbarSearchProps>(
  (
    { value, onChange, onClear, placeholder, clearLabel = 'Clear search', showKbd = true, className, ...props },
    ref,
  ) => {
    return (
      <div className={cn('relative w-72 max-w-full flex-none', className)}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
        <input
          ref={ref}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            // physical padding (pl/pr) — logical ps/pe does not render in this build
            'h-9 w-full rounded-lg pl-9 pr-9 text-sm',
            'border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-primary))]',
            'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
            'focus:border-[var(--mint-border)] focus:outline-none focus:ring-2 focus:ring-[var(--mint-soft)]',
          )}
          {...props}
        />
        {value ? (
          <button
            type="button"
            onClick={() => (onClear ? onClear() : onChange(''))}
            aria-label={clearLabel}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : showKbd ? (
          <kbd
            aria-hidden="true"
            className="absolute right-2 top-1/2 grid h-5 min-w-5 -translate-y-1/2 place-items-center rounded border border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-tertiary))] px-1.5 font-mono text-2xs font-semibold text-[rgb(var(--text-tertiary))]"
          >
            /
          </kbd>
        ) : null}
      </div>
    )
  },
)

ToolbarSearch.displayName = 'ToolbarSearch'
