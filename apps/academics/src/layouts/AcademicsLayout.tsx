/**
 * AcademicsLayout
 *
 * Passthrough layout for the Academics module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 *
 * Includes:
 * - School context sync (listens for Shell broadcast events)
 * - Global guard that blocks ALL academic routes when the active school
 *   is in setup mode.
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { Card } from '@edforge/ui'
import { onSchoolChange, getSchoolContext } from '@edforge/config/school-context-channel'
import { useAppStore, useActiveSchoolStatus } from '../stores/app.store'

function SchoolSetupGate() {
  return (
    <div className="max-w-6xl mx-auto pt-16 pb-12">
      <Card className="p-8 border-border-secondary max-w-lg mx-auto text-center">
        <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 mb-4">
          <Settings className="w-7 h-7 text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-text-primary">
          School is in setup mode
        </h2>
        <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto">
          This school needs to be activated before academic operations are available.
          Go to Settings &rarr; Organization to complete setup and activate the school.
        </p>
      </Card>
    </div>
  )
}

export function AcademicsLayout({ children }: { children: ReactNode }) {
    const schoolStatus = useActiveSchoolStatus()
    const navigate = useNavigate()
    const prevSchoolRef = useRef<string | null>(null)

    // Sync school context from Shell broadcasts.
    // On mount, grab the current context synchronously (covers the case where
    // the Shell already broadcast before this MFE mounted).
    useEffect(() => {
      const { setActiveSchoolId, setActiveSchoolStatus } = useAppStore.getState()
      const initial = getSchoolContext()
      if (initial.schoolId) {
        setActiveSchoolId(initial.schoolId)
        setActiveSchoolStatus(initial.schoolStatus)
        prevSchoolRef.current = initial.schoolId
      }
      return onSchoolChange(({ schoolId, schoolStatus: status }) => {
        const prevId = prevSchoolRef.current
        prevSchoolRef.current = schoolId

        setActiveSchoolId(schoolId)
        setActiveSchoolStatus(status)

        // On school switch (not initial mount), redirect to module root
        // to prevent viewing stale entity data from the previous school
        if (prevId && prevId !== schoolId) {
          navigate({ to: '/' })
        }
      })
    }, [navigate])

    // Hard-gate: block all academic routes for schools in setup mode
    if (schoolStatus === 'setup') {
      return <SchoolSetupGate />
    }

    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}
