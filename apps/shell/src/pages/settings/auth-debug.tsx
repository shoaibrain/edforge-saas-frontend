/**
 * Auth Debug Page
 *
 * Developer tool for inspecting authentication state, JWT tokens,
 * and Cognito session details. Mirrors the SaaS Provider Console's
 * "Authentication Information" view.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
  User,
  KeyRound,
  Shield,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@edforge/ui'
import { useAuthStore } from '@/stores/auth.store'
import {
  getSession,
  refreshSession,
} from '@edforge/auth'
import {
  SettingsPageHeader,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES
// ============================================================================

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

interface TokenState {
  raw: string
  decoded: DecodedJwt | null
}

// ============================================================================
// JWT UTILITIES
// ============================================================================

function decodeBase64Url(str: string): string {
  // Replace URL-safe chars and add padding
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}

function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const header = JSON.parse(decodeBase64Url(parts[0]))
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    const signature = parts[2]

    return { header, payload, signature }
  } catch {
    return null
  }
}

// ============================================================================
// COPY BUTTON
// ============================================================================

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
      title={label}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Icon = isOpen ? ChevronUp : ChevronDown

  return (
    <div className="border-t border-[rgb(var(--border-secondary))]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 px-1 text-sm font-medium text-[rgb(var(--text-primary))] hover:text-teal-600 dark:hover:text-cyan-400 transition-colors"
      >
        {title}
        <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      </button>
      {isOpen && (
        <div className="pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// INFO ROW
// ============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2">
      <dt className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-[rgb(var(--text-primary))] break-all">
        {value}
      </dd>
    </div>
  )
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({
  label,
  variant,
}: {
  label: string
  variant: 'success' | 'warning' | 'neutral'
}) {
  const styles = {
    success:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    neutral:
      'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))] border-[rgb(var(--border-primary))]',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[variant]}`}
    >
      {label}
    </span>
  )
}

// ============================================================================
// TOKEN RAW DISPLAY
// ============================================================================

function TokenRawDisplay({ token }: { token: string }) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <CopyButton text={token} label="Copy Token" />
      </div>
      <pre className="p-4 pr-24 rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] text-xs font-mono text-[rgb(var(--text-secondary))] overflow-x-auto max-h-24 break-all whitespace-pre-wrap">
        {token}
      </pre>
    </div>
  )
}

// ============================================================================
// JSON DISPLAY
// ============================================================================

function JsonDisplay({ data }: { data: Record<string, unknown> | string }) {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2)

  return (
    <div className="relative">
      <div className="absolute top-2 right-2">
        <CopyButton text={text} />
      </div>
      <pre className="p-4 pr-20 rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] text-xs font-mono text-[rgb(var(--text-secondary))] overflow-x-auto max-h-80 whitespace-pre-wrap">
        {text}
      </pre>
    </div>
  )
}

// ============================================================================
// TOKEN ANALYSIS CARD
// ============================================================================

function TokenAnalysisCard({
  title,
  icon: Icon,
  token,
}: {
  title: string
  icon: typeof KeyRound
  token: TokenState | null
}) {
  if (!token) {
    return (
      <motion.div
        variants={fadeInUp}
        className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
      >
        <div className="flex items-center gap-2.5 mb-4">
          <Icon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            {title}
          </h2>
        </div>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          Token not available
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <Icon className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
          {title}
        </h2>
      </div>

      {/* Raw Token */}
      <div className="mb-2">
        <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] mb-2">
          Raw Token
        </p>
        <TokenRawDisplay token={token.raw} />
      </div>

      {/* Decoded Sections */}
      {token.decoded && (
        <div className="mt-4">
          <CollapsibleSection title="Header" defaultOpen>
            <JsonDisplay data={token.decoded.header} />
          </CollapsibleSection>

          <CollapsibleSection title="Payload" defaultOpen>
            <JsonDisplay data={token.decoded.payload} />
          </CollapsibleSection>

          <CollapsibleSection title="Signature">
            <pre className="p-4 rounded-xl bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] text-xs font-mono text-[rgb(var(--text-secondary))] overflow-x-auto break-all whitespace-pre-wrap">
              {token.decoded.signature}
            </pre>
          </CollapsibleSection>
        </div>
      )}
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuthDebugPage() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const tenantName = useAuthStore((s) => s.tenantName)
  const tenantTier = useAuthStore((s) => s.tenantTier)

  const [idToken, setIdToken] = useState<TokenState | null>(null)
  const [accessToken, setAccessToken] = useState<TokenState | null>(null)
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadTokens = async () => {
    try {
      const session = await getSession()
      if (!session) {
        setIsLoading(false)
        return
      }

      setExpiresAt(session.expiresAt)

      // Decode ID Token
      const idDecoded = decodeJwt(session.idToken)
      setIdToken({ raw: session.idToken, decoded: idDecoded })

      // Decode Access Token
      const accessDecoded = decodeJwt(session.accessToken)
      setAccessToken({ raw: session.accessToken, decoded: accessDecoded })
    } catch (err) {
      console.error('[AuthDebug] Failed to load tokens:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTokens()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const session = await refreshSession()
      if (session) {
        setExpiresAt(session.expiresAt)
        setIdToken({ raw: session.idToken, decoded: decodeJwt(session.idToken) })
        setAccessToken({ raw: session.accessToken, decoded: decodeJwt(session.accessToken) })
        toast.success('Session refreshed successfully')
      } else {
        toast.error('Failed to refresh session')
      }
    } catch {
      toast.error('Failed to refresh session')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Get ID token payload for display
  const idPayload = idToken?.decoded?.payload
  const emailVerified = idPayload?.email_verified
  const tokenScope = accessToken?.decoded?.payload?.scope

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          <div className="h-8 w-64 rounded-lg bg-[rgb(var(--surface-tertiary))] animate-pulse" />
          <div className="h-4 w-96 rounded-lg bg-[rgb(var(--surface-tertiary))] animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-[rgb(var(--surface-tertiary))] animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Authentication Information"
          description="View detailed authentication tokens and user profile information"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh Session
            </Button>
          }
        />

        {/* User Profile & Token Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <User className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                User Profile
              </h2>
            </div>

            <dl className="space-y-1">
              <InfoRow
                label="Subject (User ID)"
                value={user?.id || 'N/A'}
              />
              <InfoRow label="Email" value={user?.email || 'N/A'} />
              <InfoRow
                label="Preferred Username"
                value={
                  (idPayload?.preferred_username as string) ||
                  (idPayload?.['cognito:username'] as string) ||
                  'N/A'
                }
              />
              <InfoRow
                label="Global Role"
                value={user?.globalRole || 'N/A'}
              />
              <InfoRow
                label="Tenant"
                value={
                  tenantName ? (
                    <span>
                      {tenantName}
                      {tenantTier && (
                        <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                          ({tenantTier})
                        </span>
                      )}
                    </span>
                  ) : (
                    'N/A'
                  )
                }
              />
              <InfoRow
                label="Email Verified"
                value={
                  <StatusBadge
                    label={emailVerified ? 'Verified' : 'Not Verified'}
                    variant={emailVerified ? 'success' : 'warning'}
                  />
                }
              />
              <InfoRow
                label="Authentication Status"
                value={
                  <StatusBadge
                    label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                    variant={isAuthenticated ? 'success' : 'warning'}
                  />
                }
              />
            </dl>
          </motion.div>

          {/* Token Information */}
          <motion.div
            variants={fadeInUp}
            className="p-6 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
          >
            <div className="flex items-center gap-2.5 mb-5">
              <Shield className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
              <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                Token Information
              </h2>
            </div>

            <dl className="space-y-1">
              <InfoRow label="Token Type" value="Bearer" />
              <InfoRow
                label="Scope"
                value={
                  tokenScope ? (
                    <span className="text-xs leading-relaxed">
                      {String(tokenScope)}
                    </span>
                  ) : (
                    'N/A'
                  )
                }
              />
              <InfoRow
                label="Issuer"
                value={
                  (idPayload?.iss as string) || 'N/A'
                }
              />
              <InfoRow
                label="Audience"
                value={
                  (idPayload?.aud as string) || 'N/A'
                }
              />
              <InfoRow
                label="Expires At"
                value={
                  expiresAt ? (
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
                      {new Date(expiresAt).toLocaleString()}
                      {expiresAt < Date.now() && (
                        <StatusBadge label="Expired" variant="warning" />
                      )}
                    </span>
                  ) : (
                    'N/A'
                  )
                }
              />
              <InfoRow
                label="Auth Time"
                value={
                  idPayload?.auth_time
                    ? new Date(
                        (idPayload.auth_time as number) * 1000
                      ).toLocaleString()
                    : 'N/A'
                }
              />
              <InfoRow
                label="Issued At"
                value={
                  idPayload?.iat
                    ? new Date(
                        (idPayload.iat as number) * 1000
                      ).toLocaleString()
                    : 'N/A'
                }
              />
            </dl>
          </motion.div>
        </div>

        {/* Token Analysis Cards */}
        <TokenAnalysisCard
          title="ID Token Analysis"
          icon={KeyRound}
          token={idToken}
        />

        <TokenAnalysisCard
          title="Access Token Analysis"
          icon={Shield}
          token={accessToken}
        />
      </motion.div>
    </div>
  )
}
