/**
 * Protected Root Index
 * 
 * Redirects to /home as the main entry point
 */

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/')({
  beforeLoad: () => {
    throw redirect({ to: '/home' })
  },
  component: () => null,
})
