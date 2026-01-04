/**
 * MessagesLayout
 * 
 * Passthrough layout for the Messages module.
 * The Shell's AppShell handles all layout concerns (Header, Sidebar).
 * MFE modules should only render their content.
 */

import { ReactNode } from 'react'

export function MessagesLayout({ children }: { children: ReactNode }) {
    // Shell's AppShell provides the layout (Header + Sidebar)
    // This module just renders its content
    return <>{children}</>
}
