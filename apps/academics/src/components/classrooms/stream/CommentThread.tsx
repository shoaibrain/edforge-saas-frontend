/**
 * CommentThread — Expandable comment list with input
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send } from 'lucide-react'
import type { StreamComment } from './types'
import { formatRelativeTime } from '../../../lib/relative-time'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

interface CommentThreadProps {
  comments: StreamComment[]
  isExpanded: boolean
  onAddComment: (content: string) => void
}

export function CommentThread({ comments, isExpanded, onAddComment }: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')

  const handleSubmit = () => {
    if (!newComment.trim()) return
    onAddComment(newComment)
    setNewComment('')
  }

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          aria-expanded="true"
        >
          <div className="border-t border-border-secondary">
            {/* Comment list */}
            {comments.length > 0 && (
              <div role="list" className="divide-y divide-border-secondary/50">
                {comments.map((comment) => (
                  <div key={comment.commentId} role="listitem" className="px-4 py-3 flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">
                      {getInitials(comment.authorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-text-primary">{comment.authorName}</span>
                        <span className="text-[10px] text-text-tertiary">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-text-secondary mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment input */}
            <div className="px-4 py-3 flex items-center gap-2 bg-surface-secondary/30">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-1.5 text-xs bg-surface-primary border border-border-primary rounded-full text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!newComment.trim()}
                className="p-1.5 rounded-full text-teal-500 hover:bg-teal-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Post comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
