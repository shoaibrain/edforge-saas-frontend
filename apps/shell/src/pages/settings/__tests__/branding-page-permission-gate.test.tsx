/**
 * Sprint M2 / PR #88 review-fix — Branding page permission gate.
 *
 * Locks in the invariant: when `usePermission('view', 'branding')`
 * returns false, the page must NEVER fire the branding fetch. Pre-
 * fix the hook ran first and the network round-trip was wasted on
 * users whose 403 outcome was knowable client-side. Post-fix the
 * hook receives `undefined` for its schoolId arg (gated on canView)
 * and stays idle.
 *
 * Mocks at the @edforge/identity-services boundary so we can spy
 * on the hook invocation arguments without standing up React Query
 * + axios for the assertion.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const usePermissionMock = vi.fn()
const useActiveSchoolMock = vi.fn()
const useSchoolBrandingMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('@edforge/abac', () => ({
  usePermission: (...args: unknown[]) => usePermissionMock(...args),
}))

vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
  }),
}))

vi.mock('@edforge/identity-services', () => ({
  useSchoolBranding: (...args: unknown[]) => useSchoolBrandingMock(...args),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

vi.mock('../../../lib/shell-context', () => ({
  useActiveSchool: () => useActiveSchoolMock(),
}))

// BrandingDisplay's full dependency graph is unnecessary for these tests —
// we only care which schoolId reaches the hook.
vi.mock('../../../components/branding/BrandingDisplay', () => ({
  BrandingDisplay: () => <div data-testid="branding-display" />,
}))

const { BrandingSettingsPage } = await import('../branding')

function setup(opts: {
  canView: boolean
  activeSchoolId: string | null
  hookReturn?: {
    data?: unknown
    isLoading?: boolean
    isPending?: boolean
    error?: unknown
  }
}) {
  usePermissionMock.mockReturnValue(opts.canView)
  useActiveSchoolMock.mockReturnValue({
    activeSchoolId: opts.activeSchoolId,
    activeSchool: opts.activeSchoolId ? { name: 'Test School' } : null,
  })
  useSchoolBrandingMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isPending: false,
    error: null,
    refetch: vi.fn(),
    ...opts.hookReturn,
  })
}

describe('BrandingSettingsPage — permission gate (PR #88 review-fix)', () => {
  beforeEach(() => {
    usePermissionMock.mockReset()
    useActiveSchoolMock.mockReset()
    useSchoolBrandingMock.mockReset()
    navigateMock.mockReset()
  })

  it('calls useSchoolBranding with `undefined` when canView is false (no fetch)', () => {
    setup({ canView: false, activeSchoolId: 'school-1' })
    render(<BrandingSettingsPage />)

    // PRIMARY INVARIANT: the hook MUST receive undefined so its
    // `enabled: !!schoolId` gate keeps the underlying query idle.
    expect(useSchoolBrandingMock).toHaveBeenCalledWith(undefined)

    // The forbidden-state UI renders.
    expect(screen.getByText('forbidden.title')).toBeInTheDocument()

    // Sanity — the BrandingDisplay does NOT render.
    expect(screen.queryByTestId('branding-display')).not.toBeInTheDocument()
  })

  it('calls useSchoolBranding with the activeSchoolId when canView is true', () => {
    setup({
      canView: true,
      activeSchoolId: 'school-1',
      hookReturn: {
        data: { branding: null },
        isLoading: false,
        isPending: false,
      },
    })
    render(<BrandingSettingsPage />)
    expect(useSchoolBrandingMock).toHaveBeenCalledWith('school-1')
  })

  it('still passes `undefined` when canView is true but no school is selected', () => {
    // Pre-school-context idle window — both gates collaborate so the
    // hook stays idle until BOTH conditions are true.
    setup({ canView: true, activeSchoolId: null })
    render(<BrandingSettingsPage />)
    expect(useSchoolBrandingMock).toHaveBeenCalledWith(undefined)
    expect(screen.getByText('noActiveSchool')).toBeInTheDocument()
  })

  it('renders the loading spinner when canView is true and the hook reports pending', () => {
    setup({
      canView: true,
      activeSchoolId: 'school-1',
      hookReturn: {
        isLoading: true,
        isPending: true,
      },
    })
    const { container } = render(<BrandingSettingsPage />)
    // Loader2 from lucide-react renders an SVG with class 'animate-spin'.
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('renders BrandingDisplay when canView is true and data is loaded', () => {
    setup({
      canView: true,
      activeSchoolId: 'school-1',
      hookReturn: {
        data: { branding: { formalName: 'School' } },
        isLoading: false,
        isPending: false,
      },
    })
    render(<BrandingSettingsPage />)
    expect(screen.getByTestId('branding-display')).toBeInTheDocument()
  })
})
