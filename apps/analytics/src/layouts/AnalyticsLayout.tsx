/**
 * AnalyticsLayout
 * 
 * Passthrough layout for the Analytics module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 */

import type { ReactNode } from 'react'

export function AnalyticsLayout({ children }: { children: ReactNode }) {
    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}

