import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Text } from '../typography/Text'

describe('Text', () => {
  it('renders body copy as a paragraph by default', () => {
    const { getByText } = render(<Text>Readable body</Text>)
    const text = getByText('Readable body')

    expect(text.tagName).toBe('P')
    expect(text.className).toContain('text-sm')
  })

  it('supports semantic variants, weights, and alternate elements', () => {
    const { getByText } = render(
      <Text as="span" variant="label" weight="semibold">
        Status
      </Text>
    )
    const text = getByText('Status')

    expect(text.tagName).toBe('SPAN')
    expect(text.className).toContain('uppercase')
    expect(text.className).toContain('font-semibold')
  })
})
