/**
 * Staff Directory — ⑧ Attention Corner + ⑨ Selection Context Bar (T5.2)
 *
 * Verifies the migrated page:
 * - corner signals derive from the UNFILTERED roster query (same ids as the
 *   Overview) and auto-resolve on rerender when records heal
 * - `[]` while the roster loads → quiet all-clear pill
 * - selecting rows morphs the toolbar into the selection bar with the
 *   Export selected / Delete selected actions; Delete is visibly locked
 *   without the staff:delete permission
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── Controlled state read by the hoisted mocks at render time ──────────────
let rosterData: Array<Record<string, unknown>> = []
let rosterLoading = false
let pageData: Array<Record<string, unknown>> = []
let canDelete = true

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'headerZone.needAttention': 'need attention',
        'headerZone.allClear': 'All clear',
        'headerZone.region': 'Needs attention',
        'headerZone.domains.capacity': 'Capacity',
        'headerZone.domains.dataQuality': 'Data quality',
        'overview.signals.unassignedTitle': `${params?.count ?? 0} staff not assigned to a department`,
        'overview.signals.noAccessTitle': `${params?.count ?? 0} staff have no system access`,
        'dataTable.selection.aria': 'Selection actions',
        'dataTable.selection.selected': `${params?.count ?? 0} selected`,
        'dataTable.selection.selectAll': `Select all ${params?.count ?? 0}`,
        'dataTable.selection.clear': 'Clear selection',
        'staffDirectory.bulk.exportSelected': 'Export selected',
        'staffDirectory.bulk.deleteSelected': 'Delete selected',
        'staffDirectory.bulk.requiresDelete': 'Requires staff delete permission',
        'staffDirectory.searchPlaceholder': 'Search by name or email...',
        'staffDirectory.title': 'Staff Directory',
        'quickFilters.all': 'All',
        'quickFilters.teacher': 'Teachers',
        'quickFilters.principal': 'Principal',
        'quickFilters.support': 'Support',
        'filters.allRoles': 'All Roles',
        'filters.exportCsv': 'Export CSV',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../stores/app.store', () => ({
  useActiveSchoolId: () => 'school-1',
}))

vi.mock('@edforge/abac', () => ({
  usePermission: (action: string) => (action === 'delete' ? canDelete : true),
}))

vi.mock('../../hooks', () => ({
  useStaffList: () => ({ items: rosterData, isLoading: rosterLoading }),
  usePaginatedQuery: () => ({
    items: pageData,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
    totalLoaded: pageData.length,
    hasMore: false,
    isFetchingNextPage: false,
    loadMore: vi.fn(),
  }),
  useDebounce: (v: unknown) => v,
  useModalState: () => ({
    mode: null,
    data: null,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    openDelete: vi.fn(),
    close: vi.fn(),
  }),
}))

// Keep the REAL StaffTable (the selection bar renders through it); stub the
// modals/drawer that pull in heavy dependency trees.
vi.mock('../../components/staff', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    CreateUserModal: () => null,
    EditStaffModal: () => null,
    DeleteConfirmDialog: () => null,
    StaffDrawer: () => null,
    BulkDeleteStaffModal: () => null,
  }
})

vi.mock('../../lib/avatar', () => ({
  getStaffAvatar: () => '',
}))

import StaffPage from '../staff'

function makeStaff(overrides: Record<string, unknown>) {
  return {
    staffId: `st-${Math.random().toString(36).slice(2, 8)}`,
    firstName: 'Asha',
    lastSurname: 'Rai',
    email: 'asha@example.edu.np',
    role: 'teacher',
    employmentStatus: 'active',
    userId: 'user-1',
    departmentName: 'Science',
    hireDate: '2026-01-15',
    ...overrides,
  }
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <StaffPage />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
  rosterLoading = false
  rosterData = []
  pageData = []
  canDelete = true
})

afterEach(cleanup)

describe('Staff Directory — ⑧ Attention Corner', () => {
  it('derives warn + info signals from the unfiltered roster', () => {
    rosterData = [
      makeStaff({ staffId: 'st-1' }),
      makeStaff({ staffId: 'st-2', departmentName: undefined }),
      makeStaff({ staffId: 'st-3', userId: undefined }),
    ]
    pageData = rosterData
    renderPage()

    const pill = screen.getByTestId('attention-pill')
    expect(pill.textContent).toContain('need attention')

    fireEvent.click(pill)
    const region = screen.getByRole('region', { name: 'Needs attention' })
    expect(region.textContent).toContain('1 staff not assigned to a department')
    expect(region.textContent).toContain('1 staff have no system access')
    expect(region.textContent).toContain('Capacity')
    expect(region.textContent).toContain('Data quality')
  })

  it('auto-resolves on rerender when the roster heals', () => {
    rosterData = [makeStaff({ staffId: 'st-1', departmentName: undefined })]
    const { rerender } = renderPage()
    expect(screen.getByTestId('attention-pill').textContent).toContain('need attention')

    rosterData = [makeStaff({ staffId: 'st-1' })]
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <StaffPage />
      </QueryClientProvider>,
    )
    expect(screen.getByTestId('attention-pill').textContent).toContain('All clear')
  })

  it('emits no signals while the roster query loads', () => {
    rosterLoading = true
    renderPage()
    expect(screen.getByTestId('attention-pill').textContent).toContain('All clear')
  })
})

describe('Staff Directory — ⑨ Selection Context Bar', () => {
  it('morphs the toolbar into the bar with Export/Delete on select-all', () => {
    rosterData = [makeStaff({ staffId: 'st-1' }), makeStaff({ staffId: 'st-2' })]
    pageData = rosterData
    renderPage()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }))
    const bar = screen.getByRole('toolbar', { name: 'Selection actions' })
    expect(bar.textContent).toContain('2 selected')
    expect(within(bar).getByRole('button', { name: /Export selected/ })).toBeTruthy()
    expect(within(bar).getByRole('button', { name: /Delete selected/ })).toBeTruthy()
    // The default toolbar (search) is replaced — same footprint, no stacking.
    expect(screen.queryByPlaceholderText('Search by name or email...')).toBeNull()
  })

  it('shows Delete visibly locked without the staff:delete permission', () => {
    canDelete = false
    rosterData = [makeStaff({ staffId: 'st-1' })]
    pageData = rosterData
    renderPage()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }))
    const bar = screen.getByRole('toolbar', { name: 'Selection actions' })
    // Locked actions stay visible + focusable (lock glyph + reason tooltip)
    // and carry aria-disabled — the spec's "visible role locks" contract.
    const deleteBtn = within(bar).getByRole('button', { name: /Delete selected/ })
    expect(deleteBtn.getAttribute('aria-disabled')).toBe('true')
    expect(deleteBtn.getAttribute('title')).toBe('Requires staff delete permission')
  })
})
