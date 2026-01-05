/**
 * Global Modal State Management
 * 
 * Centralized store for managing modal visibility and data.
 * Supports multiple concurrent modals with proper z-index stacking.
 */

import { create } from 'zustand'
import type { PersonType } from '../lib/mock-data'

// ============================================================================
// MODAL TYPES
// ============================================================================

export type ModalType =
  | 'quick-add-person'
  | 'invite-team'
  | 'add-classroom'
  | 'add-grade-level'
  | 'confirm-delete'
  | 'person-details'

export interface QuickAddPersonData {
  firstName?: string
  lastName?: string
  email?: string
  personType?: PersonType
  prefillFromSearch?: boolean
}

export interface InviteTeamData {
  emails?: string[]
  defaultRole?: 'teacher' | 'staff' | 'admin'
  schoolId?: string
}

export interface ConfirmDeleteData {
  title: string
  message: string
  itemName: string
  onConfirm: () => void | Promise<void>
  destructive?: boolean
}

export interface PersonDetailsData {
  personId: string
}

export type ModalData = 
  | { type: 'quick-add-person'; data?: QuickAddPersonData }
  | { type: 'invite-team'; data?: InviteTeamData }
  | { type: 'add-classroom'; data?: undefined }
  | { type: 'add-grade-level'; data?: undefined }
  | { type: 'confirm-delete'; data: ConfirmDeleteData }
  | { type: 'person-details'; data: PersonDetailsData }

// ============================================================================
// MODAL STATE INTERFACE
// ============================================================================

interface ModalState {
  /** Stack of open modals - last one is on top */
  modals: ModalData[]
  
  /** Check if a specific modal type is open */
  isOpen: (type: ModalType) => boolean
  
  /** Get data for a specific modal type */
  getData: <T extends ModalData['type']>(
    type: T
  ) => Extract<ModalData, { type: T }>['data'] | undefined
  
  /** Open a modal with optional data */
  openModal: <T extends ModalData>(modal: T) => void
  
  /** Close a specific modal type */
  closeModal: (type: ModalType) => void
  
  /** Close the topmost modal */
  closeTopModal: () => void
  
  /** Close all modals */
  closeAllModals: () => void
}

// ============================================================================
// MODAL STORE
// ============================================================================

export const useModalStore = create<ModalState>()((set, get) => ({
  modals: [],

  isOpen: (type) => {
    return get().modals.some((m) => m.type === type)
  },

  getData: (type) => {
    const modal = get().modals.find((m) => m.type === type)
    return modal?.data as any
  },

  openModal: (modal) => {
    set((state) => {
      // Remove existing modal of same type if present
      const filtered = state.modals.filter((m) => m.type !== modal.type)
      return { modals: [...filtered, modal] }
    })
  },

  closeModal: (type) => {
    set((state) => ({
      modals: state.modals.filter((m) => m.type !== type),
    }))
  },

  closeTopModal: () => {
    set((state) => ({
      modals: state.modals.slice(0, -1),
    }))
  },

  closeAllModals: () => {
    set({ modals: [] })
  },
}))

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

/** Hook for Quick Add Person modal */
export function useQuickAddPersonModal() {
  const openModal = useModalStore((s) => s.openModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const isOpen = useModalStore((s) => s.isOpen('quick-add-person'))
  const data = useModalStore((s) => s.getData('quick-add-person'))

  return {
    isOpen,
    data,
    open: (initialData?: QuickAddPersonData) =>
      openModal({ type: 'quick-add-person', data: initialData }),
    close: () => closeModal('quick-add-person'),
  }
}

/** Hook for Invite Team modal */
export function useInviteTeamModal() {
  const openModal = useModalStore((s) => s.openModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const isOpen = useModalStore((s) => s.isOpen('invite-team'))
  const data = useModalStore((s) => s.getData('invite-team'))

  return {
    isOpen,
    data,
    open: (initialData?: InviteTeamData) =>
      openModal({ type: 'invite-team', data: initialData }),
    close: () => closeModal('invite-team'),
  }
}

/** Hook for Add Classroom modal */
export function useAddClassroomModal() {
  const openModal = useModalStore((s) => s.openModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const isOpen = useModalStore((s) => s.isOpen('add-classroom'))

  return {
    isOpen,
    open: () => openModal({ type: 'add-classroom' }),
    close: () => closeModal('add-classroom'),
  }
}

/** Hook for Add Grade Level modal */
export function useAddGradeLevelModal() {
  const openModal = useModalStore((s) => s.openModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const isOpen = useModalStore((s) => s.isOpen('add-grade-level'))

  return {
    isOpen,
    open: () => openModal({ type: 'add-grade-level' }),
    close: () => closeModal('add-grade-level'),
  }
}

/** Hook for Confirm Delete modal */
export function useConfirmDeleteModal() {
  const openModal = useModalStore((s) => s.openModal)
  const closeModal = useModalStore((s) => s.closeModal)
  const isOpen = useModalStore((s) => s.isOpen('confirm-delete'))
  const data = useModalStore((s) => s.getData('confirm-delete'))

  return {
    isOpen,
    data,
    open: (confirmData: ConfirmDeleteData) =>
      openModal({ type: 'confirm-delete', data: confirmData }),
    close: () => closeModal('confirm-delete'),
  }
}

