/**
 * Finance Module Bootstrap
 *
 * Entry point for the Finance federated module.
 * Bootstraps the internal router with toast notification support.
 */

import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { router } from './router'

export function FinanceModule() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          className: 'font-sans',
        }}
      />
    </>
  )
}

export default FinanceModule
