/**
 * Modal Component
 * 
 * Accessible modal dialog using @headlessui/react.
 * Features:
 * - Focus trap (Tab stays inside modal)
 * - Escape key to close
 * - Click outside to close
 * - Animated backdrop and panel
 * - Multiple size variants
 */

import { Fragment, type ReactNode } from 'react'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { X } from 'lucide-react'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.50)] backdrop-blur-sm" 
            aria-hidden="true" 
          />
        </TransitionChild>

        {/* Full-screen container for centering */}
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={`
                w-full ${sizeClasses[size]}
                bg-surface-primary rounded-xl shadow-xl
                border border-border-secondary
                transform transition-all
              `}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-secondary">
                <div>
                  <DialogTitle className="text-lg font-semibold text-text-primary">
                    {title}
                  </DialogTitle>
                  {description && (
                    <p className="mt-1 text-sm text-text-secondary">
                      {description}
                    </p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="
                      p-1.5 rounded-lg text-text-tertiary
                      hover:text-text-primary hover:bg-surface-secondary
                      focus:outline-none focus:ring-2 focus:ring-accent-primary/20
                      transition-colors
                    "
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {children}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

/**
 * Modal Footer Component
 * 
 * Standard footer layout for modal actions (Cancel/Submit buttons).
 */
export interface ModalFooterProps {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary bg-surface-secondary/50 rounded-b-xl">
      {children}
    </div>
  )
}
