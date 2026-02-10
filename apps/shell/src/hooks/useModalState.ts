/**
 * useModalState Hook
 *
 * Consolidated modal state management for create/edit/delete modals.
 * Provides a clean API for opening and closing modals with associated data.
 */

import { useState, useCallback } from 'react'

export type ModalMode = 'closed' | 'create' | 'edit' | 'delete'

export interface ModalState<T> {
  mode: ModalMode
  data: T | null
}

export interface UseModalStateResult<T> {
  isOpen: boolean
  mode: ModalMode
  data: T | null
  openCreate: () => void
  openEdit: (data: T) => void
  openDelete: (data: T) => void
  close: () => void
}

export function useModalState<T>(): UseModalStateResult<T> {
  const [state, setState] = useState<ModalState<T>>({
    mode: 'closed',
    data: null,
  })

  const openCreate = useCallback(() => {
    setState({ mode: 'create', data: null })
  }, [])

  const openEdit = useCallback((data: T) => {
    setState({ mode: 'edit', data })
  }, [])

  const openDelete = useCallback((data: T) => {
    setState({ mode: 'delete', data })
  }, [])

  const close = useCallback(() => {
    setState({ mode: 'closed', data: null })
  }, [])

  return {
    isOpen: state.mode !== 'closed',
    mode: state.mode,
    data: state.data,
    openCreate,
    openEdit,
    openDelete,
    close,
  }
}
