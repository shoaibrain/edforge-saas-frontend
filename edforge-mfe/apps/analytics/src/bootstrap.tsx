/**
 * Analytics Module Bootstrap
 *
 * Entry point for the Analytics federated module.
 * Bootstraps the internal router.
 * 
 * Note: StrictMode is handled by the Shell.
 * MFE modules should not wrap in StrictMode.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function AnalyticsModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default AnalyticsModule

