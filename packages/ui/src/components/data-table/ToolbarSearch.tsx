import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type InputHTMLAttributes,
} from 'react'
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
  /**
   * Enable the page-level `/` shortcut that focuses this field (default true).
   * The shortcut is documented in the input's `title` tooltip — there is no
   * longer a visible `/` chip. Kept named `showKbd` for source compatibility.
   */
  showKbd?: boolean
  /** Tooltip surfaced on the field; also documents the `/` shortcut. */
  title?: string
  /**
   * Override the wrapper layout/width. Default is fluid — `flex-1 min-w-44
   * max-w-xs` — so the search absorbs slack and shrinks gracefully instead of
   * forcing the toolbar row to wrap. Pass a fixed width (e.g. `w-72 flex-none`)
   * for standalone bars that want a pinned search.
   */
  className?: string
}

/**
 * ToolbarSearch — the canonical unified-toolbar search field.
 *
 * Rebuilt as STRUCTURE, not layers: the icon and the input are flex siblings
 * inside one bordered wrapper, so overlap is geometrically impossible — there
 * is no absolutely-positioned icon over the input and no compensating
 * `padding-left` left to lose in a future port (the class of regression that
 * shipped "Search" as "🔍arch"). The magnifier sits in a trailing action slot
 * and cross-morphs into a clear (×) button once a query exists.
 *
 * - `/` anywhere on the page (outside a field) focuses the search; surfaced in
 *   the `title` tooltip, no chip.
 * - `Esc` clears, then blurs.
 * - Motion is one-shot and gated behind `prefers-reduced-motion`.
 */
export const ToolbarSearch = forwardRef<HTMLInputElement, ToolbarSearchProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder,
      clearLabel = 'Clear search',
      showKbd = true,
      title,
      className,
      ...props
    },
    ref,
  ) => {
    // Only advertise the `/` shortcut when it is actually wired (showKbd). A
    // caller-supplied title always wins.
    const resolvedTitle = title ?? (showKbd ? 'Press / to search' : undefined)
    const innerRef = useRef<HTMLInputElement>(null)
    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        innerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
      },
      [ref],
    )

    const hasValue = value.length > 0

    const clear = () => {
      if (onClear) onClear()
      else onChange('')
    }

    // `/` → focus the first visible toolbar-search on the page. Every instance
    // resolves the SAME target, so exactly one focuses (no race), and typing
    // inside a field never hijacks the key.
    useEffect(() => {
      if (!showKbd) return
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
        const target = event.target as HTMLElement | null
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable)
        ) {
          return
        }
        const fields = Array.from(
          document.querySelectorAll<HTMLInputElement>('input[data-toolbar-search]'),
        ).filter((el) => !el.disabled)
        const chosen =
          fields.find((el) => {
            const r = el.getBoundingClientRect()
            return r.width > 0 && r.top > 0 && r.top < window.innerHeight
          }) ?? fields[0]
        if (chosen && chosen === innerRef.current) {
          event.preventDefault()
          chosen.focus()
        }
      }
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }, [showKbd])

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && hasValue) {
        event.preventDefault()
        clear()
        innerRef.current?.blur()
      }
      props.onKeyDown?.(event)
    }

    return (
      <div
        data-has-value={hasValue ? 'true' : 'false'}
        className={cn(
          'group flex h-9 items-center rounded-lg border transition-colors',
          'border-[rgb(var(--border-primary)/0.35)] bg-[rgb(var(--background-primary))]',
          'hover:border-[rgb(var(--border-primary)/0.6)]',
          'focus-within:border-[var(--mint-border)] focus-within:ring-2 focus-within:ring-[var(--mint-soft)]',
          'motion-reduce:transition-none',
          'flex-1 min-w-44 max-w-xs',
          className,
        )}
      >
        {/* eslint-disable-next-line edforge-design-system/prefer-ui-form-controls --
            ToolbarSearch IS the design-system's canonical search primitive; the
            native <input> lives here by design so apps never hand-roll one. */}
        <input
          ref={setRefs}
          // Only opted-in fields join the `/` target pool, so a showKbd={false}
          // field can never swallow the shortcut from an enabled sibling.
          data-toolbar-search={showKbd ? '' : undefined}
          type="text"
          placeholder={placeholder}
          title={resolvedTitle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // Borderless, transparent, flush 12px left inset. NO compensating
          // padding — nothing overlays the text, so nothing can collide with it.
          className={cn(
            'h-full min-w-0 flex-1 rounded-l-lg border-0 bg-transparent pl-3 pr-1 text-sm',
            'text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))]',
            'outline-none focus:outline-none focus:ring-0',
          )}
          {...props}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          // When empty the slot is a decorative magnifier that also focuses the
          // field; once a query exists it becomes the real clear (×) button.
          tabIndex={hasValue ? 0 : -1}
          aria-hidden={hasValue ? undefined : true}
          aria-label={clearLabel}
          title={hasValue ? clearLabel : resolvedTitle}
          onClick={() => {
            if (hasValue) clear()
            innerRef.current?.focus()
          }}
          className={cn(
            'mr-px grid h-8 w-8 flex-none place-items-center rounded-md border-0 bg-transparent',
            'text-[rgb(var(--text-tertiary))] transition-colors motion-reduce:transition-none',
            hasValue
              ? 'cursor-pointer hover:bg-[rgb(var(--background-secondary))] hover:text-[rgb(var(--text-primary))]'
              : 'cursor-text',
          )}
        >
          <Search
            aria-hidden="true"
            className={cn(
              '[grid-area:1/1] h-4 w-4 transition-[opacity,transform] duration-200 motion-reduce:transition-none',
              'ease-[cubic-bezier(0.32,0.72,0,1)]',
              'group-focus-within:text-[rgb(var(--text-secondary))]',
              hasValue ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
            )}
          />
          <X
            aria-hidden="true"
            className={cn(
              '[grid-area:1/1] h-3.5 w-3.5 transition-[opacity,transform] duration-200 motion-reduce:transition-none',
              'ease-[cubic-bezier(0.32,0.72,0,1)]',
              hasValue ? 'rotate-0 scale-100 opacity-100' : '-rotate-45 scale-50 opacity-0',
            )}
          />
        </button>
      </div>
    )
  },
)

ToolbarSearch.displayName = 'ToolbarSearch'
