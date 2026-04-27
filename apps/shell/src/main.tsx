/**
 * EdForge Shell - Entry Point
 *
 * The main host application that orchestrates all federated modules.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { configureAmplify } from '@edforge/auth'
import { initI18n } from '@edforge/i18n'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { installChunkErrorHandlers } from './lib/chunk-error-handler'
import { router } from './router'
import { queryClient } from './lib/query-client'
import '@edforge/theme'
import './index.css'

// Initialize i18n for internationalization (must be before React render)
initI18n()

// Install global chunk load error handlers (stale deployment recovery)
installChunkErrorHandlers()

// Initialize AWS Amplify for Cognito authentication
// This must be called before any auth operations
const amplifyConfigured = configureAmplify()
if (amplifyConfigured) {
  console.log('[EdForge] Amplify configured successfully')
} else {
  console.warn('[EdForge] Amplify not configured — authentication will not work')
}

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
