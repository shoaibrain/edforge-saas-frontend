/**
 * Drawer Component
 *
 * Accessible slide-over panel built with @headlessui/react.
 * Slides in from the right side of the screen.
 *
 * Features:
 * - Focus trap (Tab stays inside drawer)
 * - Escape key to close
 * - Click outside to close (backdrop click)
 * - Animated slide-in from right with smooth transitions
 * - Multiple size variants (sm, md, lg, xl)
 * - Header with title + close button
 * - Scrollable body area
 * - Optional footer
 *
 * @example Basic usage
 * ```tsx
 * import { Drawer, DrawerFooter, Button } from '@edforge/ui'
 *
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false)
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Open</Button>
 *       <Drawer
 *         open={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         title="Edit Item"
 *       >
 *         <p>Drawer content...</p>
 *         <DrawerFooter>
 *           <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
 *           <Button onClick={handleSave}>Save</Button>
 *         </DrawerFooter>
 *       </Drawer>
 *     </>
 *   )
 * }
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

export interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean
  /** Callback when the drawer should close */
  onClose: () => void
  /** Drawer title displayed in the header */
  title: string
  /** Optional description below the title */
  description?: string
  /** Optional leading element (e.g. a tinted icon tile) rendered left of the title */
  icon?: ReactNode
  /** Drawer content */
  children: ReactNode
  /**
   * Size variant for the drawer width
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Whether to show the close button in the header
   * @default true
   */
  showCloseButton?: boolean
  /**
   * Pinned footer rendered below the scrollable body (unlike DrawerFooter,
   * which scrolls with the content).
   */
  footer?: ReactNode
  /**
   * Suppress every close path (Esc, backdrop, X button) — for the brief
   * window where closing would abandon an in-flight submission.
   * @default false
   */
  closeDisabled?: boolean
  /** Additional className for the drawer panel */
  className?: string
}

export interface DrawerFooterProps {
  children: ReactNode
  className?: string
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses: Record<NonNullable<DrawerProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

// ============================================================================
// DRAWER COMPONENT
// ============================================================================

export function Drawer({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
  closeDisabled = false,
  className,
}: DrawerProps) {
  const handleClose = closeDisabled ? () => undefined : onClose
  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={handleClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-enter duration-slow"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-exit duration-base"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-[rgb(var(--background-overlay)/0.40)] backdrop-blur-sm"
            aria-hidden="true"
          />
        </TransitionChild>

        {/* Drawer container — anchored to the inline-end (right in LTR, left in RTL) */}
        <div className="fixed inset-0 flex justify-end">
          <TransitionChild
            as={Fragment}
            enter="ease-enter duration-slow"
            enterFrom="translate-x-full rtl:-translate-x-full"
            enterTo="translate-x-0"
            leave="ease-exit duration-base"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full rtl:-translate-x-full"
          >
            <DialogPanel
              className={cn(
                'w-full',
                sizeClasses[size],
                'h-full flex flex-col',
                'bg-surface-primary shadow-modal',
                'border-s border-[rgb(var(--border-secondary)/0.5)]',
                'transform transition-all',
                className
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-[rgb(var(--border-secondary)/0.4)] flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0 pe-4">
                  {icon && <div className="flex-shrink-0">{icon}</div>}
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-semibold text-text-primary truncate">
                      {title}
                    </DialogTitle>
                    {description && (
                      <p className="mt-1 text-sm text-text-secondary">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={closeDisabled}
                    className={cn(
                      'p-1.5 rounded-lg text-text-tertiary flex-shrink-0',
                      'hover:text-text-primary hover:bg-surface-secondary',
                      'disabled:opacity-50 disabled:pointer-events-none',
                      focusRingInset,
                      'transition-colors'
                    )}
                    aria-label="Close drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {children}
              </div>

              {/* Pinned footer */}
              {footer && (
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[rgb(var(--border-secondary)/0.4)] bg-surface-secondary/50 flex-shrink-0">
                  {footer}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

// ============================================================================
// DRAWER FOOTER COMPONENT
// ============================================================================

export function DrawerFooter({ children, className }: DrawerFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3',
        'px-6 py-4 -mx-6 -mb-5 mt-4',
        'border-t border-[rgb(var(--border-secondary)/0.4)]',
        'bg-surface-secondary/50',
        className
      )}
    >
      {children}
    </div>
  )
}
