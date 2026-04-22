/**
 * CSV export tests — pin the RFC 4180 quoting behavior + source-value
 * lookup so a refactor that "simplifies" escaping doesn't silently break
 * Excel / Google Sheets / LibreOffice round-trips.
 */
import { describe, it, expect } from 'vitest'
import {
  buildFindingsExport,
  findingsToCsv,
} from '../iemis-findings-export'
import type { IemisFinding, IemisRow } from '../iemis-import.types'

describe('buildFindingsExport', () => {
  it('attaches sourceValue from the 1-indexed row when the field matches an IEMIS column', () => {
    const rows: IemisRow[] = [
      { 'Student Id': '123', Gender: 'invalid', FullName: 'X Y' },
    ]
    const findings: IemisFinding[] = [
      { row: 1, field: 'Gender', level: 'error', message: 'Unknown gender value' },
    ]
    const out = buildFindingsExport(findings, rows)
    expect(out[0].sourceValue).toBe('invalid')
  })

  it('returns empty sourceValue when the field is not a direct row key', () => {
    const rows: IemisRow[] = [{ 'Student Id': '123', FullName: 'X Y' }]
    const findings: IemisFinding[] = [
      { row: 1, field: 'create', level: 'error', message: 'createStudent failed' },
    ]
    const out = buildFindingsExport(findings, rows)
    expect(out[0].sourceValue).toBe('')
  })

  it('returns empty sourceValue when the row index is out of range', () => {
    const rows: IemisRow[] = [{ 'Student Id': '1' }]
    const findings: IemisFinding[] = [
      { row: 99, field: 'Student Id', level: 'error', message: 'oops' },
    ]
    expect(buildFindingsExport(findings, rows)[0].sourceValue).toBe('')
  })
})

describe('findingsToCsv', () => {
  it('emits a header row + data rows separated by CRLF', () => {
    const csv = findingsToCsv([
      { row: 1, field: 'Gender', level: 'error', message: 'bad', sourceValue: 'X' },
    ])
    expect(csv).toBe(
      'row,field,level,message,sourceValue\r\n1,Gender,error,bad,X\r\n',
    )
  })

  it('quotes values containing comma', () => {
    const csv = findingsToCsv([
      { row: 2, field: 'Addr', level: 'warn', message: 'multi, part', sourceValue: 'a, b, c' },
    ])
    const lines = csv.trim().split('\r\n')
    expect(lines[1]).toBe('2,Addr,warn,"multi, part","a, b, c"')
  })

  it('doubles embedded quotes (RFC 4180)', () => {
    const csv = findingsToCsv([
      { row: 3, field: 'Name', level: 'warn', message: 'contains "quote" char', sourceValue: '' },
    ])
    expect(csv).toContain('"contains ""quote"" char"')
  })

  it('quotes values containing newlines', () => {
    const csv = findingsToCsv([
      { row: 4, field: 'Msg', level: 'warn', message: 'line1\nline2', sourceValue: '' },
    ])
    const lines = csv.split('\r\n')
    // The quoted value contains the literal newline, so the split yields a
    // mid-record boundary. Simpler assertion: the quoted sequence is present.
    expect(csv).toContain('"line1\nline2"')
    // Ensure we still have the header + terminating CRLF.
    expect(lines[0]).toBe('row,field,level,message,sourceValue')
  })
})
