/**
 * ClassworkFeed — Main container for the Classwork tab
 *
 * Fetches classwork items + topics from the API and renders them
 * grouped by topic. Supports create/edit via ClassworkDrawer.
 */

import { useState, useMemo, useCallback } from 'react'
import { FileText, AlertCircle, RefreshCw } from 'lucide-react'
import {
  useClassworkItems,
  useCreateClassworkTopic,
} from '../../../hooks/useClasswork'
import { useActiveSchoolId } from '../../../stores/app.store'
import { ClassworkCreateMenu } from './ClassworkCreateMenu'
import { ClassworkDrawer } from './ClassworkDrawer'
import { TopicSection } from './TopicSection'
import type { ClassworkItemResponseDto, ClassworkItemType } from '@aibrains/shared-types'

interface ClassworkFeedProps {
  sectionId: string
}

export function ClassworkFeed({ sectionId }: ClassworkFeedProps) {
  const schoolId = useActiveSchoolId() || ''
  const { data: classwork, isLoading, isError, refetch } = useClassworkItems(sectionId, schoolId)

  const items = classwork?.items ?? []
  const topics = classwork?.topics ?? []

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editItem, setEditItem] = useState<ClassworkItemResponseDto | null>(null)
  const [defaultType, setDefaultType] = useState<ClassworkItemType>('assignment')

  // Mutations
  const createTopicMutation = useCreateClassworkTopic(sectionId)

  const handleCreateTopic = useCallback(
    (name: string) => {
      createTopicMutation.mutate({ sectionId, schoolId, name })
    },
    [sectionId, schoolId, createTopicMutation]
  )

  const handleOpenCreate = useCallback((type: ClassworkItemType) => {
    setEditItem(null)
    setDefaultType(type)
    setDrawerOpen(true)
  }, [])

  const handleOpenEdit = useCallback((item: ClassworkItemResponseDto) => {
    setEditItem(item)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
    setEditItem(null)
  }, [])

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

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto" role="status" aria-label="Loading classwork">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-secondary animate-pulse" />
        ))}
        <span className="sr-only">Loading classwork items...</span>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)] rounded-xl border border-[rgb(var(--state-danger-border))] dark:border-[rgb(var(--state-danger-border))]/20 p-8 text-center">
          <AlertCircle className="w-10 h-10 mx-auto text-[rgb(var(--state-danger-fg))] mb-3" />
          <h4 className="text-sm font-medium text-[rgb(var(--state-danger-fg))]  mb-1">
            Failed to load classwork
          </h4>
          <p className="text-xs text-[rgb(var(--state-danger-fg))]/70 /70 mb-4">
            There was an error fetching classwork data. Please try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            aria-label="Retry loading classwork"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--state-danger-fg))]  bg-[rgb(var(--state-danger-bg)/0.18)] dark:bg-[rgb(var(--state-danger-bg)/0.18)]0/20 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.28)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">All Classwork</h2>
        <ClassworkCreateMenu
          onCreateTopic={handleCreateTopic}
          onCreateAssignment={() => handleOpenCreate('assignment')}
          onCreateQuiz={() => handleOpenCreate('quiz')}
          onCreateMaterial={() => handleOpenCreate('material')}
          onCreateQuestion={() => handleOpenCreate('question')}
        />
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
              onItemClick={handleOpenEdit}
            />
          )
        })}

      {/* Ungrouped items */}
      {groupedItems.ungrouped.length > 0 && (
        <TopicSection
          name="Other"
          items={groupedItems.ungrouped}
          onItemClick={handleOpenEdit}
        />
      )}

      {/* Empty state — no items at all, or topics exist but none have items */}
      {items.length === 0 && (
        <div className="bg-surface-secondary rounded-xl border border-border-secondary p-12 text-center" role="status">
          <FileText className="w-12 h-12 mx-auto text-text-tertiary mb-4" aria-hidden="true" />
          <h4 className="text-lg font-medium text-text-primary mb-2">No classwork yet</h4>
          <p className="text-text-secondary max-w-md mx-auto">
            {topics.length > 0
              ? 'You have topics set up but no classwork items yet. Create assignments, quizzes, or materials to get started.'
              : 'Create assignments, quizzes, and materials for your class.'}
          </p>
        </div>
      )}

      {/* Create/Edit Drawer */}
      <ClassworkDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        sectionId={sectionId}
        schoolId={schoolId}
        editItem={editItem}
        defaultType={defaultType}
        topics={topics}
      />
    </div>
  )
}
