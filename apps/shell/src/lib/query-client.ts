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

import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[React Query] Query error', {
        queryKey: query.queryKey,
        message: error.message,
        status: (error as any)?.response?.status,
      })
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      console.error('[React Query] Mutation error', {
        mutationKey: mutation.options.mutationKey,
        message: error.message,
        status: (error as any)?.response?.status,
      })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})
