/**
 * FormSection Component
 * 
 * A wrapper component for form sections that provides consistent
 * styling, headers, and animation.
 */

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

export interface FormSectionProps {
  title?: string
  icon?: LucideIcon
  description?: string
  children: ReactNode
  className?: string
  /** Whether to show a card-style container */
  variant?: 'card' | 'flat'
  /** Section ID for scroll-spy anchoring */
  id?: string
}

export function FormSection({
  title,
  icon: Icon,
  description,
  children,
  className,
  variant = 'card',
  id,
}: FormSectionProps) {
  const hasHeader = title || description

  const content = (
    <>
      {/* Section Header */}
      {hasHeader && (
        <div className="flex items-start gap-3 mb-6">
          {Icon && (
            <div className="p-2.5 rounded-xl bg-[rgb(var(--state-info-bg)/0.18)] ">
              <Icon className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
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

  if (variant === 'flat') {
    return (
      <motion.section
        id={id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn('scroll-mt-24', className)}
      >
        {content}
      </motion.section>
    )
  }

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'p-6 rounded-2xl',
        'bg-[rgb(var(--surface-secondary))]',
        'border border-[rgb(var(--border-primary))]',
        'scroll-mt-24',
        className
      )}
    >
      {content}
    </motion.section>
  )
}

