import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Heading } from '../typography/Heading'

describe('Heading', () => {
  it('renders the requested heading level', () => {
    const { getByRole } = render(<Heading level={1}>Dashboard</Heading>)
    expect(getByRole('heading', { level: 1 }).textContent).toBe('Dashboard')
  })

  it('applies the requested type variant', () => {
    const { getByRole } = render(
      <Heading level={2} variant="page">
        People
      </Heading>
    )
    expect(getByRole('heading', { level: 2 }).className).toContain('text-2xl')
  })
})
