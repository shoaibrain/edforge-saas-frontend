/**
 * MobileSheet — bottom sheet for chrome-launched overlays (account sheet,
 * school sheet, the tab bar's More sheet).
 *
 * Shell-local on purpose: packages/ui QuickDrawer is content-pane-scoped
 * (absolute inside #main-content, z-20 under the z-45 chrome) so it cannot
 * overlay the app bar / tab bar. When P2 adds a real sheet presentation mode
 * to packages/ui, this file is deleted and the import swapped — the props
 * mirror that future primitive.
 *
 * Headless Dialog gives the focus trap, Esc, scrim close, and focus
 * restoration; motion classes (shell-slide/shell-fade, index.css) respect
 * prefers-reduced-motion.
 */

import { Fragment, type ReactNode } from 'react'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'

export interface MobileSheetProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
}

export function MobileSheet({ open, onClose, ariaLabel, children }: MobileSheetProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} aria-label={ariaLabel} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="shell-fade"
          enterFrom="shell-fade-hidden"
          enterTo="shell-fade-shown"
          leave="shell-fade"
          leaveFrom="shell-fade-shown"
          leaveTo="shell-fade-hidden"
        >
          <div className="shell-scrim" aria-hidden="true" />
        </TransitionChild>

        <TransitionChild
          as={Fragment}
          enter="shell-slide"
          enterFrom="shell-slide-bottom-hidden"
          enterTo="shell-slide-shown"
          leave="shell-slide"
          leaveFrom="shell-slide-shown"
          leaveTo="shell-slide-bottom-hidden"
        >
          <DialogPanel className="shell-sheet">
            <div className="shell-sheet-handle" aria-hidden="true" />
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </DialogPanel>
        </TransitionChild>
      </Dialog>
    </Transition>
  )
}
