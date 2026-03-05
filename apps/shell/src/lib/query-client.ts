/**
 * Shared QueryClient instance.
 *
 * Extracted from main.tsx so it can be imported by non-React code
 * (e.g. Zustand store actions) while remaining the single instance
 * used by <QueryClientProvider> in the app root.
 *
 * All MFE modules share this same instance because @tanstack/react-query
 * is configured as singleton: true in the Module Federation shared config.
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})
