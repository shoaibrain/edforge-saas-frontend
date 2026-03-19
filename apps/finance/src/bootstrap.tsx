/**
 * Finance Module Bootstrap
 *
 * Entry point for the Finance federated module.
 * Bootstraps the internal router with toast notification support.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function FinanceModule() {
  // Toaster is provided by the shell's RootLayout — no duplicate needed here
  return <RouterProvider router={router} />
}

export default FinanceModule
