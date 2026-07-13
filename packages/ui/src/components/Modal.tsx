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
import { useIsPhone } from '../hooks/useBreakpoint'

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
  /**
   * Presentation override. By default the modal renders centered on
   * tablet/desktop and as a bottom sheet below 640px (the mobile-native
   * pattern; grab handle, top radius, internal scroll). Pass 'center' to
   * force the centered dialog at every breakpoint, or 'sheet' to force the
   * bottom sheet.
   */
  presentation?: 'center' | 'sheet'
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
  presentation,
  className,
}: ModalProps) {
  const isPhone = useIsPhone()
  const asSheet = presentation ? presentation === 'sheet' : isPhone

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

        {/* Container: centers the dialog, or hosts the bottom sheet */}
        <div
          className={
            asSheet
              ? 'fixed inset-0'
              : 'fixed inset-0 flex items-center justify-center p-4 overflow-y-auto'
          }
        >
          <TransitionChild
            as={Fragment}
            enter={asSheet ? 'ui-sheet-slide' : 'ease-enter duration-base'}
            enterFrom={asSheet ? 'ui-sheet-slide-hidden' : 'opacity-0 scale-95'}
            enterTo={asSheet ? 'ui-sheet-slide-shown' : 'opacity-100 scale-100'}
            leave={asSheet ? 'ui-sheet-slide' : 'ease-exit duration-fast'}
            leaveFrom={asSheet ? 'ui-sheet-slide-shown' : 'opacity-100 scale-100'}
            leaveTo={asSheet ? 'ui-sheet-slide-hidden' : 'opacity-0 scale-95'}
          >
            <DialogPanel
              data-presentation={asSheet ? 'sheet' : 'center'}
              className={cn(
                asSheet
                  ? 'ui-sheet w-full bg-surface-primary'
                  : [
                      'w-full',
                      sizeClasses[size],
                      'bg-surface-primary rounded-xl shadow-modal',
                      'border border-border-secondary',
                      'transform transition-all',
                    ],
                className
              )}
            >
              {asSheet && <div className="ui-sheet-handle" aria-hidden="true" />}

              {/* Header */}
              <div
                className={cn(
                  'flex items-start justify-between px-6 pb-4 border-b border-border-secondary',
                  asSheet ? 'pt-2 flex-shrink-0' : 'pt-6'
                )}
              >
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
              <div
                className={cn(
                  'px-6 py-4',
                  asSheet && 'flex-1 min-h-0 overflow-y-auto overscroll-contain'
                )}
              >
                {children}
              </div>
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
