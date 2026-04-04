/**
 * QuickDrawer — Content-pane-scoped slide-over panel
 *
 * Unlike the standard Drawer (which uses position: fixed and overlaps the
 * shell topbar/sidebar), QuickDrawer uses position: absolute to render
 * within a content pane. The parent container MUST have
 * `position: relative; overflow: hidden`.
 *
 * Features:
 * - Scoped to content pane (never overlaps shell chrome)
 * - Framer Motion slide animation with spring physics
 * - Click-outside overlay to close
 * - Escape key handler (defers to nested dropdowns via stopPropagation)
 * - Focus trap with focus restoration on close
 * - Responsive: side drawer (≥769px) / bottom sheet (≤768px)
 * - Bottom sheet: drag-to-dismiss gesture
 * - prefers-reduced-motion support
 * - Composable sub-components: Header, Body, Footer
 *
 * @example
 * ```tsx
 * <div className="relative overflow-hidden flex-1">
 *   <PageContent />
 *   <QuickDrawer isOpen={open} onClose={close} ariaLabelledBy="drawer-title">
 *     <QuickDrawer.Header>
 *       <h2 id="drawer-title">Student Profile</h2>
 *       <button onClick={close}><X /></button>
 *     </QuickDrawer.Header>
 *     <QuickDrawer.Body>
 *       {content}
 *     </QuickDrawer.Body>
 *     <QuickDrawer.Footer>
 *       <button>View Full Profile</button>
 *     </QuickDrawer.Footer>
 *   </QuickDrawer>
 * </div>
 * ```
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
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '../utils'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { useFocusTrap } from '../hooks/useFocusTrap'

// ============================================================================
// CONTEXT — allows sub-components to read drawer state
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
  /** Whether the drawer is visible */
  isOpen: boolean
  /** Called when the drawer should close (Escape, overlay click, etc.) */
  onClose: () => void
  /** Drawer width in px (side mode only) — default 360 */
  width?: number
  /** Height in bottom-sheet mode — default '70vh' */
  sheetHeight?: string
  /** ARIA labelledby id */
  ariaLabelledBy?: string
  /** Children — use QuickDrawer.Header, .Body, .Footer for structure */
  children: ReactNode
  /** Additional className for the drawer panel */
  className?: string
  /** Additional inline style for the drawer panel */
  style?: CSSProperties
}

interface QuickDrawerHeaderProps {
  children: ReactNode
  className?: string
}

interface QuickDrawerBodyProps {
  children: ReactNode
  className?: string
}

interface QuickDrawerFooterProps {
  children: ReactNode
  className?: string
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const SIDE_VARIANTS = {
  hidden: (width: number) => ({ x: width }),
  visible: {
    x: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
  },
  exit: (width: number) => ({
    x: width,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  }),
}

const SHEET_VARIANTS = {
  hidden: { y: '100%' },
  visible: {
    y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 38 },
  },
  exit: {
    y: '100%',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
}

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

// Instant variants for reduced motion
const INSTANT = { duration: 0 }
const SIDE_VARIANTS_REDUCED = {
  hidden: (width: number) => ({ x: width }),
  visible: { x: 0, transition: INSTANT },
  exit: (width: number) => ({ x: width, transition: INSTANT }),
}
const SHEET_VARIANTS_REDUCED = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: INSTANT },
  exit: { y: '100%', transition: INSTANT },
}
const OVERLAY_VARIANTS_REDUCED = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: INSTANT },
  exit: { opacity: 0, transition: INSTANT },
}

// ============================================================================
// DRAG-TO-DISMISS THRESHOLD
// ============================================================================

const DRAG_CLOSE_VELOCITY = 300
const DRAG_CLOSE_RATIO = 0.4

// ============================================================================
// QUICK DRAWER COMPONENT
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
  const prefersReduced = useReducedMotion()
  const mode: 'side' | 'sheet' = isMobile ? 'sheet' : 'side'

  // Focus trap
  useFocusTrap(panelRef, isOpen)

  // Escape key — close drawer (unless a nested dropdown handles it first)
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If a nested component (e.g., dropdown) already stopped propagation,
        // this handler won't fire. Only close the drawer if Escape reaches us.
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, handleEscape])

  // Pick animation variants
  const sideVars = prefersReduced ? SIDE_VARIANTS_REDUCED : SIDE_VARIANTS
  const sheetVars = prefersReduced ? SHEET_VARIANTS_REDUCED : SHEET_VARIANTS
  const overlayVars = prefersReduced ? OVERLAY_VARIANTS_REDUCED : OVERLAY_VARIANTS

  // Bottom-sheet drag handler
  const handleDragEnd = (_: unknown, info: { velocity: { y: number }; offset: { y: number } }) => {
    const containerHeight = panelRef.current?.offsetHeight ?? 0
    if (
      info.velocity.y > DRAG_CLOSE_VELOCITY ||
      info.offset.y > containerHeight * DRAG_CLOSE_RATIO
    ) {
      onClose()
    }
  }

  return (
    <QuickDrawerContext.Provider value={{ isOpen, width, mode }}>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay — covers the content pane, catches clicks to close */}
            <motion.div
              key="quick-drawer-overlay"
              className="absolute inset-0"
              style={{ zIndex: 19 }}
              variants={overlayVars}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={onClose}
              aria-hidden="true"
            >
              <div
                className="absolute inset-0"
                style={{ background: 'var(--v2-overlay-dim, rgba(0,0,0,0.2))' }}
              />
            </motion.div>

            {/* Drawer panel */}
            <motion.div
              key="quick-drawer-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={ariaLabelledBy}
              className={cn(
                'absolute flex flex-col',
                mode === 'side' && 'top-0 right-0 bottom-0',
                mode === 'sheet' && 'bottom-0 left-0 right-0',
                className
              )}
              style={{
                zIndex: 20,
                width: mode === 'side' ? width : undefined,
                height: mode === 'sheet' ? sheetHeight : undefined,
                maxHeight: mode === 'sheet' ? 'calc(100% - 48px)' : undefined,
                background: 'var(--v2-bg-surface, rgb(var(--surface-primary)))',
                borderLeft: mode === 'side' ? '1px solid var(--v2-border-default, rgb(var(--border-secondary)))' : 'none',
                borderTop: mode === 'sheet' ? '1px solid var(--v2-border-default, rgb(var(--border-secondary)))' : 'none',
                borderRadius: mode === 'sheet' ? '14px 14px 0 0' : undefined,
                boxShadow: mode === 'side'
                  ? '-12px 0 40px rgba(0,0,0,0.4)'
                  : '0 -12px 40px rgba(0,0,0,0.4)',
                ...style,
              }}
              variants={mode === 'side' ? sideVars : sheetVars}
              custom={width}
              initial="hidden"
              animate="visible"
              exit="exit"
              // Bottom sheet drag-to-dismiss
              {...(mode === 'sheet'
                ? {
                    drag: 'y' as const,
                    dragConstraints: { top: 0, bottom: 0 },
                    dragElastic: { top: 0, bottom: 0.3 },
                    onDragEnd: handleDragEnd,
                  }
                : {})}
            >
              {/* Drag handle for bottom sheet */}
              {mode === 'sheet' && (
                <div className="flex justify-center py-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
                  <div
                    className="w-8 h-1 rounded-full"
                    style={{ background: 'var(--v2-text-ghost, rgba(255,255,255,0.2))' }}
                  />
                </div>
              )}

              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
        // Custom thin scrollbar
        '[&::-webkit-scrollbar]:w-[3px]',
        '[&::-webkit-scrollbar-track]:bg-transparent',
        '[&::-webkit-scrollbar-thumb]:bg-[var(--v2-scrollbar-thumb,rgba(255,255,255,0.1))]',
        '[&::-webkit-scrollbar-thumb]:rounded-full',
        className
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
        background: 'var(--v2-bg-surface, rgb(var(--surface-primary)))',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================================
// HOOK — read drawer context from sub-components
// ============================================================================

export function useQuickDrawer() {
  return useContext(QuickDrawerContext)
}

// ============================================================================
// EXPORT — compound component pattern
// ============================================================================

export const QuickDrawer = Object.assign(QuickDrawerRoot, {
  Header,
  Body,
  Footer,
})

export type { QuickDrawerProps as QuickDrawerRootProps }
export type { QuickDrawerHeaderProps, QuickDrawerBodyProps, QuickDrawerFooterProps }
