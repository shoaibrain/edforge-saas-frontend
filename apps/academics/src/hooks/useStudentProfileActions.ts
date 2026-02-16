/**
 * useStudentProfileActions Hook
 *
 * Centralizes modal state and action handlers for the Student Profile page.
 * Prevents $studentId.tsx route file bloat by extracting all action-related
 * state into a dedicated hook.
 *
 * Sprint 8 - Student Enrollment Workflows
 */

import { useState } from 'react'

export function useStudentProfileActions() {
  // Modal visibility states
  const [enrollModalOpen, setEnrollModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addToSectionModalOpen, setAddToSectionModalOpen] = useState(false)
  const [addGuardianModalOpen, setAddGuardianModalOpen] = useState(false)
  const [editGuardianId, setEditGuardianId] = useState<string | null>(null)

  // Action handlers
  const openEnroll = () => setEnrollModalOpen(true)
  const openEdit = () => setEditModalOpen(true)
  const openAddToSection = () => setAddToSectionModalOpen(true)
  const openAddGuardian = () => setAddGuardianModalOpen(true)
  const openEditGuardian = (guardianId: string) => setEditGuardianId(guardianId)
  const closeEditGuardian = () => setEditGuardianId(null)

  return {
    // Enroll modal
    enrollModalOpen,
    setEnrollModalOpen,
    openEnroll,

    // Edit student modal
    editModalOpen,
    setEditModalOpen,
    openEdit,

    // Add to section modal
    addToSectionModalOpen,
    setAddToSectionModalOpen,
    openAddToSection,

    // Add guardian modal
    addGuardianModalOpen,
    setAddGuardianModalOpen,
    openAddGuardian,

    // Edit guardian
    editGuardianId,
    openEditGuardian,
    closeEditGuardian,
  }
}
