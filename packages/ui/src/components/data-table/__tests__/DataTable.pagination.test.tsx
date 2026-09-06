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

  it('renders supplied labels for shared table chrome', () => {
    const { getByLabelText, getByPlaceholderText, getByText } = render(
      <DataTable<Row>
        columns={columns}
        data={rows(3)}
        pagination={{ pageSize: 2, pageSizeOptions: [2, 3] }}
        searchPlaceholder="विद्यार्थी खोज्नुहोस्"
        enableColumnVisibility
        enableDensityToggle
        exportOptions={{ filename: 'students' }}
        labels={{
          clearSearch: 'खोज खाली गर्नुहोस्',
          clearActiveFilters: (count) => `हटाउनुहोस् (${count})`,
          paginationShowing: (start, end, total) =>
            `${start}-${end} / ${total} नतिजा`,
          rowsPerPage: (size) => `${size} प्रति पृष्ठ`,
          previousPage: 'अघिल्लो',
          nextPage: 'अर्को',
          rowDensity: 'पङ्क्ति घनत्व',
          comfortableDensity: 'आरामदायी',
          comfortableDensityTitle: 'आरामदायी पङ्क्तिहरू',
          compactDensity: 'सघन',
          compactDensityTitle: 'सघन पङ्क्तिहरू',
          viewOptions: 'दृश्य',
          export: 'निर्यात',
        }}
      />,
    )

    expect(getByText('1-2 / 3 नतिजा')).toBeTruthy()
    expect(getByText('2 प्रति पृष्ठ')).toBeTruthy()
    expect(getByText('अघिल्लो')).toBeTruthy()
    expect(getByText('अर्को')).toBeTruthy()
    expect(getByText('दृश्य')).toBeTruthy()
    expect(getByText('निर्यात')).toBeTruthy()
    // Density is folded into the "View" menu — open it to reach the controls.
    fireEvent.click(getByText('दृश्य'))
    expect(getByLabelText('पङ्क्ति घनत्व')).toBeTruthy()
    expect(getByLabelText('आरामदायी')).toBeTruthy()

    fireEvent.change(getByPlaceholderText('विद्यार्थी खोज्नुहोस्'), {
      target: { value: 'Row 1' },
    })

    expect(getByLabelText('खोज खाली गर्नुहोस्')).toBeTruthy()
    expect(getByText('हटाउनुहोस् (1)')).toBeTruthy()
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

/**
 * Issue #356 — pressing Next at the end of the loaded rows must reveal the
 * next unseen row, not step over a block of them.
 *
 * The pre-existing auto-advance test above uses 20 rows at page size 20, so
 * the last loaded page is exactly full and a plain `nextPage()` happens to be
 * right. It stayed green while every short last page — the normal case, since
 * the 50-row server page does not divide by the 20-row client page — skipped
 * the rows that filled it out.
 */
describe('DataTable pagination — Next past the loaded rows skips nothing (#356)', () => {
  it('lands on the page holding the first unseen row, not one page further', async () => {
    const onLoadMore = vi.fn()
    const props = (data: Row[], isFetching: boolean) => ({
      columns,
      data,
      pagination: { pageSize: 20 },
      serverPagination: { hasMore: true, isFetching, onLoadMore },
    })

    const { getByText, rerender, queryByText } = render(
      <DataTable<Row> {...props(rows(50), false)} />,
    )

    // Walk to the third client page (41-50), the end of the loaded rows.
    fireEvent.click(getByText('Next'))
    expect(queryByText(/Showing 21-40 of 50\+/)).not.toBeNull()
    fireEvent.click(getByText('Next'))
    expect(queryByText(/Showing 41-50 of 50\+/)).not.toBeNull()

    // The boundary click asks the server for more.
    fireEvent.click(getByText('Next'))
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    rerender(<DataTable<Row> {...props(rows(50), true)} />)
    rerender(<DataTable<Row> {...props(rows(100), false)} />)

    // Rows 41-50 were the short last page; the newly loaded rows fill it out
    // to 41-60, so 51-60 are revealed without being stepped over.
    await waitFor(() => {
      expect(queryByText(/Showing 41-60 of 100\+/)).not.toBeNull()
    })
    // The regression this guards: advancing one page from a short page, which
    // lands on 61-80 and steps over rows 51-60.
    expect(queryByText(/Showing 61-80 of 100\+/)).toBeNull()
    cleanup()
  })

})
