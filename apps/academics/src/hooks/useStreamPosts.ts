/**
 * useStreamPosts — Mock data provider for Stream tab
 *
 * Returns the same interface that a future React Query hook would have.
 * When backend APIs are ready, swap the implementation with zero component changes.
 */

import { useState, useCallback } from 'react'
import type { StreamPost, StreamComment } from '../components/classrooms/stream/types'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function generateMockPosts(sectionId: string): StreamPost[] {
  const now = new Date()
  return [
    {
      postId: generateId(),
      sectionId,
      authorId: 'teacher-1',
      authorName: 'Ms. Johnson',
      authorRole: 'teacher',
      type: 'announcement',
      content: 'Welcome to our class! Please review the syllabus and come prepared for our first discussion on Monday. Remember to bring your textbooks and notebooks.',
      plainText: 'Welcome to our class! Please review the syllabus and come prepared for our first discussion on Monday.',
      commentCount: 2,
      comments: [
        {
          commentId: generateId(),
          postId: '',
          authorId: 'student-1',
          authorName: 'Alex Rivera',
          authorRole: 'student',
          content: 'Looking forward to it!',
          createdAt: new Date(now.getTime() - 3600000 * 2).toISOString(),
        },
        {
          commentId: generateId(),
          postId: '',
          authorId: 'student-2',
          authorName: 'Sam Chen',
          authorRole: 'student',
          content: 'Will we need the lab manual too?',
          createdAt: new Date(now.getTime() - 3600000).toISOString(),
        },
      ],
      createdAt: new Date(now.getTime() - 86400000 * 2).toISOString(),
      isPinned: true,
    },
    {
      postId: generateId(),
      sectionId,
      authorId: 'teacher-1',
      authorName: 'Ms. Johnson',
      authorRole: 'teacher',
      type: 'material',
      content: 'I\'ve uploaded the study guide for Chapter 3. Make sure to review sections 3.1 through 3.4 before our next class. Pay special attention to the key vocabulary terms.',
      plainText: 'Study guide for Chapter 3 uploaded. Review sections 3.1 through 3.4.',
      attachments: [
        { attachmentId: generateId(), fileName: 'Chapter3-StudyGuide.pdf', fileType: 'application/pdf', fileSize: 245000 },
      ],
      commentCount: 1,
      comments: [
        {
          commentId: generateId(),
          postId: '',
          authorId: 'student-3',
          authorName: 'Jordan Kim',
          authorRole: 'student',
          content: 'Thank you for sharing this!',
          createdAt: new Date(now.getTime() - 3600000 * 5).toISOString(),
        },
      ],
      createdAt: new Date(now.getTime() - 86400000).toISOString(),
    },
    {
      postId: generateId(),
      sectionId,
      authorId: 'teacher-1',
      authorName: 'Ms. Johnson',
      authorRole: 'teacher',
      type: 'post',
      content: 'Great job on today\'s group activity! I was impressed by the creative solutions your teams came up with. Remember, the written reflection is due by Friday.',
      plainText: 'Great job on today\'s group activity! Written reflection due Friday.',
      commentCount: 0,
      comments: [],
      createdAt: new Date(now.getTime() - 3600000 * 3).toISOString(),
    },
  ]
}

export function useStreamPosts(sectionId: string) {
  const [posts, setPosts] = useState<StreamPost[]>(() => generateMockPosts(sectionId))
  const [isLoading] = useState(false)

  const createPost = useCallback(
    (content: string, plainText: string, type: 'announcement' | 'post' | 'material') => {
      const newPost: StreamPost = {
        postId: generateId(),
        sectionId,
        authorId: 'teacher-1',
        authorName: 'Ms. Johnson',
        authorRole: 'teacher',
        type,
        content,
        plainText,
        commentCount: 0,
        comments: [],
        createdAt: new Date().toISOString(),
      }
      setPosts((prev) => [newPost, ...prev])
    },
    [sectionId]
  )

  const addComment = useCallback((postId: string, content: string) => {
    const newComment: StreamComment = {
      commentId: generateId(),
      postId,
      authorId: 'teacher-1',
      authorName: 'Ms. Johnson',
      authorRole: 'teacher',
      content,
      createdAt: new Date().toISOString(),
    }
    setPosts((prev) =>
      prev.map((p) =>
        p.postId === postId
          ? { ...p, comments: [...p.comments, newComment], commentCount: p.commentCount + 1 }
          : p
      )
    )
  }, [])

  return { posts, isLoading, createPost, addComment }
}
