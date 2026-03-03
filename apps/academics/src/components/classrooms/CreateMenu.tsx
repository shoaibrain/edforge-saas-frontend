/**
 * CreateMenu — Three-dot dropdown for classroom creation actions
 */

import { useState } from 'react'
import { MoreVertical, CalendarDays, FileText, Paperclip, Megaphone } from 'lucide-react'

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
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-surface-primary border border-border-primary shadow-lg py-1.5">
            <button
              type="button"
              onClick={() => { setIsOpen(false); onCreateSection() }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <CalendarDays className="w-4 h-4 text-teal-500" />
              New Classroom
            </button>
            <div className="border-t border-border-secondary my-1" />
            <button
              type="button"
              disabled
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
            >
              <FileText className="w-4 h-4" />
              Assignment
              <span className="ml-auto text-[10px] text-text-tertiary">(Coming Soon)</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
            >
              <Paperclip className="w-4 h-4" />
              Material
              <span className="ml-auto text-[10px] text-text-tertiary">(Coming Soon)</span>
            </button>
            <button
              type="button"
              disabled
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
            >
              <Megaphone className="w-4 h-4" />
              Announcement
              <span className="ml-auto text-[10px] text-text-tertiary">(Coming Soon)</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
