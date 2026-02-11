/**
 * Hooks Barrel Export
 */

export { usePaginatedQuery } from './usePaginatedQuery'
export type {
  PaginatedResponse,
  UsePaginatedQueryOptions,
  UsePaginatedQueryResult,
} from './usePaginatedQuery'

export { useDebounce } from './useDebounce'

export { useModalState } from './useModalState'
export type {
  ModalMode,
  ModalState,
  UseModalStateResult,
} from './useModalState'

export {
  staffKeys,
  useStaffList,
  useStaffDetail,
  useStaffAssignments,
  useStaffEmploymentHistory,
  useCreateStaff,
  useCreateStaffWithUser,
  useUpdateStaff,
  useDeleteStaff,
  useCreateAssignment,
  useUpdateAssignment,
  useRemoveAssignment,
  useUpdateEmploymentStatus,
} from './useStaff'
