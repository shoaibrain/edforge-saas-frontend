/**
 * BaseModal Component
 * 
 * Enterprise-grade modal foundation with:
 * - Framer Motion animations
 * - Focus trapping
 * - Keyboard navigation (Escape to close)
 * - Backdrop click handling
 * - Accessibility features (ARIA attributes)
 * - Multiple size variants
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface BaseModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Called when the modal should close */
  onClose: () => void
  /** Modal title for accessibility */
  title?: string
  /** Modal size variant */
  size?: ModalSize
  /** Whether to show the close button */
  showCloseButton?: boolean
  /** Whether clicking the backdrop closes the modal */
  closeOnBackdropClick?: boolean
  /** Whether pressing Escape closes the modal */
  closeOnEscape?: boolean
  /** Additional class name for the modal panel */
  className?: string
  /** Additional class name for the backdrop */
  backdropClassName?: string
  /** Modal content */
  children: React.ReactNode
  /** Initial focus element ref */
  initialFocusRef?: React.RefObject<HTMLElement>
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
}

// ============================================================================
// FOCUS TRAP HOOK
// ============================================================================

function useFocusTrap(
  isActive: boolean,
  containerRef: React.RefObject<HTMLDivElement | null>,
  initialFocusRef?: React.RefObject<HTMLElement | null>
) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus initial element or first focusable
    const elementToFocus = initialFocusRef?.current || firstElement
    if (elementToFocus) {
      // Delay to allow animation to start
      setTimeout(() => elementToFocus.focus(), 50)
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey)
    return () => container.removeEventListener('keydown', handleTabKey)
  }, [isActive, containerRef, initialFocusRef])
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BaseModal({
  open,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className,
  backdropClassName,
  children,
  initialFocusRef,
}: BaseModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<Element | null>(null)

  // Store the previously focused element
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement
    } else {
      // Restore focus when closing
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus()
      }
    }
  }, [open])

  // Focus trap
  useFocusTrap(open, containerRef, initialFocusRef)

  // Escape key handler
  useEffect(() => {
    if (!open || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeOnEscape, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [open])

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnBackdropClick && e.target === e.currentTarget) {
        onClose()
      }
    },
    [closeOnBackdropClick, onClose]
  )

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'fixed inset-0 bg-ink-900/60 dark:bg-ink-950/80 backdrop-blur-sm',
              backdropClassName
            )}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div
            className="fixed inset-0 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
          >
            {/* Modal Panel */}
            <motion.div
              ref={containerRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className={cn(
                'relative w-full rounded-2xl',
                'bg-[rgb(var(--background-primary))]',
                'border border-[rgb(var(--border-primary))]',
                'shadow-2xl shadow-ink-900/20 dark:shadow-black/40',
                sizeClasses[size],
                className
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    'absolute top-4 right-4 z-10',
                    'p-2 rounded-xl',
                    'text-[rgb(var(--text-tertiary))]',
                    'hover:text-[rgb(var(--text-primary))]',
                    'hover:bg-[rgb(var(--background-tertiary))]',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/50',
                    'transition-all duration-200'
                  )}
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}

              {/* Content */}
              {children}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal to body
  return createPortal(modalContent, document.body)
}

// ============================================================================
// MODAL HEADER COMPONENT
// ============================================================================

export interface ModalHeaderProps {
  /** Modal title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Optional icon component */
  icon?: React.ReactNode
  /** Additional class name */
  className?: string
}

export function ModalHeader({ title, subtitle, icon, className }: ModalHeaderProps) {
  return (
    <div className={cn('px-6 pt-6 pb-4', className)}>
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--state-info-bg)/0.18)] to-[rgb(var(--state-info-bg)/0.10)] flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0 pr-8">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-[rgb(var(--text-primary))] tracking-tight"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-[rgb(var(--text-tertiary))]">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MODAL BODY COMPONENT
// ============================================================================

export interface ModalBodyProps {
  children: React.ReactNode
  className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  )
}

// ============================================================================
// MODAL FOOTER COMPONENT
// ============================================================================

export interface ModalFooterProps {
  children: React.ReactNode
  className?: string
  /** Align buttons to the right (default), left, or center */
  align?: 'left' | 'center' | 'right'
}

export function ModalFooter({ children, className, align = 'right' }: ModalFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div
      className={cn(
        'px-6 py-4',
        'border-t border-[rgb(var(--border-secondary))]',
        'bg-[rgb(var(--background-secondary))]',
        'rounded-b-2xl',
        'flex items-center gap-3',
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================================================
// MODAL DIVIDER COMPONENT
// ============================================================================

export function ModalDivider({ className }: { className?: string }) {
  return (
    <div className={cn('border-t border-[rgb(var(--border-secondary))]', className)} />
  )
}
