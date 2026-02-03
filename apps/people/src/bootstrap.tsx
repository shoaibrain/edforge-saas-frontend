/**
 * People Module Bootstrap
 *
 * Entry point for the People federated module.
 * Bootstraps the internal router.
 * 
 * Note: StrictMode is handled by the Shell.
 * MFE modules should not wrap in StrictMode.
 */

import { RouterProvider } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import { router } from './router'

export function PeopleModule() {
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

export default PeopleModule
