/**
 * DrawerFooterCTA Component
 *
 * Shared footer CTA for entity drawers (Course, Section, Student).
 * Provides a consistent "View Details" navigation button pinned
 * at the bottom of slide-over drawers.
 */

import { ArrowRight } from 'lucide-react'

interface DrawerFooterCTAProps {
  /** Button label text (e.g., "View Details") */
  label: string
  /** Click handler — should navigate to the detail page */
  onClick: () => void
  /** Entity name for accessible aria-label (e.g., "AP Calculus AB") */
  entityName: string
}

export function DrawerFooterCTA({ label, onClick, entityName }: DrawerFooterCTAProps) {
  return (
    <div className="shrink-0 px-6 py-4 border-t border-border-secondary bg-surface-secondary/30">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} for ${entityName}`}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] text-[rgb(var(--action-primary-fg))] rounded-xl font-medium text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus))]/50"
      >
        {label}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  )
}
