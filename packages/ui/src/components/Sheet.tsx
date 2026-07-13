/**
 * Sheet Component
 *
 * Bottom sheet built with @headlessui/react — the phone-native presentation
 * for chrome overlays (account/school sheets, tab-bar More sheet) and any
 * surface that wants an explicit bottom sheet at every breakpoint.
 *
 * Modal and Drawer adopt this anatomy automatically below 640px via their
 * `presentation` behavior; use Sheet directly when the surface IS a sheet by
 * design rather than an adapted dialog.
 *
 * Features:
 * - Focus trap, Escape close, scrim close, focus restoration (Headless Dialog)
 * - Grab handle, top radius, max-height 88dvh with internal scroll
 * - Safe-area bottom padding; prefers-reduced-motion collapses the slide
 *
 * @example
 * ```tsx
 * <Sheet open={open} onClose={() => setOpen(false)} ariaLabel="Account">
 *   ...rows...
 * </Sheet>
 * ```
 */

import { Fragment, type ReactNode } from 'react'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { cn } from '../utils'

export interface SheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when the sheet should close (scrim tap, Escape) */
  onClose: () => void
  /** Accessible name when there is no visible title */
  ariaLabel?: string
  /** Optional visible header title */
  title?: string
  /** Sheet content (scrolls internally beyond 88dvh) */
  children: ReactNode
  /** Additional className for the sheet panel */
  className?: string
}

export function Sheet({
  open,
  onClose,
  ariaLabel,
  title,
  children,
  className,
}: SheetProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} aria-label={ariaLabel} className="relative z-50">
        {/* Scrim */}
        <TransitionChild
          as={Fragment}
          enter="ease-enter duration-base"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-exit duration-fast"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm"
            aria-hidden="true"
          />
        </TransitionChild>

        {/* Panel */}
        <TransitionChild
          as={Fragment}
          enter="ui-sheet-slide"
          enterFrom="ui-sheet-slide-hidden"
          enterTo="ui-sheet-slide-shown"
          leave="ui-sheet-slide"
          leaveFrom="ui-sheet-slide-shown"
          leaveTo="ui-sheet-slide-hidden"
        >
          <DialogPanel
            data-presentation="sheet"
            className={cn('ui-sheet bg-surface-primary', className)}
          >
            <div className="ui-sheet-handle" aria-hidden="true" />
            {title && (
              <div className="px-6 pt-2 pb-3 border-b border-[rgb(var(--border-secondary)/0.4)]">
                <DialogTitle className="text-base font-semibold text-text-primary">
                  {title}
                </DialogTitle>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
