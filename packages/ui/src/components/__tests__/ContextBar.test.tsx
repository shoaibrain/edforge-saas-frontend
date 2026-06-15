import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContextBar, ContextBarSep, ContextBarYear } from '../layout/ContextBar'

describe('ContextBar', () => {
  it('renders meta content', () => {
    render(<ContextBar meta={<span>Saraswati Secondary School</span>} />)

    expect(screen.getByText('Saraswati Secondary School')).toBeTruthy()
  })

  it('renders optional description and actions', () => {
    render(
      <ContextBar
        meta={<span>Context</span>}
        description={<span>1,248 students enrolled</span>}
        actions={<button type="button">Enroll Student</button>}
      />
    )

    expect(screen.getByText('1,248 students enrolled')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Enroll Student' })).toBeTruthy()
  })

  it('composes meta with separators and the year pip', () => {
    render(
      <ContextBar
        meta={
          <>
            <span>School</span>
            <ContextBarSep />
            <ContextBarYear>AY 2082</ContextBarYear>
          </>
        }
      />
    )

    expect(screen.getByText('AY 2082')).toBeTruthy()
    expect(screen.getByText('·')).toBeTruthy()
  })
})
