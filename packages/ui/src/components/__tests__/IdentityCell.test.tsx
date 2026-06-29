import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IdentityCell } from '../IdentityCell'

describe('IdentityCell', () => {
  it('renders the primary name', () => {
    render(<IdentityCell name="Pemba Sherpa" />)
    expect(screen.getByText('Pemba Sherpa')).toBeTruthy()
  })

  it('renders the secondary line when provided', () => {
    render(<IdentityCell name="Pemba Sherpa" secondary="pemba@school.np" />)
    expect(screen.getByText('pemba@school.np')).toBeTruthy()
  })

  it('omits the secondary line when undefined', () => {
    render(<IdentityCell name="Pemba Sherpa" />)
    // The secondary span is conditionally rendered — confirm no extra text under the name
    expect(screen.queryByText(/@school/)).toBeNull()
  })

  it('renders the fallback node when name is empty', () => {
    render(<IdentityCell name="" fallback={<span data-testid="uuid-badge">a1b2c3d4…</span>} />)
    expect(screen.getByTestId('uuid-badge')).toBeTruthy()
  })

  it('renders an em-dash as default fallback when name is empty and no custom fallback', () => {
    render(<IdentityCell name="   " />)
    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders the trailing slot next to the name', () => {
    render(
      <IdentityCell
        name="Pemba Sherpa"
        trailing={<span data-testid="status-pill">Active</span>}
      />,
    )
    expect(screen.getByTestId('status-pill')).toBeTruthy()
  })

  it('forwards avatarSrc through to the underlying img element', () => {
    render(
      <IdentityCell
        name="Pemba Sherpa"
        avatarSrc="data:image/svg+xml;base64,Zm9v"
      />,
    )
    const img = screen.getByRole('img') as HTMLImageElement
    expect(img.src).toContain('data:image/svg+xml;base64,Zm9v')
    expect(img.alt).toBe('Pemba Sherpa')
  })

  it('applies dimmed styling to the outer cluster', () => {
    const { container } = render(<IdentityCell name="Pemba Sherpa" dimmed />)
    const cluster = container.firstChild as HTMLElement
    expect(cluster.className).toContain('opacity-60')
  })
})
