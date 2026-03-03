/**
 * ClassworkCreateMenu — "+ Create" dropdown for classwork items
 */

import { useState } from 'react'
import { Plus, ClipboardList, HelpCircle, MessageCircle, FileText, FolderPlus } from 'lucide-react'
import { toast } from 'sonner'

interface ClassworkCreateMenuProps {
  onCreateAssignment?: () => void
  onCreateTopic: (name: string) => void
}

export function ClassworkCreateMenu({ onCreateAssignment, onCreateTopic }: ClassworkCreateMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showTopicInput, setShowTopicInput] = useState(false)
  const [topicName, setTopicName] = useState('')

  const handleTopicSubmit = () => {
    if (!topicName.trim()) return
    onCreateTopic(topicName.trim())
    setTopicName('')
    setShowTopicInput(false)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors shadow-sm"
        aria-expanded={isOpen}
      >
        <Plus className="w-4 h-4" />
        Create
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setShowTopicInput(false) }} />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-surface-primary border border-border-primary shadow-lg py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                if (onCreateAssignment) onCreateAssignment()
                else toast.info('Assignment editor coming soon')
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-blue-500" />
              Assignment
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); toast.info('Quiz assignments coming soon') }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
              disabled
            >
              <HelpCircle className="w-4 h-4" />
              Quiz Assignment
              <span className="ml-auto text-[10px]">(Coming Soon)</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); toast.info('Questions coming soon') }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
              disabled
            >
              <MessageCircle className="w-4 h-4" />
              Question
              <span className="ml-auto text-[10px]">(Coming Soon)</span>
            </button>
            <button
              type="button"
              onClick={() => { setIsOpen(false); toast.info('Materials coming soon') }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-tertiary cursor-not-allowed"
              disabled
            >
              <FileText className="w-4 h-4" />
              Material
              <span className="ml-auto text-[10px]">(Coming Soon)</span>
            </button>
            <div className="border-t border-border-secondary my-1" />
            {showTopicInput ? (
              <div className="px-4 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTopicSubmit() }}
                  placeholder="Topic name..."
                  className="flex-1 px-2 py-1 text-sm bg-surface-secondary border border-border-primary rounded text-text-primary outline-none focus:ring-1 focus:ring-teal-500/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleTopicSubmit}
                  disabled={!topicName.trim()}
                  className="text-xs font-medium text-teal-500 hover:text-teal-600 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowTopicInput(true)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-teal-500" />
                Topic
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
