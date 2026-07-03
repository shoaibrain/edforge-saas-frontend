/**
 * BulkDeleteStaffModal — fan-out + aggregate-toast contract.
 *
 * The modal has no bulk endpoint: it fans out the existing single-row
 * deleteStaff per selected record via Promise.allSettled, surfaces ONE
 * aggregate toast, and only clears the page selection (onComplete) when at
 * least one delete succeeded.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { StaffResponseDto } from '@aibrains/shared-types'

const deleteStaffMock = vi.fn()
vi.mock('../../../services/staff.service', () => ({
  staffService: { deleteStaff: (id: string) => deleteStaffMock(id) },
}))

const toastSuccess = vi.fn()
const toastError = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (...a: unknown[]) => toastSuccess(...a), error: (...a: unknown[]) => toastError(...a) },
}))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'bulkDelete.title': `Delete ${params?.count ?? 0} staff member?`,
        'bulkDelete.description': 'This removes their staff records from the roster.',
        'bulkDelete.fanOutNote': 'Each row is a separate request.',
        'bulkDelete.confirm': `Delete ${params?.count ?? 0}`,
        'bulkDelete.deleting': 'Deleting…',
        'bulkDelete.toasts.success': `Deleted ${params?.count ?? 0} staff member`,
        'bulkDelete.toasts.allFailed': 'No staff deleted — every request failed',
        'bulkDelete.toasts.partial': `Deleted ${params?.ok}; ${params?.failed} failed`,
        'actions.cancel': 'Cancel',
      }
      return map[key] ?? key
    },
  }),
}))

import { BulkDeleteStaffModal } from '../BulkDeleteStaffModal'

const staff = (id: string): StaffResponseDto =>
  ({
    staffId: id,
    firstName: 'Staff',
    lastSurname: id.toUpperCase(),
    email: `${id}@school.edu.np`,
  }) as unknown as StaffResponseDto

function renderModal(rows: StaffResponseDto[], handlers: { onClose?: () => void; onComplete?: () => void } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <BulkDeleteStaffModal
        open
        staff={rows}
        onClose={handlers.onClose ?? vi.fn()}
        onComplete={handlers.onComplete ?? vi.fn()}
      />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  deleteStaffMock.mockReset()
  toastSuccess.mockReset()
  toastError.mockReset()
})

afterEach(cleanup)

describe('BulkDeleteStaffModal', () => {
  it('fans out one delete per row and toasts the aggregate success', async () => {
    deleteStaffMock.mockResolvedValue(undefined)
    const onComplete = vi.fn()
    const onClose = vi.fn()
    renderModal([staff('a'), staff('b')], { onComplete, onClose })

    fireEvent.click(screen.getByRole('button', { name: /Delete 2/ }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())

    expect(deleteStaffMock).toHaveBeenCalledTimes(2)
    expect(deleteStaffMock.mock.calls.map((c) => c[0]).sort()).toEqual(['a', 'b'])
    expect(toastSuccess).toHaveBeenCalledWith('Deleted 2 staff member')
    expect(onComplete).toHaveBeenCalled()
  })

  it('partial failure → error toast with counts, selection still cleared', async () => {
    deleteStaffMock
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('409'))
    const onComplete = vi.fn()
    renderModal([staff('a'), staff('b')], { onComplete })

    fireEvent.click(screen.getByRole('button', { name: /Delete 2/ }))
    await waitFor(() => expect(toastError).toHaveBeenCalledWith('Deleted 1; 1 failed'))
    expect(onComplete).toHaveBeenCalled()
  })

  it('all failed → error toast, selection NOT cleared', async () => {
    deleteStaffMock.mockRejectedValue(new Error('500'))
    const onComplete = vi.fn()
    const onClose = vi.fn()
    renderModal([staff('a')], { onComplete, onClose })

    fireEvent.click(screen.getByRole('button', { name: /Delete 1/ }))
    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith('No staff deleted — every request failed'),
    )
    expect(onComplete).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('lists every target row', () => {
    renderModal([staff('a'), staff('b'), staff('c')])
    expect(screen.getByText('Staff A')).toBeTruthy()
    expect(screen.getByText('Staff B')).toBeTruthy()
    expect(screen.getByText('Staff C')).toBeTruthy()
  })
})
