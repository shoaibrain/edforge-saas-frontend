/**
 * CSVImport Component (Sprint 4 - Task 4.9b)
 *
 * File upload UI for bulk student import.
 * Flow: Upload CSV → Preview table → Error/duplicate display → Confirm/Cancel
 * Includes CSV template download.
 */

import { useState, useCallback, useRef } from 'react'
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
} from 'lucide-react'
import { useImportStudentsCsv } from '../../hooks/useStudents'
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

    // Basic client-side validation
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
  const [importResult, setImportResult] = useState<{
    imported: number
    skipped: number
    errors: Array<{ row: number; field: string; message: string }>
    duplicates: Array<{ row: number; matches: Array<{ studentId: string; name: string; confidence: string }> }>
  } | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      return
    }

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
      <div className="bg-[rgb(var(--surface-primary))] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-secondary))]">
          <div>
            <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">
              Import Students from CSV
            </h2>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              {phase === 'upload' && 'Upload a CSV file to bulk import students.'}
              {phase === 'preview' && `Preview: ${validRows.length} valid, ${invalidRows.length} with errors`}
              {phase === 'importing' && 'Importing students...'}
              {phase === 'results' && 'Import complete'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--surface-secondary))] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {/* Upload Phase */}
          {phase === 'upload' && (
            <div className="space-y-6">
              {/* Drop zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="border-2 border-dashed border-[rgb(var(--border-secondary))] rounded-xl p-12 text-center hover:border-teal-500/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-10 h-10 mx-auto text-[rgb(var(--text-tertiary))] mb-3" />
                <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  Drag and drop a CSV file, or click to browse
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                  Supports .csv files up to 500 rows
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Template download */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-tertiary))]">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      CSV Template
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      Download the template with required columns
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-500/10 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Column spec */}
              <div className="text-xs text-[rgb(var(--text-tertiary))] space-y-1">
                <p className="font-medium text-[rgb(var(--text-secondary))]">Required columns:</p>
                <p>firstName, lastName, birthDate (YYYY-MM-DD), gender (male/female/other), gradeLevel</p>
                <p className="font-medium text-[rgb(var(--text-secondary))] mt-2">Optional columns:</p>
                <p>guardianName, guardianPhone, guardianEmail</p>
              </div>
            </div>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))] font-medium">{fileName}</span>
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    ({parsedData.rows.length} rows)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1 text-xs text-[rgb(var(--text-tertiary))] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>

              {/* Invalid rows warning */}
              {invalidRows.length > 0 && (
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} with errors (will be skipped)
                    </span>
                  </div>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 ml-6">
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
              <div className="rounded-xl border border-[rgb(var(--border-secondary))] overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[rgb(var(--surface-secondary))]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">#</th>
                      {parsedData.headers.slice(0, 6).map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">
                          {h}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border-tertiary))]">
                    {parsedData.rows.map((row) => {
                      const hasErrors = row.errors.length > 0
                      return (
                        <tr
                          key={row.rowNum}
                          className={hasErrors ? 'bg-red-500/5' : 'hover:bg-[rgb(var(--surface-secondary))]/50'}
                        >
                          <td className="px-3 py-2 text-[rgb(var(--text-tertiary))]">{row.rowNum}</td>
                          {parsedData.headers.slice(0, 6).map((h) => (
                            <td key={h} className="px-3 py-2 text-[rgb(var(--text-primary))] truncate max-w-[150px]">
                              {row.data[h] || '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2">
                            {hasErrors ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Importing {validRows.length} students...
              </p>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
                This may take a moment. Please do not close this window.
              </p>
            </div>
          )}

          {/* Results Phase */}
          {phase === 'results' && importResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {importResult.imported}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">Imported</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {importResult.skipped}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">Skipped (duplicates)</p>
                </div>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {importResult.errors.length}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">Errors</p>
                </div>
              </div>

              {/* Duplicates */}
              {importResult.duplicates.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      Duplicate matches found
                    </span>
                  </div>
                  <ul className="text-xs text-[rgb(var(--text-secondary))] space-y-1 ml-6">
                    {importResult.duplicates.slice(0, 10).map((d) => (
                      <li key={d.row}>
                        Row {d.row}: matched {d.matches.map((m) => m.name).join(', ')} ({d.matches[0]?.confidence} confidence)
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
                <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Import errors
                    </span>
                  </div>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-0.5 ml-6">
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-[rgb(var(--border-secondary))]">
          <div>
            {phase === 'preview' && (
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                Upload different file
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {phase === 'results' ? (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm font-semibold text-white brand-gradient-warm rounded-xl shadow-md hover:opacity-90 transition-all"
              >
                Done
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  Cancel
                </button>
                {phase === 'preview' && (
                  <button
                    type="button"
                    onClick={handleImport}
                    disabled={validRows.length === 0}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white brand-gradient-warm rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Upload className="w-4 h-4" />
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
