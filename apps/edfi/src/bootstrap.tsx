/**
 * Ed-Fi Module Bootstrap
 *
 * Entry point for the Ed-Fi federated module.
 * Bootstraps the internal router for route-based navigation.
 * Navigation is handled by the Shell sidebar - no duplicate tabs.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function EdFiModule() {
  return <RouterProvider router={router} />
}

export default EdFiModule
