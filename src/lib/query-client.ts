/**
 * TanStack Query Client Configuration
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes - data is fresh for this duration
      staleTime: 5 * 60 * 1000,

      // Garbage collection time: 30 minutes
      gcTime: 30 * 60 * 1000,

      // Retry failed requests up to 3 times
      retry: 3,

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect by default (can enable per-query)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
})

export default queryClient

