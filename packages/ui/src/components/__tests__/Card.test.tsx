import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from '../Card'

describe('Card', () => {
  it('renders static content', () => {
    const { getByText } = render(<Card>Section content</Card>)
    expect(getByText('Section content')).toBeTruthy()
  })

  it('supports keyboard activation when used as an interactive card', async () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <Card role="button" onClick={onClick}>
        Open details
      </Card>
    )

    getByRole('button', { name: 'Open details' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')

    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
