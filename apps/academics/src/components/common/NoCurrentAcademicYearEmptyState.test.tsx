/// <reference types="@testing-library/jest-dom" />
/**
 * NoCurrentAcademicYearEmptyState — component tests
 *
 * Covers the contract that downstream tabs depend on: default copy is
 * always rendered, the variant prop toggles the visual treatment, and the
 * optional action link only renders when both `actionHref` and `actionLabel`
 * are supplied.
 */

import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { NoCurrentAcademicYearEmptyState } from './NoCurrentAcademicYearEmptyState'

afterEach(() => {
  cleanup()
})

describe('NoCurrentAcademicYearEmptyState', () => {
  it('renders the default headline and body copy when no props provided', () => {
    const { getByText } = render(<NoCurrentAcademicYearEmptyState />)
    expect(getByText('No Academic Year Configured')).toBeInTheDocument()
    expect(
      getByText('Set up an academic year in school settings before recording grades.')
    ).toBeInTheDocument()
  })

  it('renders custom message and secondaryMessage when supplied', () => {
    const { getByText } = render(
      <NoCurrentAcademicYearEmptyState
        message="Custom headline"
        secondaryMessage="Custom body copy."
      />
    )
    expect(getByText('Custom headline')).toBeInTheDocument()
    expect(getByText('Custom body copy.')).toBeInTheDocument()
  })

  it('renders an action link only when both actionHref and actionLabel are supplied', () => {
    const { getByText, queryByText, rerender } = render(
      <NoCurrentAcademicYearEmptyState
        actionHref="/settings/organization/schools/abc?tab=academic-setup"
        actionLabel="Configure Academic Year"
      />
    )
    const link = getByText('Configure Academic Year')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe(
      '/settings/organization/schools/abc?tab=academic-setup'
    )

    // Only actionHref → no link.
    rerender(<NoCurrentAcademicYearEmptyState actionHref="/foo" />)
    expect(queryByText('Configure Academic Year')).toBeNull()

    // Only actionLabel → no link.
    rerender(<NoCurrentAcademicYearEmptyState actionLabel="Configure Academic Year" />)
    expect(queryByText('Configure Academic Year')).toBeNull()
  })

  it('applies the prominent variant by default', () => {
    const { container } = render(<NoCurrentAcademicYearEmptyState />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('bg-caramel-50/40')
  })

  it('applies the subtle variant when variant="subtle"', () => {
    const { container } = render(<NoCurrentAcademicYearEmptyState variant="subtle" />)
    const root = container.firstChild as HTMLElement
    expect(root.className).toContain('bg-surface-secondary')
    expect(root.className).not.toContain('bg-caramel-50/40')
  })

  it('exposes a polite live region for screen readers', () => {
    const { container } = render(<NoCurrentAcademicYearEmptyState />)
    const root = container.firstChild as HTMLElement
    expect(root.getAttribute('role')).toBe('status')
    expect(root.getAttribute('aria-live')).toBe('polite')
  })
})
