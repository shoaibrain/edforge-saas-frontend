/**
 * Auth Debug Page
 * 
 * Developer/admin page showing detailed authentication information.
 * Displays token analysis, user claims, and session data.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Key,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import { Button, Card, CardContent, CardHeader } from '@edforge/ui'
import {
  getSession,
  getIdTokenPayload,
  isAuthenticated,
  refreshSession,
  type CognitoIdTokenPayload,
  type AuthSession,
} from '@edforge/auth'
import { useAuthStore } from '../stores/auth.store'

// ============================================================================
// TYPES
// ============================================================================

interface DecodedToken {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

// ============================================================================
// UTILITIES
// ============================================================================

function decodeJwt(token: string): DecodedToken | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    return {
      header: JSON.parse(atob(parts[0])),
      payload: JSON.parse(atob(parts[1])),
      signature: parts[2],
    }
  } catch {
    return null
  }
}

function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}

function truncateToken(token: string, length: number = 50): string {
  if (token.length <= length) return token
  return token.substring(0, length) + '...'
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-[rgb(var(--surface-tertiary))] transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-4 h-4 text-emerald-500" />
      ) : (
        <Copy className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
      )}
    </button>
  )
}

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

  return (
    <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--surface-secondary))] transition-colors"
      >
        <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-[rgb(var(--surface-primary))]">
          {children}
        </div>
      )}
    </div>
  )
}

function JsonDisplay({ data }: { data: Record<string, unknown> }) {
  return (
    <pre className="text-xs font-mono bg-[rgb(var(--surface-tertiary))] p-3 rounded-lg overflow-x-auto text-[rgb(var(--text-secondary))]">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

function InfoRow({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-[rgb(var(--border-secondary))] last:border-0">
      <span className="text-sm text-[rgb(var(--text-tertiary))]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-[rgb(var(--text-primary))] text-right max-w-[300px] truncate">
          {value}
        </span>
        {copyable && <CopyButton text={value} />}
      </div>
    </div>
  )
}

// ============================================================================
// TOKEN ANALYSIS COMPONENT
// ============================================================================

function TokenAnalysis({
  title,
  rawToken,
  decoded,
}: {
  title: string
  rawToken: string
  decoded: DecodedToken | null
}) {
  return (
    <Card>
      <CardHeader>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
          <Key className="w-5 h-5 text-teal-500" />
          {title}
        </h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Raw Token */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">Raw Token</span>
            <CopyButton text={rawToken} />
          </div>
          <div className="bg-[rgb(var(--surface-tertiary))] p-3 rounded-lg">
            <code className="text-xs font-mono text-[rgb(var(--text-tertiary))] break-all">
              {truncateToken(rawToken, 100)}
            </code>
          </div>
        </div>

        {decoded && (
          <>
            {/* Header */}
            <CollapsibleSection title="Header">
              <JsonDisplay data={decoded.header} />
            </CollapsibleSection>

            {/* Payload */}
            <CollapsibleSection title="Payload" defaultOpen>
              <JsonDisplay data={decoded.payload} />
            </CollapsibleSection>

            {/* Signature */}
            <CollapsibleSection title="Signature">
              <div className="flex items-center justify-between">
                <code className="text-xs font-mono text-[rgb(var(--text-tertiary))] break-all">
                  {truncateToken(decoded.signature, 80)}
                </code>
                <CopyButton text={decoded.signature} />
              </div>
            </CollapsibleSection>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AuthDebugPage() {
  const user = useAuthStore((s: { user: ReturnType<typeof useAuthStore.getState>['user'] }) => s.user)
  const tenantName = useAuthStore((s: { tenantName: string | null }) => s.tenantName)
  const tenantTier = useAuthStore((s: { tenantTier: string | null }) => s.tenantTier)
  
  const [session, setSession] = useState<AuthSession | null>(null)
  const [idTokenPayload, setIdTokenPayload] = useState<CognitoIdTokenPayload | null>(null)
  const [authenticated, setAuthenticated] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAuthData = async () => {
    try {
      setError(null)
      const [authStatus, sessionData, payload] = await Promise.all([
        isAuthenticated(),
        getSession(),
        getIdTokenPayload(),
      ])
      setAuthenticated(authStatus)
      setSession(sessionData)
      setIdTokenPayload(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch auth data')
    }
  }

  useEffect(() => {
    fetchAuthData()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshSession()
      await fetchAuthData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh session')
    } finally {
      setIsRefreshing(false)
    }
  }

  const idTokenDecoded = session?.idToken ? decodeJwt(session.idToken) : null
  const accessTokenDecoded = session?.accessToken ? decodeJwt(session.accessToken) : null

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Authentication Information
            </h1>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              View detailed authentication tokens and user profile information
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Session
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Top Row - User Profile and Token Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
                <User className="w-5 h-5 text-teal-500" />
                User Profile
              </h3>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow 
                label="Subject (User ID)" 
                value={idTokenPayload?.sub || user?.id || 'N/A'} 
                copyable 
              />
              <InfoRow 
                label="Email" 
                value={idTokenPayload?.email || user?.email || 'N/A'} 
                copyable 
              />
              <InfoRow 
                label="Preferred Username" 
                value={(idTokenPayload as unknown as Record<string, unknown>)?.['cognito:username'] as string || 'N/A'} 
              />
              <div className="flex items-start justify-between py-2 border-b border-[rgb(var(--border-secondary))]">
                <span className="text-sm text-[rgb(var(--text-tertiary))]">Email Verified</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  idTokenPayload?.email_verified 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                }`}>
                  {idTokenPayload?.email_verified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-[rgb(var(--text-tertiary))]">Authentication Status</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  authenticated 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                }`}>
                  {authenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Token Information Card */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
                <Shield className="w-5 h-5 text-teal-500" />
                Token Information
              </h3>
            </CardHeader>
            <CardContent className="space-y-1">
              <InfoRow label="Token Type" value="Bearer" />
              <InfoRow 
                label="Scope" 
                value={
                  (accessTokenDecoded?.payload?.scope as string) || 
                  'openid profile email'
                } 
              />
              <InfoRow 
                label="Tenant ID" 
                value={idTokenPayload?.['custom:tenantId'] as string || user?.tenantId || 'N/A'} 
                copyable 
              />
              <InfoRow 
                label="Tenant Name" 
                value={idTokenPayload?.['custom:tenantName'] as string || tenantName || 'N/A'} 
              />
              <InfoRow 
                label="Tenant Tier" 
                value={idTokenPayload?.['custom:tenantTier'] as string || tenantTier || 'N/A'} 
              />
              <InfoRow 
                label="User Role" 
                value={idTokenPayload?.['custom:userRole'] as string || user?.globalRole || 'N/A'} 
              />
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-[rgb(var(--text-tertiary))]">Expires At</span>
                <span className="text-sm font-mono text-[rgb(var(--text-primary))]">
                  {session?.expiresAt 
                    ? formatTimestamp(session.expiresAt / 1000) 
                    : idTokenPayload?.exp 
                      ? formatTimestamp(idTokenPayload.exp) 
                      : 'N/A'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Token Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ID Token Analysis */}
          {session?.idToken && (
            <TokenAnalysis
              title="ID Token Analysis"
              rawToken={session.idToken}
              decoded={idTokenDecoded}
            />
          )}

          {/* Access Token Analysis */}
          {session?.accessToken && (
            <TokenAnalysis
              title="Access Token Analysis"
              rawToken={session.accessToken}
              decoded={accessTokenDecoded}
            />
          )}
        </div>

        {/* Custom Claims Section */}
        {idTokenPayload && (
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
                <Clock className="w-5 h-5 text-teal-500" />
                All Token Claims
              </h3>
            </CardHeader>
            <CardContent>
              <JsonDisplay data={idTokenPayload as unknown as Record<string, unknown>} />
            </CardContent>
          </Card>
        )}

        {/* Auth Store State */}
        <Card>
          <CardHeader>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-[rgb(var(--text-primary))]">
              <CheckCircle2 className="w-5 h-5 text-teal-500" />
              Auth Store State
            </h3>
          </CardHeader>
          <CardContent>
            <JsonDisplay 
              data={{
                user: user,
                tenantName,
                tenantTier,
                isAuthenticated: authenticated,
              } as unknown as Record<string, unknown>} 
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

