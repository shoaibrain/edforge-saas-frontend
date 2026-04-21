/**
 * Findings CSV export utility — shared by the preview and results phases
 * of the IemisImport flow. Kept as a separate module so the xlsx-heavy
 * IemisImport component doesn't also own CSV-serialization concerns.
 *
 * The output is structurally identical to the backend's `findings[]`
 * shape plus a `sourceValue` column pulled from the original row for
 * operator triage (e.g. "this Gender value `X` failed because ...").
 */

import type {
  IemisFinding,
  IemisFindingExport,
  IemisRow,
} from './iemis-import.types'

/**
 * Build a findings export array. Preserves row/field/level/message and
 * attempts a best-effort `sourceValue` lookup from the parsed rows when
 * the finding's `field` matches a known IEMIS column.
 *
 * Rows are 1-indexed by the backend (matches the `row` column in the
 * xlsx spreadsheet). We pass through that convention unchanged.
 */
export function buildFindingsExport(
  findings: IemisFinding[],
  rows: IemisRow[],
): IemisFindingExport[] {
  return findings.map((f) => ({
    ...f,
    sourceValue: lookupSourceValue(f, rows),
  }))
}

function lookupSourceValue(f: IemisFinding, rows: IemisRow[]): string {
  // `rows` is 0-indexed; backend `row` is 1-indexed.
  const row = rows[f.row - 1]
  if (!row) return ''
  const raw = (row as Record<string, unknown>)[f.field]
  if (raw === undefined || raw === null) return ''
  return String(raw)
}

/**
 * Serialize findings as CSV. Uses RFC 4180 quoting — embeds a double
 * quote by doubling it, wraps any value containing `,` / `"` / newline
 * in quotes. Works in Excel + Google Sheets + LibreOffice identically.
 */
export function findingsToCsv(findings: IemisFindingExport[]): string {
  const header = ['row', 'field', 'level', 'message', 'sourceValue']
  const escape = (v: string | number): string => {
    const s = String(v)
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  const lines = [
    header.join(','),
    ...findings.map((f) =>
      [f.row, f.field, f.level, f.message, f.sourceValue].map(escape).join(','),
    ),
  ]
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger a browser download of the findings CSV. Separated from
 * `findingsToCsv` so the pure function remains testable without DOM
 * stubs.
 */
export function downloadFindingsCsv(
  findings: IemisFindingExport[],
  filename = 'iemis-import-findings.csv',
): void {
  const csv = findingsToCsv(findings)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
