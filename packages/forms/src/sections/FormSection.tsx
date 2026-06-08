/**
 * FormSection Component
 * 
 * A wrapper component for form sections that provides consistent
 * styling, headers, and animation.
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '../utils'

export interface FormSectionProps {
  /** Section title */
  title?: string
  /** Section icon */
  icon?: LucideIcon
  /** Section description */
  description?: string
  /** Section content */
  children: ReactNode
  /** Additional class name */
  className?: string
  /** Whether to show a card-style container */
  variant?: 'card' | 'flat'
  /** Section ID for scroll-spy anchoring */
  id?: string
  /** Whether to animate on mount */
  animate?: boolean
}

export function FormSection({
  title,
  icon: Icon,
  description,
  children,
  className,
  variant = 'card',
  id,
  animate = true,
}: FormSectionProps) {
  const hasHeader = title || description

  const content = (
    <>
      {/* Section Header */}
      {hasHeader && (
        <div className="flex items-start gap-3 mb-6">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-teal-500/10 dark:bg-cyan-500/15">
              <Icon className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            </div>
          )}
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section Content */}
      {children}
    </>
  )

  const containerProps = {
    id,
    className: cn(
      variant === 'card' && [
        'p-6 rounded-2xl',
        'bg-[rgb(var(--background-secondary))]',
        'border border-[rgb(var(--border-primary))]',
      ],
      'scroll-mt-24',
      className
    ),
  }

  if (animate) {
    return (
      <motion.section
        {...containerProps}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.section>
    )
  }

  return <section {...containerProps}>{content}</section>
}

