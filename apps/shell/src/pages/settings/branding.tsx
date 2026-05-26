/**
 * Settings — Branding (Sprint M2 — Branding read).
 *
 * Read-only branding viewer at `/settings/branding`. Reads the active
 * school's branding via `useSchoolBranding` and renders it through
 * `BrandingDisplay`. Sprint M3 will add an "Edit" affordance that
 * toggles into a form mode.
 *
 * **Permission gate:** `usePermission('view', 'branding')`. The ABAC
 * grants in `packages/abac/src/permissions.ts` give TenantAdmin (via
 * globalRole) + Principal explicit `view` + `configure` rights;
 * everyone else hits the deny branch and is redirected to settings
 * overview (mirrors the pattern used by other restricted settings
 * pages — workspace, security-policies).
 *
 * **Loading + error states:** `isLoading || isPending` covers the
 * pre-school-context idle window the same way the M1.5-FU.1 fix on
 * the receipt page does. Error branch surfaces a generic retry UI
 * — M3 / future polish can differentiate 4xx/5xx (mirroring the
 * deferred FU.7.3 work) once we know which error classes operators
 * encounter most often in this surface.
 */

import { Loader2, AlertTriangle, ArrowLeft, Paintbrush } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { usePermission } from '@edforge/abac'
import { useSchoolBranding } from '@edforge/identity-services'
import { BrandingDisplay } from '../../components/branding/BrandingDisplay'
import { useActiveSchool } from '../../lib/shell-context'

export function BrandingSettingsPage() {
  const { t } = useTranslation('branding')
  const navigate = useNavigate()
  const { activeSchoolId, activeSchool } = useActiveSchool()
  const canView = usePermission('view', 'branding')

  const { data, isLoading, isPending, error, refetch } = useSchoolBranding(
    activeSchoolId ?? undefined,
  )

  // Permission gate — mirrors the workspace / security-policies pages.
  // TenantAdmin globalRole short-circuits in the engine to true.
  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
          {t('forbidden.title')}
        </h2>
        <p className="mt-1 text-sm text-[rgb(var(--text-secondary))] max-w-md mx-auto">
          {t('forbidden.description')}
        </p>
        <button
          type="button"
          onClick={() => navigate({ to: '/settings' })}
          className="mt-5 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
        >
          {t('forbidden.action')}
        </button>
      </div>
    )
  }

  // No school context — same shape as other school-scoped settings pages.
  if (!activeSchoolId) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-10 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('noActiveSchool')}
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/20">
            <Paintbrush className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              {t('page.title')}
            </h1>
            <p className="text-xs text-[rgb(var(--text-secondary))] mt-0.5">
              {activeSchool?.name
                ? t('page.subtitleForSchool', { schoolName: activeSchool.name })
                : t('page.subtitle')}
            </p>
          </div>
        </div>
        <Link
          to="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('page.backToSettings')}
        </Link>
      </header>

      {/* Body */}
      {isLoading || isPending ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : error || !data ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('error.failedToLoad')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors"
          >
            {t('error.retry')}
          </button>
        </div>
      ) : (
        <BrandingDisplay data={data} />
      )}
    </div>
  )
}

export default BrandingSettingsPage
