import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { IdentityCell } from '../IdentityCell'

describe('IdentityCell', () => {
  it('renders name, student number (mono) and grade', () => {
    const { container } = render(
      <IdentityCell studentId="s-1" studentName="Aahil Ansari" studentNumber="DPPSW-2026-00016" gradeLevel="Gr 5" />,
    )
    expect(screen.getByText('Aahil Ansari')).toBeInTheDocument()
    const number = screen.getByText('DPPSW-2026-00016')
    expect(number).toHaveClass('font-mono')
    expect(container.textContent).toContain('Gr 5')
  })

  it('disambiguates look-alike names via distinct avatar seeds (studentId)', () => {
    render(
      <div>
        <IdentityCell studentId="s-aaa" studentName="Aashiya Khatun" />
        <IdentityCell studentId="s-bbb" studentName="Aashiya Khatun" />
      </div>,
    )
    const imgs = screen.getAllByRole('img') as HTMLImageElement[]
    expect(imgs).toHaveLength(2)
    // Same display name, different student ids → different DiceBear data URIs.
    expect(imgs[0].getAttribute('src')).not.toEqual(imgs[1].getAttribute('src'))
  })

  it('recedes when dimmed (locked-elsewhere)', () => {
    const { container } = render(
      <IdentityCell studentId="s-1" studentName="Aafrin Khatun" dimmed />,
    )
    expect(container.firstElementChild).toHaveClass('opacity-60')
  })
})
