import { describe, it, expect } from 'vitest'
import type { FinanceJobRow } from '@edforge/finance-services'
import {
  buildExportManifest,
  bundleNameFor,
  estimateBundle,
  failedIdsOf,
  fileNameFor,
  formatBytes,
  outputUrlFor,
  willBeSkipped,
  type ExportRowSummary,
} from '../export-manifest'

const row = (overrides: Partial<ExportRowSummary>): ExportRowSummary => ({
  id: 'id-1',
  number: 'INV-1',
  status: 'issued',
  amount: 1000,
  ...overrides,
})

function makeJob(overrides: Partial<FinanceJobRow>): FinanceJobRow {
  return {
    jobId: 'job-1234abcd',
    schoolId: 'sch-1',
    jobType: 'bulk_invoice_pdf_export',
    status: 'succeeded',
    counters: { requested: 3, succeeded: 3, failed: 0, skipped: 0 },
    createdAt: '2026-07-02T10:00:00Z',
    updatedAt: '2026-07-02T10:01:00Z',
    ...overrides,
  }
}

describe('buildExportManifest', () => {
  const rows: ExportRowSummary[] = [
    row({ id: 'a', number: 'INV-1', studentName: 'Aakriti Sah', status: 'issued', amount: 1000, gradeLevel: '4' }),
    row({ id: 'b', number: 'INV-2', studentName: 'Aakriti Sah', status: 'overdue', amount: 2000, gradeLevel: '4' }),
    row({ id: 'c', number: 'INV-3', studentName: 'Bibek Thapa', status: 'cancelled', amount: 500, gradeLevel: '10' }),
  ]

  it('aggregates statuses, students, grades, and total value', () => {
    const m = buildExportManifest(rows, 'invoice')
    expect(m.byStatus).toEqual([
      { status: 'issued', count: 1 },
      { status: 'overdue', count: 1 },
      { status: 'cancelled', count: 1 },
    ])
    expect(m.studentCount).toBe(2)
    expect(m.grades).toEqual(['4', '10']) // numeric-aware sort
    expect(m.totalValue).toBe(3500)
  })

  it('counts cancelled invoices as will-be-skipped', () => {
    expect(buildExportManifest(rows, 'invoice').skippedCount).toBe(1)
  })

  it('counts non-completed payments as will-be-skipped for receipts', () => {
    const payments = [
      row({ id: 'p1', status: 'completed' }),
      row({ id: 'p2', status: 'refunded' }),
      row({ id: 'p3', status: 'pending' }),
    ]
    expect(buildExportManifest(payments, 'receipt').skippedCount).toBe(2)
    expect(willBeSkipped(payments[0], 'receipt')).toBe(false)
  })
})

describe('bundle + file naming', () => {
  it('names bundles by docType and format', () => {
    expect(bundleNameFor('invoice', 'zip')).toBe('invoices.zip')
    expect(bundleNameFor('invoice', 'merged_pdf')).toBe('invoices.pdf')
    expect(bundleNameFor('receipt', 'zip')).toBe('receipts.zip')
    expect(bundleNameFor('receipt', 'merged_pdf')).toBe('receipts.pdf')
  })

  it('derives per-document filenames from the row number', () => {
    expect(fileNameFor(row({ number: 'RCP-420-2606-0002' }))).toBe('RCP-420-2606-0002.pdf')
  })
})

describe('outputUrlFor (format-aware, #305)', () => {
  it('returns zipUrl for zip jobs and legacy jobs without outputFormat', () => {
    expect(
      outputUrlFor(makeJob({ outputFormat: 'zip', output: { zipUrl: 'https://x/zip' } }))
    ).toBe('https://x/zip')
    expect(outputUrlFor(makeJob({ output: { zipUrl: 'https://x/legacy' } }))).toBe(
      'https://x/legacy'
    )
  })

  it('returns mergedPdfUrl for merged_pdf jobs', () => {
    expect(
      outputUrlFor(
        makeJob({
          outputFormat: 'merged_pdf',
          output: { mergedPdfUrl: 'https://x/merged', zipUrl: 'https://x/should-not-win' },
        })
      )
    ).toBe('https://x/merged')
  })
})

describe('failedIdsOf', () => {
  it('reads failedInvoiceIds defensively', () => {
    expect(failedIdsOf(makeJob({ failedInvoiceIds: ['a', 'b'] }))).toEqual(['a', 'b'])
    expect(failedIdsOf(makeJob({}))).toEqual([])
  })
})

describe('estimates + bytes', () => {
  it('scales the estimate with document count (4s floor)', () => {
    expect(estimateBundle(1).seconds).toBe(4)
    expect(estimateBundle(100).seconds).toBe(90)
    expect(estimateBundle(20).bytes).toBe(20 * 94 * 1024)
  })

  it('formats KB under a MB, MB above', () => {
    expect(formatBytes(94 * 1024)).toBe('94 KB')
    expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB')
    expect(formatBytes(-1)).toBe('0 KB')
  })
})
