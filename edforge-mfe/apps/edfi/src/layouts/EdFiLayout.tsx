/**
 * Ed-Fi Layout
 *
 * Minimal layout wrapper for the Ed-Fi module.
 * The Shell handles the main chrome (header, sidebar).
 */

import { ReactNode } from 'react'

interface EdFiLayoutProps {
  children: ReactNode
}

export function EdFiLayout({ children }: EdFiLayoutProps) {
  return (
    <div className="min-h-full">
      {children}
    </div>
  )
}

