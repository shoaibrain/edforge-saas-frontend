/**
 * People Overview — ⑧ Attention Corner (header-zone-spec §7b)
 *
 * Verifies the corner derives its signals from the live staff query:
 * - unassigned-department (warn) + no-system-access (info) appear with counts
 * - the shade lists both signals with their SABER domain tags
 * - signals auto-resolve on rerender when the underlying records heal
 * - `[]` while the query loads → quiet all-clear pill, no signal rows
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

// ── Controlled query state (read by the hoisted hook mocks at render time) ──
let staffData: Array<Record<string, unknown>> = []
let staffLoading = false

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
        'overview.signals.openDirectory': 'Open staff directory',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('../../stores/app.store', () => ({
  useActiveSchoolId: () => 'school-1',
}))

vi.mock('../../hooks', () => ({
  useStaffList: () => ({ items: staffData, isLoading: staffLoading }),
  useModalState: () => ({
    mode: null,
    openCreate: vi.fn(),
    openEdit: vi.fn(),
    close: vi.fn(),
  }),
}))

vi.mock('../../components/staff', () => ({
  CreateUserModal: () => null,
}))
vi.mock('../../components/staff/StaffRoleChip', () => ({
  StaffRoleChip: () => null,
}))
vi.mock('../../components/staff/StaffRoleBadge', () => ({
  getRoleI18nKey: (role: string) => role,
}))
vi.mock('../../lib/avatar', () => ({
  getStaffAvatar: () => '',
}))

import { Overview } from '../overview'

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
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  window.localStorage.clear()
  staffLoading = false
  staffData = []
})

afterEach(cleanup)

describe('People Overview — ⑧ Attention Corner', () => {
  it('derives warn + info signals from the live staff list', () => {
    staffData = [
      makeStaff({ staffId: 'st-1' }), // healthy
      makeStaff({ staffId: 'st-2', departmentName: undefined }), // → capacity warn
      makeStaff({ staffId: 'st-3', departmentName: null }), // → capacity warn
      makeStaff({ staffId: 'st-4', userId: undefined }), // → data-quality info
    ]
    render(<Overview />)

    const pill = screen.getByTestId('attention-pill')
    // One warn signal + one info signal → two severity counts of 1 each.
    expect(pill.textContent).toContain('need attention')
    expect(pill.textContent?.match(/1/g)?.length).toBe(2)

    fireEvent.click(pill)
    const region = screen.getByRole('region', { name: 'Needs attention' })
    expect(region.textContent).toContain('2 staff not assigned to a department')
    expect(region.textContent).toContain('1 staff have no system access')
    expect(region.textContent).toContain('Capacity')
    expect(region.textContent).toContain('Data quality')
  })

  it('auto-resolves signals on rerender when the records heal', () => {
    staffData = [makeStaff({ staffId: 'st-1', departmentName: undefined, userId: undefined })]
    const { rerender } = render(<Overview />)
    expect(screen.getByTestId('attention-pill').textContent).toContain('need attention')

    // Same query, healed data (department assigned + account provisioned):
    // the corner derives on render, so the signals disappear without any
    // dismiss/ack interaction.
    staffData = [makeStaff({ staffId: 'st-1' })]
    rerender(<Overview />)
    const pill = screen.getByTestId('attention-pill')
    expect(pill.textContent).toContain('All clear')
    expect(pill.textContent).not.toContain('need attention')
  })

  it('emits no signals while the staff query is loading', () => {
    staffLoading = true
    staffData = []
    render(<Overview />)
    expect(screen.getByTestId('attention-pill').textContent).toContain('All clear')
    expect(screen.queryByRole('region', { name: 'Needs attention' })).toBeNull()
  })
})
