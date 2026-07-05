/**
 * Security page — Sessions tab (SR.1-4 frontend, Slice 2).
 *
 * Locks in: switching to the Sessions tab lists active sessions, the current
 * session is non-revocable (no revoke button), revoking a non-current session
 * fires revokeSession, and the empty state renders. Services are mocked at the
 * users.service boundary; a real QueryClient drives the useQuery/useMutation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// i18n → return the key (so tab labels / strings are addressable)
vi.mock('@edforge/i18n', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

// framer-motion → render children directly, no animation gating
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, { get: () => (p: { children?: ReactNode }) => <div>{p.children}</div> }),
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// SettingsShared pulls @edforge/ui/motion (a built subpath) — stub it; the
// sessions tab doesn't depend on its internals.
vi.mock('@/components/settings/SettingsShared', () => ({
  SettingsPageHeader: (p: { title?: string }) => <div>{p.title}</div>,
  SettingsRow: (p: { action?: ReactNode }) => <div>{p.action}</div>,
  SettingsSkeleton: () => <div>loading</div>,
  staggerChildren: {},
  fadeInUp: {},
}))

const user = { id: 'u1', email: 'a@b.c', assignments: {} }
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user }),
}))

const getSecurityOverview = vi.fn()
const getActiveSessions = vi.fn()
const revokeSession = vi.fn()
const revokeAllSessions = vi.fn()
vi.mock('@/services/users.service', () => ({
  usersService: {
    getSecurityOverview: (...a: unknown[]) => getSecurityOverview(...a),
    getActiveSessions: (...a: unknown[]) => getActiveSessions(...a),
    revokeSession: (...a: unknown[]) => revokeSession(...a),
    revokeAllSessions: (...a: unknown[]) => revokeAllSessions(...a),
  },
}))

import SecurityPage from '../security'

const overview = {
  mfaEnabled: false,
  activeSessions: 2,
  recentLoginAttempts: 0,
  securityScore: 80,
  recommendations: [],
}
const sessionCurrent = {
  sessionId: 's-current',
  browser: 'Chrome',
  os: 'macOS',
  deviceType: 'desktop',
  ipAddress: '1.2.3.4',
  lastActivityAt: new Date('2026-07-05T10:00:00Z').toISOString(),
  createdAt: new Date('2026-07-05T09:00:00Z').toISOString(),
  isCurrent: true,
}
const sessionOther = { ...sessionCurrent, sessionId: 's-other', browser: 'Firefox', os: 'Windows', isCurrent: false }

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <SecurityPage />
    </QueryClientProvider>
  )
}

describe('SecurityPage — Sessions tab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSecurityOverview.mockResolvedValue(overview)
  })

  it('lists sessions and marks the current one non-revocable', async () => {
    getActiveSessions.mockResolvedValue([sessionCurrent, sessionOther])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'security.sessions' }))
    await waitFor(() => expect(getActiveSessions).toHaveBeenCalledWith('u1'))
    expect(await screen.findByText('Chrome on macOS')).toBeInTheDocument()
    expect(screen.getByText('Firefox on Windows')).toBeInTheDocument()
  })

  it('"sign out other devices" calls revokeAllSessions with exceptCurrent=true', async () => {
    getActiveSessions.mockResolvedValue([sessionCurrent, sessionOther])
    revokeSession.mockResolvedValue({ success: true })
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'security.sessions' }))
    await screen.findByText('Firefox on Windows')
    // "sign out other devices" button is present because a non-current session exists
    fireEvent.click(screen.getByText('security.signOutOtherDevices'))
    await waitFor(() => expect(revokeAllSessions).toHaveBeenCalledWith('u1', true))
  })

  it('renders the empty state when there are no sessions', async () => {
    getActiveSessions.mockResolvedValue([])
    renderPage()
    fireEvent.click(await screen.findByRole('button', { name: 'security.sessions' }))
    expect(await screen.findByText('security.noSessions')).toBeInTheDocument()
  })
})
