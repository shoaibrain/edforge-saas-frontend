/**
 * PeopleLayout
 *
 * Passthrough layout for the People module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 *
 * Includes school context sync (listens for Shell broadcast events).
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { onSchoolChange, getSchoolContext } from '@edforge/config/school-context-channel'
import { useAppStore } from '../stores/app.store'

export function PeopleLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslation('people')
    const navigate = useNavigate()
    const prevSchoolRef = useRef<string | null>(null)

    // Sync school context from Shell broadcasts.
    // On mount, grab the current context synchronously in case the Shell
    // already broadcast before this MFE mounted.
    useEffect(() => {
      const { setActiveSchoolId } = useAppStore.getState()
      const initial = getSchoolContext()
      if (initial.schoolId) {
        setActiveSchoolId(initial.schoolId)
        prevSchoolRef.current = initial.schoolId
      }
      return onSchoolChange(({ schoolId }) => {
        const prevId = prevSchoolRef.current
        prevSchoolRef.current = schoolId

        setActiveSchoolId(schoolId)

        // On school switch (not initial mount), redirect to module root
        if (prevId && prevId !== schoolId) {
          navigate({ to: '/' })
        }
      })
    }, [navigate])

    // Check if a school is available
    const { activeSchoolId } = useAppStore()
    const schoolContext = getSchoolContext()
    const hasSchool = activeSchoolId || schoolContext.schoolId

    if (!hasSchool) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-6">
          <div className="w-full max-w-md bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-xl shadow-sm p-8 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-[rgb(var(--state-info-bg)/0.18)] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-[rgb(var(--state-info-fg))]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                {t('layout.noSchool.title')}
              </h2>
              <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
                {t('layout.noSchool.description')}
              </p>
            </div>
            <button
              onClick={() => { window.location.href = '/settings' }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
            >
              {t('layout.noSchool.action')}
            </button>
          </div>
        </div>
      )
    }

    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}
