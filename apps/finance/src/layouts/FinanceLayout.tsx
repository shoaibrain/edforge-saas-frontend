/**
 * FinanceLayout
 *
 * Layout wrapper for the Finance module.
 * Includes a React Error Boundary so that rendering failures in any
 * child route are caught gracefully instead of white-screening the app.
 *
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 */

import { Component, createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { AlertTriangle, RotateCw, Home, Building2 } from 'lucide-react'
import { onSchoolChange, getSchoolContext } from '@edforge/config/school-context-channel'
import type { ResolvedSettings } from '@edforge/config/resolved-settings'
import { SYSTEM_DEFAULTS } from '@edforge/config/resolved-settings'
import { apiGet } from '@edforge/api-client'
import { useAppStore } from '../stores/app.store'

// ============================================================================
// FINANCE SETTINGS CONTEXT
// ============================================================================

const FinanceSettingsContext = createContext<ResolvedSettings>(SYSTEM_DEFAULTS)

export function useFinanceSettings(): ResolvedSettings {
  return useContext(FinanceSettingsContext)
}

// ============================================================================
// ERROR BOUNDARY (must be a class component)
// ============================================================================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryCopy {
  title: string
  description: string
  reload: string
  overview: string
}

class FinanceErrorBoundary extends Component<
  { children: ReactNode; copy: ErrorBoundaryCopy },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; copy: ErrorBoundaryCopy }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[FinanceErrorBoundary] Uncaught rendering error:', error)
    console.error('[FinanceErrorBoundary] Component stack:', info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoToOverview = () => {
    window.location.href = '/finance'
  }

  render() {
    if (this.state.hasError) {
      const copy = this.props.copy
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="w-full max-w-md bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)]  flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {copy.title}
              </h2>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                {copy.description}
              </p>
            </div>

            {this.state.error && (
              <p className="text-xs text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-secondary))] rounded-lg px-3 py-2 font-mono break-all">
                {this.state.error.message}
              </p>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
              >
                <RotateCw className="w-4 h-4" />
                {copy.reload}
              </button>
              <button
                onClick={this.handleGoToOverview}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-secondary))] transition-colors"
              >
                <Home className="w-4 h-4" />
                {copy.overview}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// LAYOUT
// ============================================================================

export function FinanceLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const prevSchoolRef = useRef<string | null>(null)
  const [settings, setSettings] = useState<ResolvedSettings>(() => {
    const initial = getSchoolContext()
    if (initial.resolvedSettings) {
      return initial.resolvedSettings
    }
    return SYSTEM_DEFAULTS
  })

  // Sync school context and resolved settings from Shell broadcasts.
  // Falls back to direct API fetch if broadcast hasn't arrived within 500ms.
  useEffect(() => {
    const { setActiveSchoolId } = useAppStore.getState()
    const initial = getSchoolContext()
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null

    if (initial.schoolId) {
      setActiveSchoolId(initial.schoolId)
      prevSchoolRef.current = initial.schoolId
    }
    if (initial.resolvedSettings) {
      setSettings(initial.resolvedSettings)
    } else {
      // Shell broadcast hasn't arrived yet. After 500ms, fetch workspace
      // settings directly via the read-only /tenants/my/settings endpoint
      // (no tenantId needed in URL — derived from JWT by the backend).
      fallbackTimer = setTimeout(async () => {
        try {
          const ws = await apiGet<{
            regional?: {
              defaultCurrency?: string
              defaultTimezone?: string
              defaultDateFormat?: string
              defaultTimeFormat?: '12h' | '24h'
              defaultCalendarSystem?: 'gregorian' | 'bikram_sambat'
              enableDualDateDisplay?: boolean
              defaultNumberFormat?: 'south_asian' | 'international'
              defaultLocale?: string
              defaultWeekStartsOn?: 'sunday' | 'monday'
            }
          }>('/tenants/my/settings')
          if (ws?.regional) {
            const r = ws.regional
            const resolved: ResolvedSettings = {
              currency: r.defaultCurrency || SYSTEM_DEFAULTS.currency,
              timezone: r.defaultTimezone || SYSTEM_DEFAULTS.timezone,
              dateFormat: r.defaultDateFormat || SYSTEM_DEFAULTS.dateFormat,
              timeFormat: r.defaultTimeFormat || SYSTEM_DEFAULTS.timeFormat,
              calendarSystem: r.defaultCalendarSystem || SYSTEM_DEFAULTS.calendarSystem,
              enableDualDateDisplay: r.enableDualDateDisplay ?? SYSTEM_DEFAULTS.enableDualDateDisplay,
              numberFormat: r.defaultNumberFormat || SYSTEM_DEFAULTS.numberFormat,
              locale: r.defaultLocale || SYSTEM_DEFAULTS.locale,
              weekStartsOn: r.defaultWeekStartsOn || SYSTEM_DEFAULTS.weekStartsOn,
            }
            setSettings(resolved)
          }
        } catch {
          // Fallback silently to SYSTEM_DEFAULTS
        } finally {
          // settings state updated or kept at SYSTEM_DEFAULTS
        }
      }, 500)
    }

    const unsubscribe = onSchoolChange(({ schoolId, resolvedSettings }) => {
      const prevId = prevSchoolRef.current
      prevSchoolRef.current = schoolId

      setActiveSchoolId(schoolId)

      if (resolvedSettings) {
        setSettings(resolvedSettings)
        if (fallbackTimer) {
          clearTimeout(fallbackTimer)
          fallbackTimer = null
        }
      }

      // On school switch (not initial mount), redirect to module root
      if (prevId && prevId !== schoolId) {
        navigate({ to: '/' })
      }
    })

    return () => {
      unsubscribe()
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [navigate])

  // Check if a school is available — no school means tenant hasn't set up org yet
  const { activeSchoolId } = useAppStore()
  const schoolContext = getSchoolContext()
  const hasSchool = activeSchoolId || schoolContext.schoolId

  if (!hasSchool) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="w-full max-w-md bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-sm p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[rgb(var(--state-info-bg)/0.18)]  flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] " />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('financeLayout.noSchools.title')}
            </h2>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              {t('financeLayout.noSchools.description')}
            </p>
          </div>
          <button
            onClick={() => { window.location.href = '/settings' }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            {t('financeLayout.noSchools.goToSettings')}
          </button>
        </div>
      </div>
    )
  }

  // Shell's AppShell provides the layout (Header + Sidebar)
  // This module just renders its content, wrapped in an error boundary
  return (
    <FinanceSettingsContext.Provider value={settings}>
      <FinanceErrorBoundary
        copy={{
          title: t('financeLayout.error.title'),
          description: t('financeLayout.error.description'),
          reload: t('financeLayout.error.reload'),
          overview: t('financeLayout.error.overview'),
        }}
      >
        {children}
      </FinanceErrorBoundary>
    </FinanceSettingsContext.Provider>
  )
}
