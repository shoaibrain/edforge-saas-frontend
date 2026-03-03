/**
 * ClassworkFeed — Main container for the Classwork tab
 */

import { useMemo } from 'react'
import { FileText } from 'lucide-react'
import { useClassworkItems } from '../../../hooks/useClassworkItems'
import { ClassworkCreateMenu } from './ClassworkCreateMenu'
import { TopicSection } from './TopicSection'

interface ClassworkFeedProps {
  sectionId: string
}

export function ClassworkFeed({ sectionId }: ClassworkFeedProps) {
  const { items, topics, isLoading, addTopic } = useClassworkItems(sectionId)

  // Group items by topic
  const groupedItems = useMemo(() => {
    const byTopic = new Map<string, typeof items>()
    const ungrouped: typeof items = []

    for (const item of items) {
      if (item.topicId) {
        const existing = byTopic.get(item.topicId) || []
        existing.push(item)
        byTopic.set(item.topicId, existing)
      } else {
        ungrouped.push(item)
      }
    }

    return { byTopic, ungrouped }
  }, [items])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">All Classwork</h2>
        <ClassworkCreateMenu onCreateTopic={addTopic} />
      </div>

      {/* Topics with items */}
      {topics
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((topic) => {
          const topicItems = groupedItems.byTopic.get(topic.topicId) || []
          if (topicItems.length === 0) return null
          return (
            <TopicSection
              key={topic.topicId}
              name={topic.name}
              items={topicItems}
            />
          )
        })}

      {/* Ungrouped items */}
      {groupedItems.ungrouped.length > 0 && (
        <TopicSection name="Other" items={groupedItems.ungrouped} />
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No classwork yet</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            Create assignments, quizzes, and materials for your class.
          </p>
        </div>
      )}
    </div>
  )
}
