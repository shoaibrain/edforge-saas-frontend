/**
 * Vitest Configuration
 *
 * Workspace-root vitest config for the EdForge frontend monorepo.
 * Supports TypeScript, React components, and path aliases.
 */

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],
    setupFiles: ['./test-utils/setup.ts'],
    css: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/shell/src'),
      '@edforge/ui': resolve(__dirname, 'packages/ui/src'),
      '@edforge/abac': resolve(__dirname, 'packages/abac/src'),
      '@edforge/types': resolve(__dirname, 'packages/types/src'),
      '@edforge/auth': resolve(__dirname, 'packages/auth/src'),
      '@edforge/forms': resolve(__dirname, 'packages/forms/src'),
      '@edforge/wizard': resolve(__dirname, 'packages/wizard/src'),
      '@edforge/theme': resolve(__dirname, 'packages/theme/src'),
    },
  },
})
