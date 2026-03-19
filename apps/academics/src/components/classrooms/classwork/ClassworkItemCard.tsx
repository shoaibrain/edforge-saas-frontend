/**
 * ClassworkItemCard — Card/row for a single classwork item
 */

import { ClipboardList, HelpCircle, FileText, MessageCircle, Paperclip, Calendar } from 'lucide-react'
import type { ClassworkItemResponseDto } from '@aibrains/shared-types'

const typeConfig = {
  assignment: { icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  quiz: { icon: HelpCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  material: { icon: FileText, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  question: { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
}

interface ClassworkItemCardProps {
  item: ClassworkItemResponseDto
  onClick?: (item: ClassworkItemResponseDto) => void
}

export function ClassworkItemCard({ item, onClick }: ClassworkItemCardProps) {
  const config = typeConfig[item.type]
  const TypeIcon = config.icon

  const dueLabel = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className="flex items-center gap-3 px-4 py-3 w-full text-left bg-surface-primary rounded-lg border border-border-primary hover:border-border-secondary hover:shadow-sm transition-all cursor-pointer"
      aria-label={`Open ${item.title}`}
    >
      <div className={`p-2 rounded-full ${config.bg} flex-shrink-0`} aria-hidden="true">
        <TypeIcon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text-primary truncate">{item.title}</h4>
        <div className="flex items-center gap-3 mt-0.5">
          {dueLabel && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              Due {dueLabel}
            </span>
          )}
          {item.possiblePoints != null && (
            <span className="text-xs text-text-tertiary">{item.possiblePoints} pts</span>
          )}
          {item.attachments && item.attachments.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-text-tertiary">
              <Paperclip className="w-3 h-3" aria-hidden="true" />
              <span className="sr-only">Attachments:</span>
              {item.attachments.length}
            </span>
          )}
        </div>
      </div>
      {item.status === 'draft' && (
        <span className="px-2 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 rounded-full">
          Draft
        </span>
      )}
    </button>
  )
}
