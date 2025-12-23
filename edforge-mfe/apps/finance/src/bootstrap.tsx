/**
 * Finance Module Bootstrap
 *
 * Entry point for the Finance federated module.
 * Bootstraps the internal router.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function FinanceModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default FinanceModule
