/**
 * EdForge Shell - Entry Point
 *
 * The main host application that orchestrates all federated modules.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { configureAmplify } from '@edforge/auth'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { router } from './router'
import '@edforge/theme'
import './index.css'

// Initialize AWS Amplify for Cognito authentication
// This must be called before any auth operations
const amplifyConfigured = configureAmplify()
if (amplifyConfigured) {
  console.log('[EdForge] Amplify configured successfully')
} else {
  console.warn('[EdForge] Amplify not configured — authentication will not work')
}

// Query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
})

// Bootstrap the application
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Analytics />
      <SpeedInsights />
    </QueryClientProvider>
  </StrictMode>
)
