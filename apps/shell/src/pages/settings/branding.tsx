/**
 * Settings — Branding (Sprint M2 — read; Sprint M3 phase 1 — write).
 *
 * Read viewer + edit form at `/settings/branding`. Edit affordance is
 * gated on `usePermission('configure', 'branding')` — non-configurable
 * users (e.g., a TenantAdmin viewing a different school they don't have
 * configure on — rare in practice with globalRole; Principals at
 * another school) see the Display only, no Edit button.
 *
 * **Mode swap shape:** local `isEditing` state. The form's `onCancel`
 * is wired through `useFormDirtyGuard` inside `BrandingForm`, so an
 * accidental cancel with unsaved changes prompts before mode-swap.
 * `onSaved` fires after a successful PATCH (and after the mutation's
 * onSuccess has already eager-written the response to the query cache),
 * so the swap-back to Display renders the new branding instantly with
 * no spinner gap.
 *
 * **Permission gates:**
 *   - `canView`: gates the entire page (forbidden UI below). Also gates
 *     the `useSchoolBranding` hook arg so non-viewers never trigger a
 *     network round-trip that would 403.
 *   - `canConfigure`: gates the Edit button. Backend re-checks via
 *     `@RequirePermission('configure')` on the PATCH; this is just UX.
 *
 * **Loading + error states:** `isLoading || isPending` covers the
 * pre-school-context idle window the same way the M1.5-FU.1 fix on
 * the receipt page does. Error branch surfaces a generic retry UI
 * — M3 / future polish can differentiate 4xx/5xx (mirroring the
 * deferred FU.7.3 work) once we know which error classes operators
 * encounter most often in this surface.
 */

import { useState } from 'react'
import { Loader2, AlertTriangle, ArrowLeft, Paintbrush, Pencil } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@edforge/i18n'
import { usePermission } from '@edforge/abac'
import { useSchoolBranding } from '@edforge/identity-services'
import { BrandingDisplay } from '../../components/branding/BrandingDisplay'
import { BrandingForm } from '../../components/branding/BrandingForm'
import { useActiveSchool } from '../../lib/shell-context'

export function BrandingSettingsPage() {
  const { t } = useTranslation('branding')
  const navigate = useNavigate()
  const { activeSchoolId, activeSchool } = useActiveSchool()
  const canView = usePermission('view', 'branding')
  const canConfigure = usePermission('configure', 'branding')
  const [isEditing, setIsEditing] = useState(false)

  // PR #88 review-fix — gate the hook's schoolId arg on `canView` so
  // non-privileged users never trigger a network request that would
  // 403 anyway. `useSchoolBranding` keeps the underlying React Query
  // idle when schoolId is falsy (see `enabled: !!schoolId` in the hook).
  // The forbidden-state UI below renders without ever firing the fetch.
  const { data, isLoading, isPending, error, refetch } = useSchoolBranding(
    canView ? activeSchoolId ?? undefined : undefined,
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
          className="mt-5 px-4 py-2 rounded-lg text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
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
          <div className="p-2 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] ">
            <Paintbrush className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] " />
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
        <div className="flex items-center gap-3">
          {/*
            Edit affordance — only when (a) we have data loaded
            (an empty-state can also be edited to first-time-configure
            branding, so `!error && !!data` suffices), (b) the user is
            not currently editing, and (c) ABAC grants configure.
          */}
          {canConfigure && !isEditing && !error && data && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              {t('actions.edit')}
            </button>
          )}
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('page.backToSettings')}
          </Link>
        </div>
      </header>

      {/* Body */}
      {isLoading || isPending ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] animate-spin" />
        </div>
      ) : error || !data ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--state-danger-fg))]" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('error.failedToLoad')}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            {t('error.retry')}
          </button>
        </div>
      ) : isEditing ? (
        <BrandingForm
          schoolId={activeSchoolId}
          data={data}
          onCancel={() => setIsEditing(false)}
          onSaved={() => setIsEditing(false)}
        />
      ) : (
        <BrandingDisplay data={data} />
      )}
    </div>
  )
}

export default BrandingSettingsPage
