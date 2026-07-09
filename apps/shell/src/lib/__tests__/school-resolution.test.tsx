/**
 * Active-school resolution integration test.
 *
 * Mounts the real ShellProvider (with tenantService mocked) and asserts the
 * bootstrap precedence: same-tab session context → server default school →
 * last explicitly-used school → first school in the list; plus the
 * isBootstrapping gate that holds until resolution completes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../services/tenant.service', () => ({
  tenantService: {
    getCurrentUser: vi.fn(),
    getTenant: vi.fn(),
    getSchools: vi.fn(),
    getCurrentAcademicYear: vi.fn(),
    getWorkspaceSettings: vi.fn(),
    getMyWorkspaceSettings: vi.fn(),
    getSchoolConfiguration: vi.fn(),
  },
}))
vi.mock('../query-client', () => ({
  armSchoolTransitionErrorToast: vi.fn(),
}))

import { ShellProvider, useShell } from '../shell-context'
import { tenantService } from '../../services/tenant.service'
import { useAuthStore } from '../../stores/auth.store'
import { useAppStore, setSchoolSessionOwner, getSchoolSessionOwner } from '../../stores/app.store'

const USER_ID = 'user-1'

const SCHOOLS = [
  { id: 's-alpha', name: 'Alpha School', code: 'AL1', status: 'active' },
  { id: 's-beta', name: 'Beta School', code: 'BE1', status: 'active' },
  { id: 's-gamma', name: 'Gamma School', code: 'GA1', status: 'active' },
]

function mockServices({ defaultSchoolId }: { defaultSchoolId?: string } = {}) {
  vi.mocked(tenantService.getCurrentUser).mockResolvedValue({
    id: USER_ID,
    email: 'admin@example.com',
    firstName: 'Ada',
    lastName: 'Admin',
    displayName: 'Ada',
    tenantId: 'tenant-1',
    tenantName: 'Tenant One',
    globalRole: 'TenantAdmin',
    assignments: [],
    defaultSchoolId,
    createdAt: '',
    updatedAt: '',
  } as never)
  vi.mocked(tenantService.getTenant).mockResolvedValue({ id: 'tenant-1', name: 'Tenant One' } as never)
  vi.mocked(tenantService.getSchools).mockResolvedValue(SCHOOLS as never)
  vi.mocked(tenantService.getCurrentAcademicYear).mockResolvedValue(null as never)
  vi.mocked(tenantService.getWorkspaceSettings).mockResolvedValue({ regional: null } as never)
  vi.mocked(tenantService.getMyWorkspaceSettings).mockResolvedValue({ regional: null } as never)
  vi.mocked(tenantService.getSchoolConfiguration).mockResolvedValue(null as never)
}

function seedAuthenticatedUser() {
  useAuthStore.setState({
    user: {
      id: USER_ID,
      email: 'admin@example.com',
      name: 'Ada Admin',
      tenantId: 'tenant-1',
      globalRole: 'TenantAdmin',
      assignments: {},
    } as never,
    isAuthenticated: true,
    isLoading: false,
    // ShellProvider calls initializeAuth on mount — keep it inert
    initializeAuth: async () => {},
  } as never)
}

function Probe() {
  const { activeSchoolId, isBootstrapping, resolvedSettings } = useShell()
  return (
    <div>
      <span data-testid="school">{activeSchoolId ?? 'none'}</span>
      <span data-testid="bootstrapping">{String(isBootstrapping)}</span>
      <span data-testid="currency">{resolvedSettings.currency}</span>
    </div>
  )
}

function renderShell() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <ShellProvider>
        <Probe />
      </ShellProvider>
    </QueryClientProvider>
  )
}

async function waitForResolution() {
  await waitFor(() => {
    expect(screen.getByTestId('bootstrapping').textContent).toBe('false')
  })
}

beforeEach(() => {
  cleanup()
  vi.clearAllMocks()
  document.cookie = 'edforge-app=; path=/; max-age=0'
  sessionStorage.clear()
  localStorage.clear()
  useAppStore.setState({ activeSchoolId: null, activeSchoolStatus: null, isSchoolTransitioning: false })
  seedAuthenticatedUser()
})

describe('active-school resolution at bootstrap', () => {
  it('fresh context: the server default school wins over list order', async () => {
    mockServices({ defaultSchoolId: 's-beta' })
    renderShell()
    expect(screen.getByTestId('bootstrapping').textContent).toBe('true')
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-beta')
    expect(getSchoolSessionOwner()).toBe(USER_ID)
  })

  it('fresh context: an invalid default falls through to the last explicitly-used school', async () => {
    localStorage.setItem(`edforge-active-school-${USER_ID}`, 's-gamma')
    mockServices({ defaultSchoolId: 's-deleted' })
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-gamma')
  })

  it('fresh context: with no default and no last-used, the first school wins', async () => {
    mockServices()
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-alpha')
  })

  it('same-tab reload: a valid persisted school with a matching session marker is kept over the default', async () => {
    setSchoolSessionOwner(USER_ID)
    useAppStore.setState({ activeSchoolId: 's-gamma' })
    mockServices({ defaultSchoolId: 's-beta' })
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-gamma')
  })

  it("another user's session marker forces fresh resolution (no cross-user leakage)", async () => {
    setSchoolSessionOwner('someone-else')
    useAppStore.setState({ activeSchoolId: 's-gamma' })
    mockServices({ defaultSchoolId: 's-beta' })
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-beta')
    expect(getSchoolSessionOwner()).toBe(USER_ID)
  })

  it('auto-select does not overwrite the last-used record', async () => {
    localStorage.setItem(`edforge-active-school-${USER_ID}`, 's-gamma')
    mockServices({ defaultSchoolId: 's-beta' })
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('school').textContent).toBe('s-beta')
    expect(localStorage.getItem(`edforge-active-school-${USER_ID}`)).toBe('s-gamma')
  })

  it('explicit setActiveSchool records last-used', async () => {
    mockServices({ defaultSchoolId: 's-beta' })

    function Switcher() {
      const { setActiveSchool } = useShell()
      return <button onClick={() => setActiveSchool('s-gamma')}>switch</button>
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <ShellProvider>
          <Probe />
          <Switcher />
        </ShellProvider>
      </QueryClientProvider>
    )
    await waitForResolution()
    screen.getByText('switch').click()
    await waitFor(() => {
      expect(localStorage.getItem(`edforge-active-school-${USER_ID}`)).toBe('s-gamma')
    })
  })
})

describe('settings readiness in the bootstrap gate (currency-flash fix)', () => {
  it('admin: gate holds until the workspace-settings query settles', async () => {
    mockServices({ defaultSchoolId: 's-beta' })
    let resolveSettings!: (v: unknown) => void
    vi.mocked(tenantService.getWorkspaceSettings).mockImplementation(
      () => new Promise((resolve) => { resolveSettings = resolve }) as never
    )
    renderShell()

    // Everything else resolves, but settings are still pending — gate stays up
    await waitFor(() => {
      expect(screen.getByTestId('school').textContent).toBe('s-beta')
    })
    expect(screen.getByTestId('bootstrapping').textContent).toBe('true')

    resolveSettings({ regional: { defaultCurrency: 'NPR' } })
    await waitForResolution()
    expect(screen.getByTestId('currency').textContent).toBe('NPR')
  })

  it('admin: a settings fetch error settles the gate (degrade to defaults, no hang)', async () => {
    mockServices({ defaultSchoolId: 's-beta' })
    vi.mocked(tenantService.getWorkspaceSettings).mockRejectedValue(new Error('500') as never)
    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('currency').textContent).toBe('USD')
  })

  it('non-admin: regional settings resolve via /tenants/my/settings (currency is not USD-forever)', async () => {
    mockServices()
    vi.mocked(tenantService.getCurrentUser).mockResolvedValue({
      id: USER_ID,
      email: 'parent@example.com',
      displayName: 'Pat',
      tenantId: 'tenant-1',
      tenantName: 'Tenant One',
      globalRole: 'StandardUser',
      assignments: [{ schoolId: 's-alpha', schoolName: 'Alpha School', role: 'Parent' }],
      createdAt: '',
      updatedAt: '',
    } as never)
    vi.mocked(tenantService.getMyWorkspaceSettings).mockResolvedValue({
      regional: { defaultCurrency: 'NPR', defaultLocale: 'ne-NP' },
    } as never)
    useAuthStore.setState({
      user: {
        id: USER_ID,
        email: 'parent@example.com',
        name: 'Pat Parent',
        tenantId: 'tenant-1',
        globalRole: 'StandardUser',
        assignments: { 's-alpha': 'Parent' },
      } as never,
      isAuthenticated: true,
      isLoading: false,
      initializeAuth: async () => {},
    } as never)

    renderShell()
    await waitForResolution()
    expect(screen.getByTestId('currency').textContent).toBe('NPR')
    expect(tenantService.getWorkspaceSettings).not.toHaveBeenCalled()
  })
})
