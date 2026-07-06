/**
 * ActionsMenu — the ⋯ overflow menu from the detail-page prototypes.
 * Plain button + positioned panel (no portal): closes on outside click,
 * Esc, or item selection. Danger items render in the danger state color.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn, focusRing } from '@edforge/ui'

export interface ActionsMenuItem {
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick: () => void
}

export interface ActionsMenuProps {
  items: ActionsMenuItem[]
  /** Accessible name for the trigger button. */
  label: string
}

export function ActionsMenu({ items, label }: ActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (items.length === 0) return null

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'grid h-9 w-9 place-items-center rounded-lg border transition-colors',
          'border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-primary))] text-[rgb(var(--text-secondary))]',
          'hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))]',
          open && 'bg-[rgb(var(--background-tertiary))]',
          focusRing
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute ef-inset-inline-end-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-elevated))] py-1 shadow-popover"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3 py-2 text-start text-sm transition-colors',
                'hover:bg-[rgb(var(--background-tertiary))]',
                item.danger
                  ? 'text-[rgb(var(--state-danger-fg))]'
                  : 'text-[rgb(var(--text-primary))]'
              )}
            >
              {item.icon && (
                <span
                  className={cn(
                    'grid w-5 place-items-center',
                    item.danger
                      ? 'text-[rgb(var(--state-danger-fg))]'
                      : 'text-[rgb(var(--text-tertiary))]'
                  )}
                >
                  {item.icon}
                </span>
              )}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
