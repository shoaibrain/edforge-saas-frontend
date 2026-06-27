import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StatusControl } from '../StatusControl'
import { LOCKED_OVERRIDE_STATUSES } from '../../attendanceStatus'

describe('StatusControl', () => {
  it('offers the full entry set with "Mark <Label>" aria-labels', () => {
    render(<StatusControl value={null} onChange={vi.fn()} expandTrigger="always" />)
    for (const label of ['Mark Present', 'Mark Absent', 'Mark Tardy', 'Mark Excused', 'Mark Remote']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
  })

  it('restricts a locked row to Tardy + Excused only', () => {
    render(<StatusControl value={null} onChange={vi.fn()} allowed={LOCKED_OVERRIDE_STATUSES} expandTrigger="always" />)
    expect(screen.getByLabelText('Mark Tardy')).toBeInTheDocument()
    expect(screen.getByLabelText('Mark Excused')).toBeInTheDocument()
    expect(screen.queryByLabelText('Mark Present')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mark Absent')).not.toBeInTheDocument()
  })

  it('calls onChange with the stored status value (Tardy → "late")', () => {
    const onChange = vi.fn()
    render(<StatusControl value={null} onChange={onChange} expandTrigger="always" />)
    fireEvent.click(screen.getByLabelText('Mark Tardy'))
    expect(onChange).toHaveBeenCalledWith('late')
  })

  it('marks the selected segment aria-checked', () => {
    render(<StatusControl value="present" onChange={vi.fn()} expandTrigger="always" />)
    expect(screen.getByLabelText('Mark Present')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Mark Absent')).toHaveAttribute('aria-checked', 'false')
  })

  it('moves focus across segments with ArrowRight/ArrowLeft (no row-key capture)', () => {
    render(<StatusControl value={null} onChange={vi.fn()} expandTrigger="always" />)
    const radios = screen.getAllByRole('radio')
    radios[0].focus()
    expect(radios[0]).toHaveFocus()
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' })
    expect(radios[1]).toHaveFocus()
    fireEvent.keyDown(radios[1], { key: 'ArrowLeft' })
    expect(radios[0]).toHaveFocus()
  })

  it('hover mode shows a resting pill for the current status', () => {
    render(<StatusControl value="present" onChange={vi.fn()} />)
    // Resting pill renders the full label (segments use the short glyph "P").
    expect(screen.getByText('Present')).toBeInTheDocument()
  })

  it('hover mode shows a "Mark" affordance when unmarked', () => {
    render(<StatusControl value={null} onChange={vi.fn()} />)
    expect(screen.getByText('Mark')).toBeInTheDocument()
  })
})
