/**
 * Tests for AttendancePolicyTab (Story 4: "Admin configures attendance mode").
 *
 * Coverage:
 *  1. Both modes render.
 *  2. Save disabled when not dirty; selecting the other mode enables Save and
 *     clicking it calls the mutation with the chosen mode.
 *  3. Threshold info row hidden under daily_presence, shown under
 *     per_section_granular.
 *  4. ABAC: non-TenantAdmin sees disabled radios, the admin-only note, and no
 *     enabled Save.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mutate = vi.fn()

vi.mock('@/hooks/useAttendancePolicy', () => ({
  useSchoolAttendancePolicy: vi.fn(),
  useUpdateSchoolAttendancePolicy: vi.fn(),
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}))

import AttendancePolicyTab from '../AttendancePolicyTab'
import {
  useSchoolAttendancePolicy,
  useUpdateSchoolAttendancePolicy,
} from '@/hooks/useAttendancePolicy'
import { useAuthStore } from '@/stores/auth.store'

const SCHOOL_ID = 'school-abc'

function makePolicy(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: SCHOOL_ID,
    effectiveMode: 'daily_presence',
    modeSource: 'archetype',
    countingPolicy: { granularPresenceThresholdPct: 50 },
    countingSource: 'archetype',
    archetype: 'PABSON',
    ...overrides,
  }
}

function stubPolicy(policy: ReturnType<typeof makePolicy> | undefined, isLoading = false) {
  ;(useSchoolAttendancePolicy as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    data: policy,
    isLoading,
  })
}

function stubMutation() {
  ;(useUpdateSchoolAttendancePolicy as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
    mutate,
    isPending: false,
  })
}

function stubUser(globalRole: 'TenantAdmin' | 'StandardUser') {
  ;(useAuthStore as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    (selector: (s: any) => unknown) => selector({ user: { globalRole } }),
  )
}

describe('AttendancePolicyTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubMutation()
  })

  it('renders both attendance modes', () => {
    stubUser('TenantAdmin')
    stubPolicy(makePolicy())
    render(<AttendancePolicyTab schoolId={SCHOOL_ID} />)

    expect(screen.getByText('Daily Presence')).toBeInTheDocument()
    expect(screen.getByText('Per-Section Granular')).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(2)
  })

  it('disables Save when not dirty', () => {
    stubUser('TenantAdmin')
    stubPolicy(makePolicy())
    render(<AttendancePolicyTab schoolId={SCHOOL_ID} />)

    const saveBtn = screen.getByRole('button', { name: /^save$/i }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(true)
  })

  it('selecting the other mode enables Save and clicking it calls mutate with that mode', () => {
    stubUser('TenantAdmin')
    stubPolicy(makePolicy({ effectiveMode: 'daily_presence' }))
    render(<AttendancePolicyTab schoolId={SCHOOL_ID} />)

    fireEvent.click(screen.getByRole('radio', { name: /per-section granular/i }))

    const saveBtn = screen.getByRole('button', { name: /^save$/i }) as HTMLButtonElement
    expect(saveBtn.disabled).toBe(false)

    fireEvent.click(saveBtn)
    expect(mutate).toHaveBeenCalledTimes(1)
    expect(mutate.mock.calls[0][0]).toBe('per_section_granular')
  })

  it('hides the threshold info row under daily_presence and shows it under per_section_granular', () => {
    stubUser('TenantAdmin')
    stubPolicy(makePolicy({ effectiveMode: 'daily_presence' }))
    render(<AttendancePolicyTab schoolId={SCHOOL_ID} />)

    expect(screen.queryByText(/presence threshold/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /per-section granular/i }))
    expect(screen.getByText(/presence threshold/i)).toBeInTheDocument()
    expect(screen.getByText(/50%/)).toBeInTheDocument()
  })

  it('non-TenantAdmin: radios disabled, admin-only note shown, no enabled Save', () => {
    stubUser('StandardUser')
    stubPolicy(makePolicy())
    render(<AttendancePolicyTab schoolId={SCHOOL_ID} />)

    for (const radio of screen.getAllByRole('radio') as HTMLInputElement[]) {
      expect(radio.disabled).toBe(true)
    }

    expect(screen.getByText(/only tenant administrators can change/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^save$/i })).not.toBeInTheDocument()
  })
})
