/**
 * Test Utilities
 *
 * Shared helpers for rendering components with providers
 * and Zod schema validation assertions.
 */

import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import type { ZodSchema, ZodError } from 'zod'

/**
 * Render a component with common providers (React Query, etc.).
 * Extend this as more providers are needed.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // For now, render directly. Extend with QueryClientProvider, ABACProvider, etc. as needed.
  return render(ui, { ...options })
}

/**
 * Assert that data passes a Zod schema.
 */
export function expectSchemaValid<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(
      `Expected schema to pass but got errors:\n${JSON.stringify(result.error.issues, null, 2)}`
    )
  }
  return result.data
}

/**
 * Assert that data fails a Zod schema, optionally at a specific path.
 */
export function expectSchemaInvalid(
  schema: ZodSchema,
  data: unknown,
  expectedPath?: string
): ZodError {
  const result = schema.safeParse(data)
  if (result.success) {
    throw new Error('Expected schema to fail but it passed')
  }
  if (expectedPath) {
    const paths = result.error.issues.map((i) => i.path.join('.'))
    if (!paths.includes(expectedPath)) {
      throw new Error(
        `Expected error at path "${expectedPath}" but got errors at: ${paths.join(', ')}`
      )
    }
  }
  return result.error
}

export { render } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
