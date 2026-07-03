/**
 * FinanceDrawerShell — the finance drawer chrome from the detail/export
 * prototypes: tinted icon tile + title + subtitle header, scrollable body,
 * pinned footer. Built on @edforge/ui Drawer (headlessui Dialog), so focus
 * trap, Esc-to-close, backdrop click, and portal rendering come for free.
 *
 * Used by RecordPaymentDrawer and the bulk-PDF-export drawers. The older
 * bulk drawers (send receipts/reminders/statements, void, adjust balance)
 * keep their hand-rolled framer-motion shells — migrate them separately.
 */

import type { ReactNode } from 'react'
import { Drawer, cn } from '@edforge/ui'

export interface FinanceDrawerShellProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  /** Sized lucide element rendered inside the success-tinted header tile. */
  icon: ReactNode
  /** Spin an accent ring around the icon tile while a background job runs. */
  iconBusy?: boolean
  /** Pinned footer (action buttons). */
  footer?: ReactNode
  /** Block every close path during an in-flight kickoff. */
  closeDisabled?: boolean
  children: ReactNode
}

export function FinanceDrawerShell({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconBusy = false,
  footer,
  closeDisabled = false,
  children,
}: FinanceDrawerShellProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description={subtitle}
      size="lg"
      footer={footer}
      closeDisabled={closeDisabled}
      icon={
        <span
          className={cn(
            'relative grid h-10 w-10 place-items-center rounded-lg border',
            'bg-[rgb(var(--state-success-bg))] text-[rgb(var(--state-success-fg))] border-[rgb(var(--state-success-border)/0.4)]'
          )}
        >
          {icon}
          {iconBusy && (
            <span
              className="absolute inset-0.5 rounded-full border-2 border-[rgb(var(--state-success-border)/0.2)] border-t-[rgb(var(--state-success-border))] motion-safe:animate-spin motion-reduce:hidden"
              aria-hidden="true"
            />
          )}
        </span>
      }
    >
      {children}
    </Drawer>
  )
}
