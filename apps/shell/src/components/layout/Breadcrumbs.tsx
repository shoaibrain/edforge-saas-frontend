/**
 * Breadcrumbs Component
 *
 * Desktop renderer of the breadcrumb trail (hooks/useBreadcrumbTrail.ts —
 * shared with the phone app bar's subpage title).
 *
 * Features:
 * - Clickable navigation links (except current page)
 * - Responsive design with truncation for long paths
 * - Smooth animations on route changes
 * - Accessible with proper ARIA attributes
 * - i18n localized via @edforge/i18n nav namespace
 */

import { Link } from '@tanstack/react-router'
import { ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBreadcrumbTrail } from '../../hooks/useBreadcrumbTrail'
import { cn } from '../../lib/utils'

export function Breadcrumbs() {
  const breadcrumbs = useBreadcrumbTrail()

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="flex items-center gap-1.5 text-sm"
    >
      <ol className="flex items-center gap-1.5 list-none m-0 p-0">
        <AnimatePresence mode="popLayout">
          {breadcrumbs.map((crumb, index) => (
            <motion.li
              key={crumb.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, delay: index * 0.03 }}
              className="flex items-center gap-1.5"
            >
              {/* Separator (except for first item) */}
              {index > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))] flex-shrink-0"
                  aria-hidden="true"
                />
              )}

              {/* Breadcrumb item */}
              {crumb.isCurrentPage || crumb.isNonNavigable ? (
                <span
                  className={cn(
                    crumb.isCurrentPage
                      ? 'font-medium text-[rgb(var(--text-primary))]'
                      : 'text-[rgb(var(--text-tertiary))]',
                    'max-w-52 truncate',
                    crumb.isDynamic && 'italic'
                  )}
                  aria-current={crumb.isCurrentPage ? 'page' : undefined}
                  title={crumb.label}
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className={cn(
                    'flex items-center gap-1.5',
                    'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]',
                    'transition-colors duration-150',
                    'max-w-36 truncate',
                    'hover:underline underline-offset-2',
                    'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.50)] focus:ring-offset-1 rounded-sm',
                    crumb.isDynamic && 'italic'
                  )}
                  title={crumb.label}
                >
                  <span className="truncate">{crumb.label}</span>
                </Link>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </nav>
  )
}
