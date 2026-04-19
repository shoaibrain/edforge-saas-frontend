import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { Icon } from '../components/Icon'
import { ICON_PATHS, type IconName } from '../components/icons/paths'

const NAMES = Object.keys(ICON_PATHS) as IconName[]

describe('Icon library', () => {
  it('exports 26 icon names', () => {
    expect(NAMES).toHaveLength(26)
  })

  it('renders every icon name without error', () => {
    for (const name of NAMES) {
      const { container, unmount } = render(<Icon name={name} />)
      const svg = container.querySelector('svg')
      expect(svg, `icon ${name} did not render an svg`).not.toBeNull()
      unmount()
    }
  })

  it('is decorative by default (aria-hidden="true", no role)', () => {
    const { container } = render(<Icon name="check" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('role')).toBeNull()
    cleanup()
  })

  it('becomes accessible when a title prop is provided', () => {
    const { getByRole } = render(<Icon name="check" title="Verified" />)
    const svg = getByRole('img', { name: 'Verified' })
    expect(svg.getAttribute('aria-hidden')).toBeNull()
    cleanup()
  })

  it('honors size and color props', () => {
    const { container } = render(<Icon name="check" size={48} color="#ff0000" />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
    expect(svg?.getAttribute('height')).toBe('48')
    expect(svg?.getAttribute('stroke')).toBe('#ff0000')
    cleanup()
  })
})
