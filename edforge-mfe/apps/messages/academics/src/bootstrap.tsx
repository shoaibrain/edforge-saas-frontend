/**
 * Academics Module Bootstrap
 *
 * Entry point for the Academics federated module.
 * Bootstraps the internal router.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
// import { ShellProvider } from '@edforge/shell/state' // Assuming consumer provides context, or we use a shared package

export function AcademicsModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default AcademicsModule
