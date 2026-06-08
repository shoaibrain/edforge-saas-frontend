import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Stack } from '../layout/Stack'

describe('Stack', () => {
  it('renders vertical rhythm defaults', () => {
    const { getByText } = render(<Stack>Stack content</Stack>)
    const stack = getByText('Stack content')

    expect(stack.className).toContain('flex')
    expect(stack.className).toContain('flex-col')
    expect(stack.className).toContain('gap-4')
  })

  it('supports spacing and alignment variants', () => {
    const { getByText } = render(
      <Stack space="xl" align="center">
        Centered stack
      </Stack>
    )
    const stack = getByText('Centered stack')

    expect(stack.className).toContain('gap-8')
    expect(stack.className).toContain('items-center')
  })
})
