/**
 * Academics Module Bootstrap
 *
 * Entry point for the Academics federated module.
 * Bootstraps the internal router.
 *
 * Note: StrictMode and QueryClientProvider are handled by the Shell.
 * MFE modules should not wrap in their own providers.
 */

import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { router } from './router'

export function AcademicsModule() {
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

export default AcademicsModule
