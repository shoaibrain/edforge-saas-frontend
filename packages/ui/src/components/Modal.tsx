/**
 * Modal Component
 *
 * Accessible modal dialog built with @headlessui/react.
 *
 * Features:
 * - Focus trap (Tab stays inside modal)
 * - Escape key to close
 * - Click outside to close (backdrop click)
 * - Animated backdrop and panel with smooth transitions
 * - Multiple size variants (sm, md, lg, xl, 2xl, full)
 * - Composable with ModalFooter for action buttons
 *
 * @example Basic usage
 * ```tsx
 * import { Modal, ModalFooter, Button } from '@edforge/ui'
 *
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false)
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
 *       <Modal
 *         open={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         title="Confirm Action"
 *         description="Are you sure you want to proceed?"
 *       >
 *         <p>Modal content goes here...</p>
 *         <ModalFooter>
 *           <Button variant="outline" onClick={() => setIsOpen(false)}>
 *             Cancel
 *           </Button>
 *           <Button onClick={handleConfirm}>Confirm</Button>
 *         </ModalFooter>
 *       </Modal>
 *     </>
 *   )
 * }
 * ```
 *
 * @example Without close button
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Processing..."
 *   showCloseButton={false}
 * >
 *   <Spinner />
 * </Modal>
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
import { X } from 'lucide-react'
import { cn, focusRingInset } from '../utils'

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when the modal should close (backdrop click, escape key, close button) */
  onClose: () => void
  /** Modal title displayed in the header */
  title: string
  /** Optional description displayed below the title */
  description?: string
  /** Modal content */
  children: ReactNode
  /**
   * Size variant for the modal width
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /**
   * Whether to show the close button in the header
   * @default true
   */
  showCloseButton?: boolean
  /** Additional className for the dialog panel */
  className?: string
}

export interface ModalFooterProps {
  /** Footer content (typically buttons) */
  children: ReactNode
  /** Additional className for the footer */
  className?: string
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
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

        {/* Full-screen container for centering */}
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <TransitionChild
            as={Fragment}
            enter="ease-enter duration-base"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-exit duration-fast"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel
              className={cn(
                'w-full',
                sizeClasses[size],
                'bg-surface-primary rounded-xl shadow-modal',
                'border border-border-secondary',
                'transform transition-all',
                className
              )}
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
                    className={cn(
                      'p-1.5 rounded-lg text-text-tertiary',
                      'hover:text-text-primary hover:bg-surface-secondary',
                      focusRingInset,
                      'transition-colors'
                    )}
                    aria-label="Close modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="px-6 py-4">{children}</div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

// ============================================================================
// MODAL FOOTER COMPONENT
// ============================================================================

/**
 * Modal Footer Component
 *
 * Standard footer layout for modal actions (Cancel/Submit buttons).
 * Should be placed as the last child of Modal content.
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={handleClose} title="Confirm">
 *   <p>Are you sure?</p>
 *   <ModalFooter>
 *     <Button variant="outline" onClick={handleClose}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4 -mx-6 -mb-4 mt-4',
        'border-t border-border-secondary',
        'bg-surface-secondary/50 rounded-b-xl',
        className
      )}
    >
      {children}
    </div>
  )
}
