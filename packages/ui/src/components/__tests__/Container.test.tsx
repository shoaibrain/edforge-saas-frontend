import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Container } from '../layout/Container'

describe('Container', () => {
  it('renders children with default layout classes', () => {
    const { getByText } = render(<Container>Page content</Container>)
    const container = getByText('Page content')

    expect(container.className).toContain('max-w-6xl')
    expect(container.className).toContain('mx-auto')
  })

  it('supports size and padding variants', () => {
    const { getByText } = render(
      <Container size="narrow" padding="lg">
        Narrow content
      </Container>
    )
    const container = getByText('Narrow content')

    expect(container.className).toContain('max-w-3xl')
    expect(container.className).toContain('lg:px-8')
  })
})
