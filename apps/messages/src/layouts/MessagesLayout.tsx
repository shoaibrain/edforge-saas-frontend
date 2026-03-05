/**
 * MessagesLayout
 *
 * Passthrough layout for the Messages module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 *
 * Includes school context sync (listens for Shell broadcast events).
 */

import { useEffect, useRef, type ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { onSchoolChange, getSchoolContext } from '@edforge/config/school-context-channel'
import { useAppStore } from '../stores/app.store'

export function MessagesLayout({ children }: { children: ReactNode }) {
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

    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}
