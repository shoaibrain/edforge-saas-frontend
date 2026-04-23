import { describe, it, expect, vi } from 'vitest'
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { DataTable } from '../DataTable'
import type { ColumnDef } from '@tanstack/react-table'

interface Row {
  id: string
  name: string
}

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
]

function rows(n: number): Row[] {
  return Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}`, name: `Row ${i + 1}` }))
}

describe('DataTable pagination — client-side', () => {
  it('enables Next on page 1 when data exceeds pageSize (40 rows / pageSize 20)', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(40)}
        pagination={{ pageSize: 20 }}
      />,
    )
    const nextBtn = getByText('Next') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(false)
    cleanup()
  })

  it('enables Prev on page 2', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(40)}
        pagination={{ pageSize: 20 }}
      />,
    )
    fireEvent.click(getByText('Next'))
    const prevBtn = getByText('Prev') as HTMLButtonElement
    expect(prevBtn.disabled).toBe(false)
    cleanup()
  })

  it('disables Next when data <= pageSize and no server pagination', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(15)}
        pagination={{ pageSize: 20 }}
      />,
    )
    const nextBtn = getByText('Next') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(true)
    cleanup()
  })
})

describe('DataTable pagination — server-side', () => {
  it('keeps Next enabled when loaded data fits one page but server reports hasMore=true', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          onLoadMore: () => {},
        }}
      />,
    )
    const nextBtn = getByText('Next') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(false)
    cleanup()
  })

  it('disables Next when client pages exhausted AND server hasMore=false', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: false,
          onLoadMore: () => {},
        }}
      />,
    )
    const nextBtn = getByText('Next') as HTMLButtonElement
    expect(nextBtn.disabled).toBe(true)
    cleanup()
  })

  it('calls onLoadMore when user presses Next past the last loaded page', () => {
    const onLoadMore = vi.fn()
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          onLoadMore,
        }}
      />,
    )
    fireEvent.click(getByText('Next'))
    expect(onLoadMore).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('does not call onLoadMore while a fetch is already in-flight', () => {
    const onLoadMore = vi.fn()
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          isFetching: true,
          onLoadMore,
        }}
      />,
    )
    const nextBtn = getByText(/Loading|Next/) as HTMLButtonElement
    // Button is disabled while isFetching — clicks are no-ops.
    expect(nextBtn.disabled).toBe(true)
    fireEvent.click(nextBtn)
    expect(onLoadMore).not.toHaveBeenCalled()
    cleanup()
  })

  it('auto-advances to the next client page after new server rows land', async () => {
    const onLoadMore = vi.fn()
    const { getByText, rerender, queryByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          isFetching: false,
          onLoadMore,
        }}
      />,
    )

    fireEvent.click(getByText('Next'))
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    rerender(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          isFetching: true,
          onLoadMore,
        }}
      />,
    )

    rerender(
      <DataTable<Row>
        columns={columns}
        data={rows(40)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          isFetching: false,
          onLoadMore,
        }}
      />,
    )

    await waitFor(() => {
      expect(queryByText(/Showing 21-40/)).not.toBeNull()
    })
    cleanup()
  })

  it('omits numbered page buttons when server pagination is active', () => {
    const { queryByText, getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          onLoadMore: () => {},
        }}
      />,
    )
    // Prev/Next still there
    expect(getByText('Prev')).toBeTruthy()
    expect(getByText('Next')).toBeTruthy()
    // No "1" numbered button
    expect(queryByText('1')).toBeNull()
    cleanup()
  })

  it('renders "Showing N+ results" when total is unknown and hasMore=true', () => {
    const { getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(20)}
        pagination={{ pageSize: 20 }}
        serverPagination={{
          hasMore: true,
          onLoadMore: () => {},
        }}
      />,
    )
    expect(getByText(/Showing 1-20 of 20\+ results/)).toBeTruthy()
    cleanup()
  })
})
