import { forwardRef, type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'

export const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={twMerge('w-full caption-bottom text-sm', className)}
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
  <thead ref={ref} className={twMerge('[&_tr]:border-b', className)} {...props} />
))
TableHeader.displayName = 'TableHeader'

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={twMerge('[&_tr:last-child]:border-0', className)}
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
    className={twMerge(
      'border-t bg-slate-50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
))
TableFooter.displayName = 'TableFooter'

export const TableRow = forwardRef<
  HTMLTableRowElement,
  HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={twMerge(
      'border-b border-slate-100 transition-colors hover:bg-slate-50/50 data-[state=selected]:bg-slate-100',
      className
    )}
    {...props}
  />
))
TableRow.displayName = 'TableRow'

export const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={twMerge(
      'h-11 px-4 text-left align-middle font-medium text-slate-500 [&:has([role=checkbox])]:pr-0',
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
    className={twMerge(
      'p-4 align-middle text-slate-700 [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
))
TableCell.displayName = 'TableCell'

