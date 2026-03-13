/**
 * StreamFeed — Main container for the Stream tab
 *
 * Currently annotated as "Coming Soon" for the initial production release.
 * Quick action buttons remain functional for navigation to other tabs.
 */

import { ClipboardCheck, BookCheck, Users } from 'lucide-react'
import { ComingSoonBanner } from '@edforge/ui'

interface StreamFeedProps {
  sectionId: string
  onSwitchTab?: (tab: string) => void
}

export function StreamFeed({ sectionId, onSwitchTab }: StreamFeedProps) {
  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Quick Actions — still functional for navigation */}
      {onSwitchTab && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSwitchTab('progress:attendance')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Take Attendance
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('progress:gradebook')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <BookCheck className="w-3.5 h-3.5" />
            Open Gradebook
          </button>
          <button
            type="button"
            onClick={() => onSwitchTab('classwork')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
          >
            <BookCheck className="w-3.5 h-3.5" />
            Classwork
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

      {/* Stream Coming Soon */}
      <ComingSoonBanner
        variant="communication"
        title="Class Stream"
        description="Post announcements, share materials, and engage with your class — all in one feed."
        features={[
          'Announcements and class updates',
          'Share materials and resources',
          'Comments and class discussions',
        ]}
      />
    </div>
  )
}
