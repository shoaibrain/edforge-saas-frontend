/**
 * StreamPostCard — Renders a single stream post
 */

import { useState } from 'react'
import { MessageSquare, Megaphone, Paperclip, Pin, ChevronDown, ChevronUp } from 'lucide-react'
import type { StreamPost } from './types'
import { formatRelativeTime } from '../../../lib/relative-time'
import { CommentThread } from './CommentThread'

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const typeConfig = {
  announcement: { icon: Megaphone, label: 'Announcement', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  material: { icon: Paperclip, label: 'Material', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  post: { icon: MessageSquare, label: 'Post', color: 'text-blue-500', bg: 'bg-blue-500/10' },
}

interface StreamPostCardProps {
  post: StreamPost
  onAddComment: (postId: string, content: string) => void
}

export function StreamPostCard({ post, onAddComment }: StreamPostCardProps) {
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [isContentExpanded, setIsContentExpanded] = useState(false)

  const config = typeConfig[post.type]
  const TypeIcon = config.icon
  const isLong = post.content.length > 200

  return (
    <article
      className="bg-surface-primary rounded-xl border border-border-primary overflow-hidden"
      aria-label={`${post.type} by ${post.authorName}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full ${post.authorRole === 'teacher' ? 'bg-teal-500' : 'bg-blue-500'} flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
              {getInitials(post.authorName)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">{post.authorName}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  post.authorRole === 'teacher'
                    ? 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400'
                    : 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                }`}>
                  {post.authorRole === 'teacher' ? 'Teacher' : 'Student'}
                </span>
              </div>
              <span className="text-xs text-text-tertiary">{formatRelativeTime(post.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {post.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500" />}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${config.bg}`}>
              <TypeIcon className={`w-3 h-3 ${config.color}`} />
              <span className={`text-[10px] font-medium ${config.color}`}>{config.label}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-sm text-text-secondary leading-relaxed">
          {isLong && !isContentExpanded ? (
            <>
              {post.content.slice(0, 200)}...
              <button
                type="button"
                onClick={() => setIsContentExpanded(true)}
                className="ml-1 text-teal-500 hover:text-teal-600 text-xs font-medium"
              >
                Show more
              </button>
            </>
          ) : (
            <>
              {post.content}
              {isLong && (
                <button
                  type="button"
                  onClick={() => setIsContentExpanded(false)}
                  className="ml-1 text-teal-500 hover:text-teal-600 text-xs font-medium"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.attachments.map((att) => (
              <div
                key={att.attachmentId}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-secondary rounded-lg text-xs text-text-secondary"
              >
                <Paperclip className="w-3 h-3" />
                {att.fileName}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-border-secondary/50">
          <button
            type="button"
            onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
            className="flex items-center gap-1.5 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
            aria-expanded={isCommentsExpanded}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {post.commentCount} comment{post.commentCount === 1 ? '' : 's'}
            {isCommentsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Comment Thread */}
      <CommentThread
        comments={post.comments}
        isExpanded={isCommentsExpanded}
        onAddComment={(content) => onAddComment(post.postId, content)}
      />
    </article>
  )
}
