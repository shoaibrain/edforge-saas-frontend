/**
 * Global Modal State Management
 * 
 * Centralized store for managing modal visibility and data.
 * Supports multiple concurrent modals with proper z-index stacking.
 */

import { create } from 'zustand'

// ============================================================================
// MODAL TYPES
// ============================================================================

export type ModalType =
  | 'confirm-delete'
  | 'person-details'

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
