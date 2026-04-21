/**
 * Parser tests — round-trip real IEMIS column shapes through the client-side
 * xlsx parser. We build synthetic workbooks in-memory (via xlsx's own
 * builder) instead of committing fixture files so the test stays fast and
 * deterministic.
 *
 * The backend `iemis-transform.spec.ts` already covers per-row semantics
 * (BS→Gregorian, name splitting, etc.). Here we only verify parsing +
 * column sniff — the boundary between "file on disk" and "backend payload".
 */
import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { parseIemisXlsx } from '../iemis-parser'

/** Build a File object containing an xlsx workbook with the given sheet rows. */
function makeXlsxFile(
  headers: string[],
  rows: Array<Array<string | number | undefined>>,
  filename = 'test.xlsx',
): File {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  const arr = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
  return new File([arr], filename, {
    type: 'application/vnd.openxmlformats-officedetails-spreadsheetml.sheet',
  })
}

describe('parseIemisXlsx', () => {
  describe('happy path', () => {
    const headers = [
      'S.N',
      'IEMIS Code',
      'Current School',
      'Student Id',
      'FullName',
      'Gender',
      'Father Name',
      'Mother Name',
      'CurrentClass',
      'Section',
      'Year',
      'Permanent Address',
      'Temporary Address',
      'DOB',
      'Is Transferred',
      'Mother Tongue',
      'Disability Type',
      'Age',
      'Guardian Name',
      'Guardian Contact Number',
    ]
    const row1 = [
      1,
      '170840012',
      'Saraswati English Boarding School',
      '1708400128000841',
      'Roshani Khatun',
      'Female',
      'Habib Rain',
      'Kuresha Khatun',
      '2',
      '',
      '2082',
      'Kshireshwarnath-9, Dhanusha',
      'Kshireshwarnath-9, Dhanusha',
      '2072-3-13',
      'No',
      'Nepali',
      'No Disability',
      10,
      'Sahil Safi',
      '9825851510',
    ]

    it('parses all 20 IEMIS columns into row dicts', async () => {
      const file = makeXlsxFile(headers, [row1])
      const result = await parseIemisXlsx(file)
      expect(result.rowCount).toBe(1)
      expect(result.mappedColumns).toHaveLength(20)
      expect(result.missingColumns).toHaveLength(0)
      expect(result.missingRequired).toHaveLength(0)
      expect(result.rows[0]['Student Id']).toBe('1708400128000841')
      expect(result.rows[0]['FullName']).toBe('Roshani Khatun')
    })

    it('preserves numeric cells as numbers', async () => {
      // Age = 10 is a numeric cell in IEMIS exports. We want it to stay a
      // number so backend transform doesn't have to re-parse.
      const file = makeXlsxFile(headers, [row1])
      const result = await parseIemisXlsx(file)
      expect(typeof result.rows[0]['Age']).toBe('number')
      expect(result.rows[0]['Age']).toBe(10)
    })

    it('trims whitespace from string cells', async () => {
      const withWhitespace = [...row1]
      withWhitespace[4] = '   Roshani  Khatun   '
      const file = makeXlsxFile(headers, [withWhitespace])
      const result = await parseIemisXlsx(file)
      expect(result.rows[0]['FullName']).toBe('Roshani  Khatun')
    })

    it('drops empty rows', async () => {
      const emptyRow = headers.map(() => undefined)
      const file = makeXlsxFile(headers, [row1, emptyRow])
      const result = await parseIemisXlsx(file)
      expect(result.rowCount).toBe(1)
    })
  })

  describe('column sniff', () => {
    it('is case-insensitive on column headers', async () => {
      // Real IEMIS exports are exact-case, but a defensive parser shouldn't
      // break on minor case drift (e.g. some operators might hand-edit).
      const headers = ['student id', 'fullname', 'GENDER', 'currentclass', 'dob']
      const file = makeXlsxFile(headers, [['123', 'Jane Doe', 'Female', '2', '2072-3-13']])
      const result = await parseIemisXlsx(file)
      expect(result.missingRequired).toHaveLength(0)
      expect(result.rows[0]['Student Id']).toBe('123')
    })

    it('reports missing required columns', async () => {
      const headers = ['FullName', 'Gender'] // missing Student Id, CurrentClass, DOB
      const file = makeXlsxFile(headers, [['Jane Doe', 'Female']])
      const result = await parseIemisXlsx(file)
      expect(result.missingRequired.sort()).toEqual(
        ['CurrentClass', 'DOB', 'Student Id'].sort(),
      )
    })

    it('reports extra columns that do not match any IEMIS name', async () => {
      const headers = [
        'Student Id',
        'FullName',
        'Gender',
        'CurrentClass',
        'DOB',
        'CustomOpColumn',
      ]
      const file = makeXlsxFile(headers, [
        ['1', 'Jane Doe', 'Female', '2', '2072-3-13', 'noise'],
      ])
      const result = await parseIemisXlsx(file)
      expect(result.extraColumns).toEqual(['CustomOpColumn'])
      expect(result.missingRequired).toHaveLength(0)
    })

    it('collapses duplicate mapped columns (if the sheet has the same IEMIS name twice)', async () => {
      const headers = ['Student Id', 'Student Id', 'FullName', 'Gender', 'CurrentClass', 'DOB']
      const file = makeXlsxFile(headers, [['1', '2', 'X Y', 'Male', '2', '2072-3-13']])
      const result = await parseIemisXlsx(file)
      // mappedColumns is a unique set — dup header shouldn't double-count.
      expect(result.mappedColumns.filter((c) => c === 'Student Id')).toHaveLength(1)
    })
  })

  describe('structural errors', () => {
    it('throws when the file has no data rows', async () => {
      const file = makeXlsxFile(['Student Id', 'FullName', 'Gender', 'CurrentClass', 'DOB'], [])
      await expect(parseIemisXlsx(file)).rejects.toThrow(/no data rows/i)
    })
    // Note: can't test the "no sheets" branch directly — `XLSX.write()`
    // refuses to write a sheetless workbook. That defensive branch in the
    // parser remains as a belt-and-braces guard for xlsx files authored
    // outside SheetJS.
  })
})
