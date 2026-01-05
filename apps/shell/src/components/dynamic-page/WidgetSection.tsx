/**
 * WidgetSection
 * 
 * Wrapper component for individual widgets within a dynamic page.
 * Handles show/hide animations and provides consistent section headers.
 */

import { type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { useDynamicPage } from './DynamicPageContext'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WidgetSectionProps {
  /** Widget ID for visibility tracking */
  widgetId: string
  /** Optional section header label */
  label?: string
  /** Optional section header icon */
  icon?: LucideIcon
  /** Section header action buttons */
  headerActions?: ReactNode
  /** Widget content */
  children: ReactNode
  /** Custom className for the section */
  className?: string
  /** Delay for staggered animation */
  animationDelay?: number
  /** Whether to show the section header */
  showHeader?: boolean
  /** Whether to allow overflow (disable overflow-hidden) - useful for dropdowns */
  overflowVisible?: boolean
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const sectionVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    marginBottom: 0,
    transition: {
      duration: 0.25,
      ease: [0.4, 0, 0.2, 1] as const, // easeInOut
    },
  },
  visible: {
    opacity: 1,
    height: 'auto',
    marginBottom: 40,
    transition: {
      duration: 0.35,
      ease: [0, 0, 0.2, 1] as const, // easeOut
    },
  },
}

const contentVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay,
      duration: 0.35,
      ease: [0, 0, 0.2, 1] as const, // easeOut
    },
  }),
}

// ============================================================================
// WIDGET SECTION COMPONENT
// ============================================================================

export function WidgetSection({
  widgetId,
  label,
  icon: Icon,
  headerActions,
  children,
  className = '',
  animationDelay = 0,
  showHeader = true,
  overflowVisible = false,
}: WidgetSectionProps) {
  const { isWidgetVisible } = useDynamicPage()

  const visible = isWidgetVisible(widgetId)

  return (
    <AnimatePresence mode="sync">
      {visible && (
        <motion.section
          key={widgetId}
          variants={sectionVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={`${overflowVisible ? '' : 'overflow-hidden'} ${className}`}
        >
          <motion.div
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            custom={animationDelay}
          >
            {/* Section Header */}
            {showHeader && label && (
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  {Icon && (
                    <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  )}
                  <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                    {label}
                  </h2>
                </div>

                {/* Header Actions */}
                {headerActions && (
                  <div className="flex items-center gap-1">
                    {headerActions}
                  </div>
                )}
              </div>
            )}

            {/* Widget Content */}
            {children}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// SIMPLE WIDGET WRAPPER (No header)
// ============================================================================

interface SimpleWidgetProps {
  /** Widget ID for visibility tracking */
  widgetId: string
  /** Widget content */
  children: ReactNode
  /** Custom className */
  className?: string
  /** Animation delay */
  animationDelay?: number
}

export function SimpleWidget({
  widgetId,
  children,
  className = '',
  animationDelay = 0,
}: SimpleWidgetProps) {
  return (
    <WidgetSection
      widgetId={widgetId}
      showHeader={false}
      className={className}
      animationDelay={animationDelay}
    >
      {children}
    </WidgetSection>
  )
}

// ============================================================================
// HEADER ACTION BUTTON
// ============================================================================

interface HeaderActionButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

export function HeaderActionButton({
  icon: Icon,
  label,
  onClick,
  className = '',
}: HeaderActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        p-1.5 rounded-lg
        text-[rgb(var(--text-tertiary))]
        hover:text-[rgb(var(--text-secondary))]
        hover:bg-[rgb(var(--surface-tertiary))]
        transition-colors
        ${className}
      `}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
