/**
 * Special Programs Module Bootstrap
 *
 * Entry point for the Special Programs federated module.
 * Bootstraps the internal router.
 * 
 * Note: StrictMode is handled by the Shell.
 * MFE modules should not wrap in StrictMode.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function SpecialProgramsModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default SpecialProgramsModule
