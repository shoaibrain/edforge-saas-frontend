import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Inline } from '../layout/Inline'

describe('Inline', () => {
  it('renders horizontal rhythm defaults', () => {
    const { getByText } = render(<Inline>Inline content</Inline>)
    const inline = getByText('Inline content')

    expect(inline.className).toContain('flex-row')
    expect(inline.className).toContain('gap-3')
    expect(inline.className).toContain('items-center')
  })

  it('supports gap, alignment, and justification variants', () => {
    const { getByText } = render(
      <Inline gap="lg" align="baseline" justify="between">
        Toolbar
      </Inline>
    )
    const inline = getByText('Toolbar')

    expect(inline.className).toContain('gap-4')
    expect(inline.className).toContain('items-baseline')
    expect(inline.className).toContain('justify-between')
  })
})
