/**
 * Stream Types
 */

export interface StreamPost {
  postId: string
  sectionId: string
  authorId: string
  authorName: string
  authorRole: 'teacher' | 'student'
  type: 'announcement' | 'post' | 'material'
  content: string
  plainText: string
  attachments?: StreamAttachment[]
  commentCount: number
  comments: StreamComment[]
  createdAt: string
  updatedAt?: string
  isPinned?: boolean
}

export interface StreamComment {
  commentId: string
  postId: string
  authorId: string
  authorName: string
  authorRole: 'teacher' | 'student'
  content: string
  createdAt: string
}

export interface StreamAttachment {
  attachmentId: string
  fileName: string
  fileType: string
  fileSize: number
  url?: string
}
