/**
 * ClassworkCreateMenu — "+ Create" dropdown for classwork items
 */

import { useState } from 'react'
import { Plus, ClipboardList, HelpCircle, MessageCircle, FileText, FolderPlus } from 'lucide-react'
import { useAcademicsI18n } from '../../../lib/i18n'

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
  const { t } = useAcademicsI18n()
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
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-full hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors shadow-sm"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('classrooms.aria.createClasswork')}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        {t('classrooms.classwork.create')}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setIsOpen(false); setShowTopicInput(false) }} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl bg-surface-primary border border-border-primary shadow-lg py-1.5" role="menu" aria-label={t('classrooms.aria.createClassworkOptions')}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                onCreateAssignment?.()
              }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-[rgb(var(--state-info-fg))]" aria-hidden="true" />
              {t('classrooms.classwork.assignment')}
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
              {t('classrooms.classwork.quizAssignment')}
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
              <MessageCircle className="w-4 h-4 text-[rgb(var(--state-success-fg))]" aria-hidden="true" />
              {t('classrooms.classwork.question')}
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
              <FileText className="w-4 h-4 text-[rgb(var(--state-info-fg))]" aria-hidden="true" />
              {t('classrooms.classwork.material')}
            </button>
            <div className="border-t border-border-secondary my-1" role="separator" />
            {showTopicInput ? (
              <div className="px-4 py-2 flex items-center gap-2">
                <input
                  type="text"
                  value={topicName}
                  onChange={(e) => setTopicName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleTopicSubmit() }}
                  placeholder={t('classrooms.classwork.topicNamePlaceholder')}
                  aria-label={t('classrooms.aria.newTopicName')}
                  className="flex-1 px-2 py-1 text-sm bg-surface-secondary border border-border-primary rounded text-text-primary outline-none focus:ring-1 focus:ring-[rgb(var(--border-focus)/0.35)]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleTopicSubmit}
                  disabled={!topicName.trim()}
                  aria-label={t('classrooms.aria.addTopic')}
                  className="text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--action-secondary-fg))] disabled:opacity-40"
                >
                  {t('classrooms.classwork.add')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                role="menuitem"
                onClick={() => setShowTopicInput(true)}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" aria-hidden="true" />
                {t('classrooms.classwork.topic')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
