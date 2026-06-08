import { describe, it, expect, vi } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tag } from '../Tag'

describe('Tag', () => {
  it('renders its children as a span', () => {
    const { getByText } = render(<Tag>Live</Tag>)
    const tag = getByText('Live')
    expect(tag.tagName).toBe('SPAN')
    cleanup()
  })

  it.each(['primary', 'teal', 'green', 'blue', 'ink'] as const)(
    'renders variant %s',
    (variant) => {
      const { container, unmount } = render(<Tag variant={variant}>{variant}</Tag>)
      expect(container.firstChild).toBeTruthy()
      unmount()
    }
  )

  it('renders a decorative dot when dot prop is true', () => {
    const { container } = render(
      <Tag variant="green" dot>
        Online
      </Tag>
    )
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).not.toBeNull()
    cleanup()
  })

  it('does not render a dot by default', () => {
    const { container } = render(<Tag variant="ink">Static</Tag>)
    const dot = container.querySelector('[aria-hidden="true"]')
    expect(dot).toBeNull()
    cleanup()
  })

  it('supports keyboard activation when used as a button', async () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      <Tag role="button" onClick={onClick}>
        Filter
      </Tag>
    )

    getByRole('button', { name: 'Filter' }).focus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')

    expect(onClick).toHaveBeenCalledTimes(2)
    cleanup()
  })
})
