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
import { toast } from 'sonner'
import { queryMatchesSchool } from './school-queries'

// Errors surface as a toast only when they belong to the school the user
// just switched to. The latch is independent of the live transition flag:
// queries retry with backoff and can fail well after the overlay's hard
// cap has cleared the flag, and the failure still deserves surfacing.
const TRANSITION_ERROR_WINDOW_MS = 30_000

let transitionErrorToast: { schoolId: string; startedAt: number; fired: boolean } | null = null

export function armSchoolTransitionErrorToast(schoolId: string): void {
  transitionErrorToast = { schoolId, startedAt: Date.now(), fired: false }
}

function maybeToastTransitionError(error: unknown, query: { queryKey: readonly unknown[] }): void {
  const latch = transitionErrorToast
  if (!latch || latch.fired) return
  if (Date.now() - latch.startedAt > TRANSITION_ERROR_WINDOW_MS) return
  // 404s are expected for schools without the resource yet (e.g. a `setup`
  // school has no configuration) — not a switch failure.
  const status = (error as { response?: { status?: number } })?.response?.status
  if (status === 404) return
  if (!queryMatchesSchool(latch.schoolId)(query)) return
  latch.fired = true
  toast.error('Some data failed to load after switching schools', {
    description: 'Refresh the page or switch schools again to retry.',
  })
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error('[React Query] Query error', {
        queryKey: query.queryKey,
        message: error.message,
        status: (error as any)?.response?.status,
      })
      maybeToastTransitionError(error, query)
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
