import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from 'react'
import { cn, focusRingInset } from '../utils'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
))
TableBody.displayName = 'TableBody'

export const TableFooter = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))] font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, onClick, onKeyDown, tabIndex, ...props }, ref) => {
  const isInteractive = typeof onClick === 'function'

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !isInteractive) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.currentTarget.click()
    }
  }

  return (
    <tr
      ref={ref}
      className={cn(
        'border-b border-[rgb(var(--border-secondary))] transition-colors hover:bg-[rgb(var(--interactive-hover))] data-[state=selected]:bg-[rgb(var(--surface-tertiary))]',
        isInteractive && ['cursor-pointer', focusRingInset],
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
      {...props}
    />
  )
})
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      'h-11 px-4 text-left align-middle font-medium text-[rgb(var(--text-tertiary))] [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableHead.displayName = 'TableHead'

export const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      'p-4 align-middle text-[rgb(var(--text-primary))] [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

