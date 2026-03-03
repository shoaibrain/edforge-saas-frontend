/**
 * useClassworkItems — Mock data provider for Classwork tab
 */

import { useState, useCallback } from 'react'
import type { ClassworkItem, ClassworkTopic } from '../components/classrooms/classwork/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function generateMockData(sectionId: string) {
  const now = new Date()
  const topics: ClassworkTopic[] = [
    { topicId: 'topic-1', sectionId, name: 'Unit 1: Foundations', sortOrder: 1 },
    { topicId: 'topic-2', sectionId, name: 'Unit 2: Core Concepts', sortOrder: 2 },
  ]

  const items: ClassworkItem[] = [
    {
      itemId: generateId(), sectionId, type: 'assignment', title: 'Chapter 1 Reading Response',
      description: 'Write a 2-page response to the Chapter 1 reading.', topicId: 'topic-1', topicName: 'Unit 1: Foundations',
      dueDate: new Date(now.getTime() + 86400000 * 3).toISOString(), possiblePoints: 100,
      status: 'published', createdAt: new Date(now.getTime() - 86400000 * 5).toISOString(),
    },
    {
      itemId: generateId(), sectionId, type: 'material', title: 'Course Syllabus',
      description: 'Complete syllabus for the semester.', topicId: 'topic-1', topicName: 'Unit 1: Foundations',
      status: 'published', createdAt: new Date(now.getTime() - 86400000 * 10).toISOString(),
      attachments: [{ attachmentId: generateId(), fileName: 'Syllabus-2026.pdf', fileType: 'application/pdf' }],
    },
    {
      itemId: generateId(), sectionId, type: 'quiz', title: 'Unit 1 Quiz',
      description: 'Quiz covering chapters 1-3.', topicId: 'topic-1', topicName: 'Unit 1: Foundations',
      dueDate: new Date(now.getTime() + 86400000 * 7).toISOString(), possiblePoints: 50,
      status: 'draft', createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
    },
    {
      itemId: generateId(), sectionId, type: 'assignment', title: 'Lab Report #1',
      description: 'Complete the lab report using the provided template.', topicId: 'topic-2', topicName: 'Unit 2: Core Concepts',
      dueDate: new Date(now.getTime() + 86400000 * 5).toISOString(), possiblePoints: 150,
      status: 'published', createdAt: new Date(now.getTime() - 86400000 * 3).toISOString(),
    },
    {
      itemId: generateId(), sectionId, type: 'question', title: 'Discussion: Key Themes',
      description: 'What are the key themes of this unit?',
      status: 'published', createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
  ]

  return { topics, items }
}

export function useClassworkItems(sectionId: string) {
  const [data] = useState(() => generateMockData(sectionId))
  const [topics, setTopics] = useState<ClassworkTopic[]>(data.topics)
  const [items] = useState<ClassworkItem[]>(data.items)
  const [isLoading] = useState(false)

  const addTopic = useCallback((name: string) => {
    const newTopic: ClassworkTopic = {
      topicId: generateId(),
      sectionId,
      name,
      sortOrder: topics.length + 1,
    }
    setTopics((prev) => [...prev, newTopic])
  }, [sectionId, topics.length])

  return { items, topics, isLoading, addTopic }
}
