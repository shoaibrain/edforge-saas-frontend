/**
 * QuickDrawer — Content-pane-scoped slide-over panel
 *
 * Uses position: absolute inside a content pane (parent MUST have
 * `position: relative; overflow: hidden`). Never overlaps shell chrome.
 *
 * Animation strategy: **always-mounted DOM elements with pure CSS
 * transitions on composite properties only** (transform, opacity).
 * This eliminates layout thrashing — the browser never recalculates
 * table/grid geometry during open/close. No Framer Motion
 * AnimatePresence, no DOM mount/unmount.
 *
 * Features:
 * - Zero layout-shift animation (transform + opacity only)
 * - Click-outside overlay to close
 * - Escape key handler
 * - Focus trap with restoration
 * - Responsive: side drawer (≥769px) / bottom sheet (≤768px)
 * - prefers-reduced-motion support
 * - Composable: Header, Body, Footer
 */

import {
  type ReactNode,
  type CSSProperties,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react'
import { cn } from '../utils'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFocusTrap } from '../hooks/useFocusTrap'

// ============================================================================
// CONTEXT
// ============================================================================

interface QuickDrawerContextValue {
  isOpen: boolean
  width: number
  mode: 'side' | 'sheet'
}

const QuickDrawerContext = createContext<QuickDrawerContextValue>({
  isOpen: false,
  width: 360,
  mode: 'side',
})

// ============================================================================
// TYPES
// ============================================================================

export interface QuickDrawerProps {
  isOpen: boolean
  onClose: () => void
  width?: number
  sheetHeight?: string
  ariaLabelledBy?: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

interface QuickDrawerHeaderProps { children: ReactNode; className?: string }
interface QuickDrawerBodyProps { children: ReactNode; className?: string }
interface QuickDrawerFooterProps { children: ReactNode; className?: string }

// ============================================================================
// REDUCED-MOTION HOOK (replaces framer-motion dependency)
// ============================================================================

function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

// ============================================================================
// COMPONENT
// ============================================================================

function QuickDrawerRoot({
  isOpen,
  onClose,
  width = 360,
  sheetHeight = '70vh',
  ariaLabelledBy,
  children,
  className,
  style,
}: QuickDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')
  const noMotion = usePrefersReducedMotion()
  const mode: 'side' | 'sheet' = isMobile ? 'sheet' : 'side'

  // Focus trap
  useFocusTrap(panelRef, isOpen)

  // Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleEscape])

  // ── Transform values ────────────────────────────────────────────
  const closedTransform = mode === 'side'
    ? `translateX(${width + 20}px)`
    : 'translateY(100%)'

  const panelTransition = noMotion
    ? 'none'
    : isOpen
      ? 'transform 280ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 280ms ease'
      : 'transform 200ms cubic-bezier(0.4, 0, 1, 1), box-shadow 200ms ease, visibility 0s linear 200ms'

  const overlayTransition = noMotion
    ? 'none'
    : isOpen
      ? 'opacity 200ms ease'
      : 'opacity 150ms ease, visibility 0s linear 150ms'

  return (
    <QuickDrawerContext.Provider value={{ isOpen, width, mode }}>
      {/* ── Overlay (always in DOM — opacity + pointer-events toggle) ── */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
        style={{
          zIndex: 19,
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: overlayTransition,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(0, 0, 0, 0.18)',
            backdropFilter: 'blur(0.3px)',
            WebkitBackdropFilter: 'blur(0.3px)',
          }}
        />
      </div>

      {/* ── Panel (always in DOM — transform toggle, zero layout cost) ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen}
        aria-labelledby={ariaLabelledBy}
        aria-hidden={!isOpen}
        className={cn(
          'absolute flex flex-col',
          mode === 'side' && 'top-0 right-0 bottom-0',
          mode === 'sheet' && 'bottom-0 left-0 right-0',
          className,
        )}
        style={{
          zIndex: 20,
          width: mode === 'side' ? width : undefined,
          height: mode === 'sheet' ? sheetHeight : undefined,
          maxHeight: mode === 'sheet' ? 'calc(100% - 48px)' : undefined,
          transform: isOpen ? 'translateX(0) translateY(0)' : closedTransform,
          willChange: 'transform',
          visibility: isOpen ? 'visible' : 'hidden',
          transition: panelTransition,
          background: 'var(--v2-bg-surface, rgb(var(--background-primary)))',
          borderLeft: mode === 'side' ? '1px solid var(--v2-border-default, rgb(var(--border-secondary)))' : 'none',
          borderTop: mode === 'sheet' ? '1px solid var(--v2-border-default, rgb(var(--border-secondary)))' : 'none',
          borderRadius: mode === 'sheet' ? '14px 14px 0 0' : undefined,
          boxShadow: isOpen
            ? (mode === 'side' ? '-14px 0 44px rgba(0,0,0,0.5)' : '0 -12px 40px rgba(0,0,0,0.4)')
            : 'none',
          ...style,
        }}
      >
        {/* Drag handle for bottom sheet */}
        {mode === 'sheet' && (
          <div className="flex justify-center py-2 flex-shrink-0">
            <div
              className="w-8 h-1 rounded-full"
              style={{ background: 'var(--v2-text-ghost, rgba(255,255,255,0.2))' }}
            />
          </div>
        )}

        {children}
      </div>
    </QuickDrawerContext.Provider>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function Header({ children, className }: QuickDrawerHeaderProps) {
  return (
    <div
      className={cn('flex-shrink-0', className)}
      style={{ borderBottom: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))' }}
    >
      {children}
    </div>
  )
}

function Body({ children, className }: QuickDrawerBodyProps) {
  return (
    <div
      className={cn(
        'flex-1 overflow-y-auto',
        '[&::-webkit-scrollbar]:w-1',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-[var(--v2-scrollbar-thumb,rgba(255,255,255,0.1))]',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        className,
      )}
    >
      {children}
    </div>
  )
}

function Footer({ children, className }: QuickDrawerFooterProps) {
  return (
    <div
      className={cn('flex-shrink-0', className)}
      style={{
        borderTop: '1px solid var(--v2-border-default, rgba(255,255,255,0.07))',
        background: 'var(--v2-bg-surface, rgb(var(--background-primary)))',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useQuickDrawer() {
  return useContext(QuickDrawerContext)
}

// ============================================================================
// EXPORT
// ============================================================================

export const QuickDrawer = Object.assign(QuickDrawerRoot, {
  Header,
  Body,
  Footer,
})

export type { QuickDrawerProps as QuickDrawerRootProps }
export type { QuickDrawerHeaderProps, QuickDrawerBodyProps, QuickDrawerFooterProps }
