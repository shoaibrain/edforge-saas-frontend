/**
 * CSVImport Component — V2
 *
 * File upload UI for bulk student import.
 * Flow: Upload CSV → Preview table → Error/duplicate display → Confirm/Cancel
 *
 * V2 changes:
 * - 540px modal with V2 card styling
 * - Subtle dashed dropzone with teal accents
 * - Template card with download link
 * - Monospace column chips (required/optional)
 * - Green action buttons (replacing brand-gradient-warm)
 * - V2 footer layout
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  Info,
  ArrowRight,
} from 'lucide-react'
import { useImportStudentsCsv } from '../../hooks/useStudents'
import type { CsvImportResult } from '../../services/academics.service'
import { useActiveSchoolId } from '../../stores/app.store'

// ============================================================================
// CSV TEMPLATE
// ============================================================================

const CSV_TEMPLATE_HEADERS = [
  'firstName',
  'lastName',
  'birthDate',
  'gender',
  'gradeLevel',
  'guardianName',
  'guardianPhone',
  'guardianEmail',
]

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'birthDate', 'gender', 'gradeLevel']
const OPTIONAL_COLUMNS = ['guardianName', 'guardianPhone', 'guardianEmail']

const CSV_TEMPLATE_EXAMPLE = [
  'Jane',
  'Doe',
  '2015-03-15',
  'female',
  '5',
  'John Doe',
  '555-0123',
  'john.doe@email.com',
]

function downloadTemplate() {
  const header = CSV_TEMPLATE_HEADERS.join(',')
  const example = CSV_TEMPLATE_EXAMPLE.join(',')
  const csv = `${header}\n${example}\n`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'student-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================================
// CSV PARSER
// ============================================================================

interface ParsedRow {
  rowNum: number
  data: Record<string, string>
  errors: string[]
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"(.*)"$/, '$1'))

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim().replace(/^"(.*)"$/, '$1'))
    const data: Record<string, string> = {}
    const errors: string[] = []

    headers.forEach((h, idx) => {
      data[h] = values[idx] || ''
    })

    if (!data.firstName) errors.push('Missing first name')
    if (!data.lastName) errors.push('Missing last name')
    if (!data.birthDate && !data.dateOfBirth) errors.push('Missing birth date')
    if (!data.gender) errors.push('Missing gender')
    if (!data.gradeLevel && !data.currentGradeLevel) errors.push('Missing grade level')

    rows.push({ rowNum: i, data, errors })
  }

  return { headers, rows }
}

// ============================================================================
// TYPES
// ============================================================================

interface CSVImportProps {
  onClose: () => void
  onSuccess?: () => void
}

type ImportPhase = 'upload' | 'preview' | 'importing' | 'results'

// ============================================================================
// COMPONENT
// ============================================================================

export function CSVImport({ onClose, onSuccess }: CSVImportProps) {
  const schoolId = useActiveSchoolId()
  const importMutation = useImportStudentsCsv()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [phase, setPhase] = useState<ImportPhase>('upload')
  const [fileName, setFileName] = useState('')
  const [parsedData, setParsedData] = useState<{ headers: string[]; rows: ParsedRow[] }>({
    headers: [],
    rows: [],
  })
  const [importResult, setImportResult] = useState<CsvImportResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv')) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      setParsedData(parsed)
      setPhase('preview')
    }
    reader.readAsText(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (!file || !file.name.endsWith('.csv')) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSV(text)
      setParsedData(parsed)
      setPhase('preview')
    }
    reader.readAsText(file)
  }, [])

  const handleImport = useCallback(async () => {
    if (!schoolId) return

    setPhase('importing')
    const students = parsedData.rows
      .filter((r) => r.errors.length === 0)
      .map((r) => r.data)

    try {
      const result = await importMutation.mutateAsync({ students, schoolId })
      setImportResult(result)
      setPhase('results')
      if (result.imported > 0) {
        onSuccess?.()
      }
    } catch {
      setPhase('preview')
    }
  }, [schoolId, parsedData, importMutation, onSuccess])

  const handleReset = useCallback(() => {
    setPhase('upload')
    setFileName('')
    setParsedData({ headers: [], rows: [] })
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const validRows = parsedData.rows.filter((r) => r.errors.length === 0)
  const invalidRows = parsedData.rows.filter((r) => r.errors.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full flex flex-col overflow-hidden"
        style={{
          maxWidth: 540,
          maxHeight: '85vh',
          background: '#161b27',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                background: 'rgba(29, 158, 117, 0.1)',
                borderRadius: 8,
              }}
            >
              <Upload className="w-4 h-4" style={{ color: '#1D9E75' }} />
            </div>
            <div>
              <h2
                className="font-semibold"
                style={{ fontSize: 14, color: 'var(--v2-text-primary)' }}
              >
                Import Students
              </h2>
              <p style={{ fontSize: 11, color: 'var(--v2-text-muted)' }}>
                {phase === 'upload' && 'Upload a CSV file to bulk import students'}
                {phase === 'preview' && `${validRows.length} valid, ${invalidRows.length} with errors`}
                {phase === 'importing' && 'Importing students...'}
                {phase === 'results' && 'Import complete'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center transition-colors hover:opacity-80"
            style={{
              width: 26,
              height: 26,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: 6,
            }}
          >
            <X className="w-3 h-3" style={{ color: 'var(--v2-text-hint)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-5 py-5">
          {/* Upload Phase */}
          {phase === 'upload' && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="text-center cursor-pointer transition-all py-8 px-4"
                style={{
                  border: isDragOver
                    ? '1.5px dashed rgba(29, 158, 117, 0.5)'
                    : '1.5px dashed rgba(29, 158, 117, 0.3)',
                  background: isDragOver
                    ? 'rgba(29, 158, 117, 0.06)'
                    : 'rgba(29, 158, 117, 0.03)',
                  borderRadius: 10,
                }}
              >
                <div
                  className="mx-auto flex items-center justify-center mb-3"
                  style={{
                    width: 40,
                    height: 40,
                    background: 'rgba(29, 158, 117, 0.1)',
                    borderRadius: 10,
                  }}
                >
                  <Upload className="w-5 h-5" style={{ color: '#1D9E75' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--v2-text-secondary)' }}>
                  Drag and drop a CSV file
                </p>
                <p style={{ fontSize: 11, color: 'var(--v2-text-muted)', marginTop: 4 }}>
                  or{' '}
                  <span style={{ color: '#1D9E75', cursor: 'pointer' }}>click to browse</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Template Card */}
              <div
                className="flex items-center gap-3"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    background: 'rgba(255, 255, 255, 0.06)',
                    borderRadius: 6,
                  }}
                >
                  <FileText className="w-3.5 h-3.5" style={{ color: '#7a8099' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--v2-text-secondary)' }}>
                    CSV Template
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>
                    Download with required columns
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); downloadTemplate() }}
                  className="flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ fontSize: 11, fontWeight: 500, color: '#1D9E75' }}
                >
                  Download
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Column Chips */}
              <div className="space-y-3">
                <div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#3a4055',
                    }}
                  >
                    Required
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {REQUIRED_COLUMNS.map((col) => (
                      <span
                        key={col}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: 'rgba(239, 159, 39, 0.1)',
                          color: '#EF9F27',
                          border: '1px solid rgba(239, 159, 39, 0.15)',
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p
                    className="mb-1.5"
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#3a4055',
                    }}
                  >
                    Optional
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {OPTIONAL_COLUMNS.map((col) => (
                      <span
                        key={col}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 10,
                          fontWeight: 500,
                          padding: '2px 7px',
                          borderRadius: 5,
                          background: 'rgba(255, 255, 255, 0.04)',
                          color: '#5a6070',
                          border: '1px solid rgba(255, 255, 255, 0.07)',
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" style={{ color: 'var(--v2-text-hint)' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--v2-text-primary)' }}>
                    {fileName}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--v2-text-hint)' }}>
                    ({parsedData.rows.length} rows)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ fontSize: 10, color: 'var(--v2-text-hint)' }}
                >
                  <Trash2 className="w-3 h-3" />
                  Remove
                </button>
              </div>

              {/* Invalid rows warning */}
              {invalidRows.length > 0 && (
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'var(--v2-danger-bg)',
                    border: '1px solid var(--v2-danger-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: '#E24B4A' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#E24B4A' }}>
                      {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} with errors (will be skipped)
                    </span>
                  </div>
                  <ul className="space-y-0.5 ml-5" style={{ fontSize: 10, color: '#E24B4A' }}>
                    {invalidRows.slice(0, 5).map((row) => (
                      <li key={row.rowNum}>
                        Row {row.rowNum}: {row.errors.join(', ')}
                      </li>
                    ))}
                    {invalidRows.length > 5 && (
                      <li>...and {invalidRows.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              <div
                className="overflow-auto"
                style={{
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid var(--v2-border-default)',
                }}
              >
                <table className="w-full" style={{ fontSize: 11 }}>
                  <thead
                    className="sticky top-0"
                    style={{ background: 'var(--v2-bg-elevated)' }}
                  >
                    <tr>
                      <th className="px-3 py-2 text-left" style={{ fontSize: 10, fontWeight: 500, color: 'var(--v2-text-hint)', textTransform: 'uppercase' }}>#</th>
                      {parsedData.headers.slice(0, 5).map((h) => (
                        <th key={h} className="px-3 py-2 text-left" style={{ fontSize: 10, fontWeight: 500, color: 'var(--v2-text-hint)', textTransform: 'uppercase' }}>
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left" style={{ fontSize: 10, fontWeight: 500, color: 'var(--v2-text-hint)', textTransform: 'uppercase' }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.map((row) => {
                      const hasErrors = row.errors.length > 0
                      return (
                        <tr
                          key={row.rowNum}
                          style={{
                            borderTop: '1px solid var(--v2-border-default)',
                            background: hasErrors ? 'var(--v2-danger-bg)' : 'transparent',
                          }}
                        >
                          <td className="px-3 py-2" style={{ color: 'var(--v2-text-hint)' }}>{row.rowNum}</td>
                          {parsedData.headers.slice(0, 5).map((h) => (
                            <td key={h} className="px-3 py-2 truncate" style={{ color: 'var(--v2-text-primary)', maxWidth: 120 }}>
                              {row.data[h] || '\u2014'}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            {hasErrors ? (
                              <span className="inline-flex items-center gap-1" style={{ fontSize: 10, color: '#E24B4A' }}>
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1" style={{ fontSize: 10, color: '#1D9E75' }}>
                                <CheckCircle2 className="w-3 h-3" />
                                Valid
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Importing Phase */}
          {phase === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#1D9E75' }} />
              <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--v2-text-primary)' }}>
                Importing {validRows.length} students...
              </p>
              <p style={{ fontSize: 10, color: 'var(--v2-text-muted)', marginTop: 4 }}>
                Please do not close this window.
              </p>
            </div>
          )}

          {/* Results Phase */}
          {phase === 'results' && importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="text-center py-3 px-2"
                  style={{
                    background: 'var(--v2-success-bg)',
                    border: '1px solid var(--v2-success-border)',
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#1D9E75' }}>
                    {importResult.imported}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>Imported</p>
                </div>
                <div
                  className="text-center py-3 px-2"
                  style={{
                    background: 'var(--v2-warning-bg)',
                    border: '1px solid var(--v2-warning-border)',
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#EF9F27' }}>
                    {importResult.skipped}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>Skipped</p>
                </div>
                <div
                  className="text-center py-3 px-2"
                  style={{
                    background: 'var(--v2-danger-bg)',
                    border: '1px solid var(--v2-danger-border)',
                    borderRadius: 8,
                  }}
                >
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#E24B4A' }}>
                    {importResult.errors.length}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--v2-text-muted)' }}>Errors</p>
                </div>
              </div>

              {/* Duplicates */}
              {importResult.duplicates.length > 0 && (
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'var(--v2-warning-bg)',
                    border: '1px solid var(--v2-warning-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#EF9F27' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#EF9F27' }}>
                      Duplicate matches found
                    </span>
                  </div>
                  <ul className="space-y-0.5 ml-5" style={{ fontSize: 10, color: 'var(--v2-text-secondary)' }}>
                    {importResult.duplicates.slice(0, 10).map((d) => (
                      <li key={d.row}>
                        Row {d.row}: matched {d.matches.map((m) => `${m.firstName} ${m.lastName}`).join(', ')} ({d.matches[0]?.confidence} confidence)
                      </li>
                    ))}
                    {importResult.duplicates.length > 10 && (
                      <li>...and {importResult.duplicates.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div
                  className="p-3 rounded-lg"
                  style={{
                    background: 'var(--v2-danger-bg)',
                    border: '1px solid var(--v2-danger-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" style={{ color: '#E24B4A' }} />
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#E24B4A' }}>
                      Import errors
                    </span>
                  </div>
                  <ul className="space-y-0.5 ml-5" style={{ fontSize: 10, color: '#E24B4A' }}>
                    {importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>
                        Row {err.row}: {err.field} - {err.message}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li>...and {importResult.errors.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}
        >
          {/* Left info */}
          <div className="flex items-center gap-1.5">
            {phase === 'upload' && (
              <>
                <Info className="w-3 h-3" style={{ color: '#3a4055' }} />
                <span style={{ fontSize: 10, color: '#3a4055' }}>
                  Supports .csv files up to 500 rows
                </span>
              </>
            )}
            {phase === 'preview' && (
              <button
                type="button"
                onClick={handleReset}
                className="transition-colors hover:opacity-80"
                style={{ fontSize: 11, color: 'var(--v2-text-hint)' }}
              >
                Upload different file
              </button>
            )}
          </div>

          {/* Right buttons */}
          <div className="flex items-center gap-2">
            {phase === 'results' ? (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 text-white transition-all hover:opacity-90"
                style={{
                  background: '#1D9E75',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 transition-colors hover:opacity-80"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    color: '#7a8099',
                  }}
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                {phase === 'preview' && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={validRows.length === 0}
                    className="flex items-center gap-1.5 text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: '#1D9E75',
                      borderRadius: 8,
                      padding: '7px 16px',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <Upload className="w-3 h-3" />
                    Import {validRows.length} Student{validRows.length !== 1 ? 's' : ''}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
