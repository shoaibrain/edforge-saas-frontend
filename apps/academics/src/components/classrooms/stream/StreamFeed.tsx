/**
 * StreamFeed — Main container for the Stream tab
 */

import { ClipboardCheck, BookCheck, Users, MessageSquare } from 'lucide-react'
import { useStreamPosts } from '../../../hooks/useStreamPosts'
import { PostComposer } from './PostComposer'
import { StreamPostCard } from './StreamPostCard'

interface StreamFeedProps {
  sectionId: string
  onSwitchTab?: (tab: string) => void
}

export function StreamFeed({ sectionId, onSwitchTab }: StreamFeedProps) {
  const { posts, createPost, addComment } = useStreamPosts(sectionId)

  const handleSubmit = (content: string, type: 'announcement' | 'post' | 'material') => {
    createPost(content, content, type)
  }

  // Sort: pinned first, then by date
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Composer */}
      <PostComposer onSubmit={handleSubmit} />

      {/* Quick Actions */}
      {onSwitchTab && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab('attendance')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Take Attendance
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('grades')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <BookCheck className="w-3.5 h-3.5" />
            Open Gradebook
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('people')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            View Roster
          </button>
        </div>
      )}

      {/* Feed */}
      {sortedPosts.length === 0 ? (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No posts yet</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Share something with your class to get the conversation started.
          </p>
        </div>
      ) : (
        sortedPosts.map((post) => (
          <StreamPostCard
            key={post.postId}
            post={post}
            onAddComment={addComment}
          />
        ))
      )}
    </div>
  )
}
