/**
 * MSW Server Setup
 *
 * Configures the MSW server for Node.js (Vitest) test environment.
 * Import and use in test-utils/setup.ts for global API mocking.
 *
 * Per-test overrides:
 *   import { server } from '../mocks/server'
 *   server.use(http.get('/api/...', () => HttpResponse.json({ ... })))
 */

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
