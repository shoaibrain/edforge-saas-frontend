import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { SectionErrorBoundary } from '../components/SectionErrorBoundary'

function ExplodingSection(): never {
  throw new Error('boom')
}

describe('SectionErrorBoundary', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    cleanup()
    consoleSpy.mockRestore()
  })

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <SectionErrorBoundary sectionName="Test">
        <div>healthy child</div>
      </SectionErrorBoundary>
    )
    expect(getByText('healthy child')).toBeInTheDocument()
  })

  it('catches child errors and logs to console with the section name', () => {
    render(
      <SectionErrorBoundary sectionName="ExplodingOne">
        <ExplodingSection />
      </SectionErrorBoundary>
    )
    const firstCall = consoleSpy.mock.calls[0]?.[0] as string | undefined
    expect(firstCall).toMatch(/ExplodingOne/)
  })

  it('does NOT rethrow — subsequent siblings render unaffected', () => {
    const { getByText } = render(
      <>
        <SectionErrorBoundary sectionName="Broken">
          <ExplodingSection />
        </SectionErrorBoundary>
        <SectionErrorBoundary sectionName="Healthy">
          <div>still here</div>
        </SectionErrorBoundary>
      </>
    )
    expect(getByText('still here')).toBeInTheDocument()
  })

  it('renders a dev fallback with role=alert containing the section name', () => {
    const { getByRole, getByText } = render(
      <SectionErrorBoundary sectionName="Hero">
        <ExplodingSection />
      </SectionErrorBoundary>
    )
    // import.meta.env.DEV is true during vitest runs → dev fallback shows
    expect(getByRole('alert')).toBeInTheDocument()
    expect(getByText(/Hero/)).toBeInTheDocument()
  })
})
