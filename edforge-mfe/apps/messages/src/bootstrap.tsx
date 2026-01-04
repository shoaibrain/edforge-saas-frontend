/**
 * Messages Module Bootstrap
 *
 * Entry point for the Messages federated module.
 * Bootstraps the internal router.
 * 
 * Note: StrictMode is handled by the Shell.
 * MFE modules should not wrap in StrictMode.
 */

import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

export function MessagesModule() {
  return (
    <RouterProvider router={router} />
  )
}

export default MessagesModule
