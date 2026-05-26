import { defineConfig } from 'vitest/config'
import path from 'node:path'

/**
 * Vitest config for the Finance MFE.
 *
 * Sprint M0.1 of the PDF service MFE integration plan
 * (`docs/pilot-greenlight/pdf-service-mfe-integration-plan.md` §2).
 * Unblocks component-test coverage for M1.2 / M1.4 / M1.5 / M1.6 etc.
 *
 * The `css.postcss` override matters:
 * - This workspace ships a `postcss.config.ts` (Tailwind + autoprefixer).
 * - Vitest pulls in Vite which auto-discovers `postcss.config.ts`. Vite's
 *   discovery path uses CJS `require()` while the workspace declares
 *   `"type": "module"` — Node throws `ERR_REQUIRE_ESM` and the test
 *   process crashes before a single spec runs.
 * - `css.postcss: { plugins: [] }` inlines an empty PostCSS config so
 *   Vite never tries to load the `.ts` config file. Tests don't need
 *   Tailwind processing — they assert structure + behavior, not styles.
 *
 * happy-dom over jsdom: M0.1 ticket text says jsdom but `apps/analytics`
 * already declares happy-dom; consistency + faster startup. Both
 * environments work with `@testing-library/react`.
 */
export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist'],
  },
  css: {
    postcss: { plugins: [] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
