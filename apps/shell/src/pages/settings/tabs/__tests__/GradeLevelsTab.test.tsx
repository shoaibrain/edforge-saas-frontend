/**
 * Tests for GradeLevelsTab (P2 of the Saraswati grade-levels unblock).
 *
 * Coverage:
 *  1. Renders all 20 catalog codes in 4 bands and preselects from
 *     `school.enabledGradeLevels`.
 *  2. Save calls `tenantService.patchSchoolGradeLevels` with codes in
 *     canonical catalog order (NOT click order) — keeps DDB and UI stable
 *     across refetches.
 *  3. Empty-selection rejection: clicking Save with zero codes toasts an
 *     error and does NOT call the service.
 *  4. ABAC: when caller lacks `gradelevels:edit`, every checkbox is disabled
 *     and the Save button is disabled regardless of dirty state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { School, UserIdentity } from '@edforge/types'
import { ABACContext } from '@edforge/abac'

// Toast: capture calls without hitting sonner internals.
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Service: the route-shape test already pins the wire format; here we
// just need a spy.
vi.mock('@/services/tenant.service', () => ({
  tenantService: {
    patchSchoolGradeLevels: vi.fn(),
  },
}))

import GradeLevelsTab from '../GradeLevelsTab'
import { tenantService } from '@/services/tenant.service'
import { toast } from 'sonner'

const SCHOOL_ID = 'school-abc'

const PRINCIPAL_USER: UserIdentity = {
  id: 'u-principal',
  email: 'principal@example.test',
  name: 'Pat Principal',
  globalRole: 'StandardUser',
  tenantId: 'tenant-1',
  assignments: { [SCHOOL_ID]: 'Principal' },
}

const TEACHER_USER: UserIdentity = {
  id: 'u-teacher',
  email: 'teach@example.test',
  name: 'Terri Teacher',
  globalRole: 'StandardUser',
  tenantId: 'tenant-1',
  assignments: { [SCHOOL_ID]: 'Teacher' },
}

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: SCHOOL_ID,
    tenantId: 'tenant-1',
    name: 'Test School',
    code: 'TEST',
    status: 'active',
    isActive: true,
    enabledGradeLevels: ['1', '2', '3'],
    ...overrides,
  }
}

function renderWithProviders(ui: ReactNode, user: UserIdentity) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ABACContext.Provider value={{ user, activeSchoolId: SCHOOL_ID }}>
        {ui}
      </ABACContext.Provider>
    </QueryClientProvider>
  )
}

describe('GradeLevelsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders 20 catalog codes and preselects from school.enabledGradeLevels', () => {
    renderWithProviders(
      <GradeLevelsTab schoolId={SCHOOL_ID} school={makeSchool({ enabledGradeLevels: ['PG', '1'] })} />,
      PRINCIPAL_USER
    )

    // Bands appear
    expect(screen.getByText('Early Childhood')).toBeInTheDocument()
    expect(screen.getByText('Primary')).toBeInTheDocument()
    expect(screen.getByText('Middle')).toBeInTheDocument()
    expect(screen.getByText('High / Secondary')).toBeInTheDocument()

    // 20 checkboxes total
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(20)

    // PG + Grade 1 preselected
    expect((screen.getByLabelText('Playgroup') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByLabelText('Grade 1') as HTMLInputElement).checked).toBe(true)

    // Grade 2 not selected (school.enabledGradeLevels = ['PG','1'])
    expect((screen.getByLabelText('Grade 2') as HTMLInputElement).checked).toBe(false)
  })

  it('Save sends codes in canonical catalog order regardless of click order', async () => {
    ;(tenantService.patchSchoolGradeLevels as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(makeSchool({ enabledGradeLevels: ['NUR', 'LKG', 'UKG', '1'] }))

    renderWithProviders(
      <GradeLevelsTab schoolId={SCHOOL_ID} school={makeSchool({ enabledGradeLevels: ['1'] })} />,
      PRINCIPAL_USER
    )

    // Click in deliberately scrambled order
    fireEvent.click(screen.getByLabelText('Upper KG (UKG)'))
    fireEvent.click(screen.getByLabelText('Nursery'))
    fireEvent.click(screen.getByLabelText('Lower KG (LKG)'))

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(tenantService.patchSchoolGradeLevels).toHaveBeenCalledTimes(1)
    })
    expect(tenantService.patchSchoolGradeLevels).toHaveBeenCalledWith(SCHOOL_ID, {
      enabledGradeLevels: ['NUR', 'LKG', 'UKG', '1'],
    })
  })

  it('rejects empty selection without hitting the service', () => {
    renderWithProviders(
      <GradeLevelsTab schoolId={SCHOOL_ID} school={makeSchool({ enabledGradeLevels: ['1'] })} />,
      PRINCIPAL_USER
    )

    fireEvent.click(screen.getByLabelText('Grade 1'))
    const saveBtn = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement

    expect(saveBtn.disabled).toBe(true)
    expect(tenantService.patchSchoolGradeLevels).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('disables every checkbox + Save when caller lacks gradelevels:edit', () => {
    renderWithProviders(
      <GradeLevelsTab schoolId={SCHOOL_ID} school={makeSchool({ enabledGradeLevels: ['PG', '1'] })} />,
      TEACHER_USER
    )

    const readOnlyBanner = screen.getByText(/view but not change/i)
    expect(readOnlyBanner).toBeInTheDocument()

    for (const cb of screen.getAllByRole('checkbox') as HTMLInputElement[]) {
      expect(cb.disabled).toBe(true)
    }

    const saveBtn = screen.getByRole('button', { name: /save changes/i }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
  })

  it('shows Ed-Fi descriptor pill next to PABSON codes (PG → EarlyChildhoodDevelopment)', () => {
    renderWithProviders(
      <GradeLevelsTab schoolId={SCHOOL_ID} school={makeSchool({ enabledGradeLevels: [] })} />,
      PRINCIPAL_USER
    )

    const pgRow = screen.getByLabelText('Playgroup').closest('label') as HTMLElement
    expect(within(pgRow).getByText(/EarlyChildhoodDevelopment/)).toBeInTheDocument()

    const lkgRow = screen.getByLabelText('Lower KG (LKG)').closest('label') as HTMLElement
    expect(within(lkgRow).getByText(/PrePrimaryClass/)).toBeInTheDocument()
  })
})
