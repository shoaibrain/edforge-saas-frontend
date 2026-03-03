/**
 * Classwork Types
 */

export type ClassworkItemType = 'assignment' | 'quiz' | 'material' | 'question'

export interface ClassworkItem {
  itemId: string
  sectionId: string
  type: ClassworkItemType
  title: string
  description?: string
  topicId?: string
  topicName?: string
  dueDate?: string
  possiblePoints?: number
  status: 'draft' | 'published' | 'scheduled'
  createdAt: string
  updatedAt?: string
  attachments?: ClassworkAttachment[]
}

export interface ClassworkTopic {
  topicId: string
  sectionId: string
  name: string
  sortOrder: number
}

export interface ClassworkAttachment {
  attachmentId: string
  fileName: string
  fileType: string
  url?: string
}
