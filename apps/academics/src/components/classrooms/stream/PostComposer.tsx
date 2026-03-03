/**
 * PostComposer — Google Classroom-style post creation
 */

import { useState } from 'react'
import { Send } from 'lucide-react'

interface PostComposerProps {
  onSubmit: (content: string, type: 'announcement' | 'post' | 'material') => void
  authorName?: string
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

export function PostComposer({ onSubmit, authorName = 'You' }: PostComposerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<'announcement' | 'post' | 'material'>('post')

  const handlePost = () => {
    if (!content.trim()) return
    onSubmit(content, postType)
    setContent('')
    setPostType('post')
    setIsExpanded(false)
  }

  const handleCancel = () => {
    if (content.trim()) {
      if (!window.confirm('Discard your post?')) return
    }
    setContent('')
    setPostType('post')
    setIsExpanded(false)
  }

  if (!isExpanded) {
    return (
      <div
        role="button"
        aria-expanded="false"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(true) }}
        className="flex items-center gap-3 p-4 bg-surface-primary rounded-xl border border-border-primary hover:border-border-secondary hover:shadow-sm transition-all cursor-pointer"
      >
        <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
          {getInitials(authorName)}
        </div>
        <span className="text-sm text-text-tertiary">Share something with your class...</span>
      </div>
    )
  }

  return (
    <div
      aria-expanded="true"
      className="bg-surface-primary rounded-xl border border-border-primary shadow-sm overflow-hidden"
    >
      {/* Type selector */}
      <div className="flex items-center gap-2 px-4 pt-4">
        {(['post', 'announcement', 'material'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setPostType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              postType === type
                ? 'bg-teal-500 text-white'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Text area */}
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with your class..."
          className="w-full min-h-[100px] bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none"
          autoFocus
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-secondary bg-surface-secondary/30">
        <button
          type="button"
          onClick={handleCancel}
          className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handlePost}
          disabled={!content.trim()}
          className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-teal-500 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="w-3.5 h-3.5" />
          Post
        </button>
      </div>
    </div>
  )
}
