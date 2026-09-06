/**
 * Issue #356 — server pagination end to end, with the real cursor hook and
 * the real table, driven by real promises.
 *
 * The unit tests in `packages/ui` drive the table with `rerender`, which
 * resolves synchronously and never reproduces what the operator sees. This
 * harness fetches through `useFinancePaginatedQuery` so the page lands on a
 * later tick, the way it does in the browser.
 */
import { describe, it, expect } from 'vitest'
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFinancePaginatedQuery, buildServerPaginationProps } from '@edforge/finance-services'
import { TanstackDataTable } from '@edforge/ui'
import type { ColumnDef } from '@tanstack/react-table'

interface Row { id: string; name: string }

const columns: ColumnDef<Row, unknown>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
]

const PAGE = 50
const TOTAL = 150

function page(cursor?: string) {
  const start = cursor ? Number(cursor) : 0
  const items = Array.from({ length: Math.min(PAGE, TOTAL - start) }, (_, i) => ({
    id: `r${start + i + 1}`,
    name: `Row ${start + i + 1}`,
  }))
  const next = start + items.length
  return {
    items,
    hasMore: next < TOTAL,
    lastEvaluatedKey: next < TOTAL ? String(next) : undefined,
  }
}

function Harness() {
  const q = useFinancePaginatedQuery<Row>({
    queryKey: ['rows'],
    queryFn: async ({ cursor }) => {
      await Promise.resolve()
      return page(cursor)
    },
    limit: PAGE,
  })
  const { serverPagination, isFetching } = buildServerPaginationProps({
    hasMore: q.hasMore,
    loadMore: q.loadMore,
    isFetchingNextPage: q.isFetchingNextPage,
  })
  return (
    <TanstackDataTable<Row>
      columns={columns}
      data={q.items}
      getRowId={(r) => r.id}
      isFetching={isFetching}
      pagination={{ pageSize: 20 }}
      pageSizes={[10, 20, 50]}
      serverPagination={serverPagination}
    />
  )
}

function footer() {
  return document.body.textContent?.match(/Showing \d+-\d+ of \d+\+? results/)?.[0] ?? 'none'
}

async function clickNext() {
  const btn = [...document.querySelectorAll('button')].find((b) =>
    /^(Next|Loading)/.test(b.textContent?.trim() ?? ''),
  )
  fireEvent.click(btn!)
}

describe('#356 — server pagination keeps the operator moving forward', () => {
  it('never returns to page 1, and never steps over a row', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(footer()).toBe('Showing 1-20 of 50+ results'))

    await clickNext()
    await waitFor(() => expect(footer()).toBe('Showing 21-40 of 50+ results'))

    await clickNext()
    await waitFor(() => expect(footer()).toBe('Showing 41-50 of 50+ results'))

    // The boundary. Rows 41-50 were a short page; the second server page
    // fills it out, so the operator should now be looking at 41-60 — never
    // back at row 1, and never at 61-80 with 51-60 skipped.
    await clickNext()
    await waitFor(() => expect(footer()).toBe('Showing 41-60 of 100+ results'))

    cleanup()
  })
})
