/**
 * CreateMenu — Three-dot dropdown for classroom creation actions
 */

import { useState } from 'react'
import { MoreVertical, CalendarDays } from 'lucide-react'

interface CreateMenuProps {
  onCreateSection: () => void
}

export function CreateMenu({ onCreateSection }: CreateMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Create menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-52 rounded-xl bg-surface-primary border border-border-primary shadow-lg py-1.5">
            <button
              type="button"
              onClick={() => { setIsOpen(false); onCreateSection() }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
              New Section
            </button>
          </div>
        </>
      )}
    </div>
  )
}
