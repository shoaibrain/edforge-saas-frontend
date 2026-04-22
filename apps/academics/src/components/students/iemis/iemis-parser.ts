/**
 * Client-side xlsx parser for IEMIS bulk student imports.
 *
 * Responsibilities:
 *   1. Read the uploaded xlsx/xls file (first sheet only).
 *   2. Normalize header row to IEMIS column names (case-insensitive match,
 *      whitespace-tolerant).
 *   3. Build row dicts keyed by canonical column names.
 *   4. Report which columns matched, missed, and which extras the sheet
 *      contains (for operator feedback).
 *
 * The parse is pure — no DOM, no fetch, no React. Invoked from a React
 * hook (`useXlsxParser`) that wraps it with async state for the UI.
 *
 * Non-goals:
 *   - Per-cell validation (transformer on the backend does that with
 *     archetype + school context).
 *   - BS→Gregorian date conversion (backend-only to keep one source of truth).
 *   - Any side effects. This function never calls the backend.
 */

import * as XLSX from 'xlsx'
import {
  IEMIS_COLUMN_NAMES,
  IEMIS_REQUIRED_COLUMNS,
  type IemisColumnName,
  type IemisParseResult,
  type IemisRow,
} from './iemis-import.types'

/**
 * Parse an IEMIS xlsx/xls file. Throws on structural failure (empty sheet,
 * no header row, unreadable buffer); returns a result with `missingRequired`
 * populated when the sheet is readable but unusable.
 */
export async function parseIemisXlsx(file: File): Promise<IemisParseResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false })
  if (!workbook.SheetNames.length) {
    throw new Error('The file has no sheets. Export from IEMIS again and re-upload.')
  }
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  if (!sheet) {
    throw new Error(`Sheet "${firstSheetName}" is empty.`)
  }

  // header: 1 ⇒ return as array of arrays; header[0] is the column row.
  const rawRows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: undefined,
    blankrows: false,
    raw: true,
  })
  if (rawRows.length < 2) {
    throw new Error('The file has no data rows. Confirm you exported the student list, not a summary sheet.')
  }

  const headerRow = rawRows[0].map((c) => (c == null ? '' : String(c).trim()))
  const dataRows = rawRows.slice(1)

  // Case-insensitive + whitespace-collapsed match from sheet header → canonical
  // IEMIS column name. `columnMap[<sheet col index>] = canonical name OR null`.
  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
  const canonicalByNormalized = new Map<string, IemisColumnName>()
  for (const col of IEMIS_COLUMN_NAMES) {
    canonicalByNormalized.set(normalize(col), col)
  }
  const columnMap: (IemisColumnName | null)[] = headerRow.map(
    (h) => canonicalByNormalized.get(normalize(h)) ?? null,
  )

  const mappedColumns = Array.from(new Set(columnMap.filter((c): c is IemisColumnName => c !== null)))
  const missingColumns = IEMIS_COLUMN_NAMES.filter((c) => !mappedColumns.includes(c))
  const extraColumns = headerRow.filter((h, i) => h && columnMap[i] === null)
  const missingRequired = IEMIS_REQUIRED_COLUMNS.filter((c) => !mappedColumns.includes(c))

  // Build row dicts. Empty rows (all cells undefined) are dropped.
  const rows: IemisRow[] = []
  for (const rawRow of dataRows) {
    const row: IemisRow = {}
    let anyValue = false
    for (let i = 0; i < columnMap.length; i++) {
      const canonical = columnMap[i]
      if (!canonical) continue
      const cell = rawRow[i]
      if (cell === undefined || cell === null || cell === '') continue
      // xlsx may deliver numbers as numbers; preserve primitive type so the
      // backend transformer can handle them identically to its spec tests.
      row[canonical] = typeof cell === 'number' ? cell : String(cell).trim()
      anyValue = true
    }
    if (anyValue) rows.push(row)
  }

  return {
    fileName: file.name,
    rowCount: rows.length,
    rows,
    detectedColumns: headerRow,
    mappedColumns,
    missingColumns,
    extraColumns,
    missingRequired,
  }
}
