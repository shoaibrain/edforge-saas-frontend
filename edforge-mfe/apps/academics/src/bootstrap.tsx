/**
 * Academics Module Bootstrap
 *
 * Entry point for the Academics federated module.
 * Bootstraps the internal router.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function AcademicsModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default AcademicsModule
