/**
 * AcademicsLayout
 *
 * Passthrough layout for the Academics module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 *
 * Includes a global guard that blocks ALL academic routes when the
 * active school is in setup mode.
 */

import type { ReactNode } from 'react'
import { Settings } from 'lucide-react'
import { Card } from '@edforge/ui'
import { useActiveSchoolStatus } from '../stores/app.store'

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

    // Hard-gate: block all academic routes for schools in setup mode
    if (schoolStatus === 'setup') {
      return <SchoolSetupGate />
    }

    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}
