/**
 * ClassworkCreateMenu — "+ Create" dropdown for classwork items
 */

import { useState } from 'react'
import { Plus, ClipboardList, HelpCircle, MessageCircle, FileText, FolderPlus } from 'lucide-react'

interface ClassworkCreateMenuProps {
  onCreateAssignment?: () => void
  onCreateQuiz?: () => void
  onCreateMaterial?: () => void
  onCreateQuestion?: () => void
  onCreateTopic: (name: string) => void
}

export function ClassworkCreateMenu({
  onCreateAssignment,
  onCreateQuiz,
  onCreateMaterial,
  onCreateQuestion,
  onCreateTopic,
}: ClassworkCreateMenuProps) {
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
        aria-haspopup="menu"
        aria-label="Create classwork"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        Create
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setShowTopicInput(false) }} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-surface-primary border border-border-primary shadow-lg py-1.5" role="menu" aria-label="Create classwork options">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onCreateAssignment?.()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-blue-500" aria-hidden="true" />
              Assignment
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onCreateQuiz?.()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
              Quiz Assignment
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onCreateQuestion?.()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              Question
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onCreateMaterial?.()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <FileText className="w-4 h-4 text-purple-500" aria-hidden="true" />
              Material
            </button>
            <div className="border-t border-border-secondary my-1" role="separator" />
            {showTopicInput ? (
              <div className="px-4 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTopicSubmit() }}
                  placeholder="Topic name..."
                  aria-label="New topic name"
                  className="flex-1 px-2 py-1 text-sm bg-surface-secondary border border-border-primary rounded text-text-primary outline-none focus:ring-1 focus:ring-teal-500/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleTopicSubmit}
                  disabled={!topicName.trim()}
                  aria-label="Add topic"
                  className="text-xs font-medium text-teal-500 hover:text-teal-600 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setShowTopicInput(true)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-teal-500" aria-hidden="true" />
                Topic
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
