import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RowDetailsPopover } from '../RowDetailsPopover'

describe('RowDetailsPopover', () => {
  it('labels the trigger "Add" with no details and "Edit" once a note exists', () => {
    const { rerender } = render(
      <RowDetailsPopover status={null} notes="" onNotesChange={vi.fn()} />,
    )
    expect(screen.getByLabelText('Add note or reason')).toBeInTheDocument()
    rerender(<RowDetailsPopover status={null} notes="late bus" onNotesChange={vi.fn()} />)
    expect(screen.getByLabelText('Edit note or reason')).toBeInTheDocument()
  })

  it('flags "reason needed" when absent/excused with no reason yet', () => {
    const { rerender } = render(
      <RowDetailsPopover status="absent" notes="" onNotesChange={vi.fn()} onExcuseTypeChange={vi.fn()} />,
    )
    expect(screen.getByTestId('needs-reason-dot')).toBeInTheDocument()
    // Reason chosen → no flag.
    rerender(
      <RowDetailsPopover status="absent" notes="" excuseType="medical" onNotesChange={vi.fn()} onExcuseTypeChange={vi.fn()} />,
    )
    expect(screen.queryByTestId('needs-reason-dot')).not.toBeInTheDocument()
    // Present → no reason concept at all.
    rerender(<RowDetailsPopover status="present" notes="" onNotesChange={vi.fn()} />)
    expect(screen.queryByTestId('needs-reason-dot')).not.toBeInTheDocument()
  })

  it('opens a note field always, and a reason field only for absent/excused', async () => {
    const { rerender } = render(
      <RowDetailsPopover status="present" notes="" onNotesChange={vi.fn()} />,
    )
    fireEvent.click(screen.getByLabelText('Add note or reason'))
    expect(await screen.findByText('Note')).toBeInTheDocument()
    expect(screen.queryByText('Reason')).not.toBeInTheDocument()

    rerender(<RowDetailsPopover status="excused" notes="" onNotesChange={vi.fn()} onExcuseTypeChange={vi.fn()} />)
    expect(await screen.findByText('Reason')).toBeInTheDocument()
  })

  it('forwards note edits to onNotesChange', async () => {
    const onNotesChange = vi.fn()
    render(<RowDetailsPopover status={null} notes="" onNotesChange={onNotesChange} />)
    fireEvent.click(screen.getByLabelText('Add note or reason'))
    const input = await screen.findByLabelText('Attendance note')
    fireEvent.change(input, { target: { value: 'parent called' } })
    expect(onNotesChange).toHaveBeenCalledWith('parent called')
  })
})
