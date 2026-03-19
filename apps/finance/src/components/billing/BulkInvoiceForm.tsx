/**
 * BulkInvoiceForm
 *
 * Multi-step wizard for bulk invoice generation:
 *   Step 1 — Select students (multi-select with search from student accounts)
 *   Step 2 — Select fee structures (checkboxes with amounts)
 *   Step 3 — Set academic year, billing period, due date, notes
 *   Step 4 — Preview (count, per-student total, grand total)
 *   Submit  — Progress indicator, then result summary
 *
 * Uses the bulk-generate endpoint: POST /finance/schools/{schoolId}/invoices/bulk-generate
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { formatNPR } from '@edforge/types'
import type { FeeStructure } from '@edforge/types'
import { Button } from '@edforge/ui'
import {
  Search,
  Users,
  FileText,
  Calendar,
  Eye,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react'
import {
  useEnrolledStudents,
  useBulkGenerateInvoices,
  useFeeStructures,
  useAcademicYears,
} from '@edforge/finance-services'
import type { StudentSearchResult } from '@edforge/finance-services'
import { formatDate } from '../../utils/format-date'

// ============================================================================
// TYPES
// ============================================================================

type Step = 1 | 2 | 3 | 4
type FormState = 'editing' | 'submitting' | 'done'

interface BulkInvoiceFormProps {
  schoolId: string
  onComplete?: () => void
  onCancel?: () => void
}

interface BulkResult {
  generated: number
  skipped: number
  errors?: { studentId: string; reason: string }[]
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

const STEP_LABELS = ['Select Students', 'Fee Structures', 'Details', 'Preview']

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((label, idx) => {
        const stepNum = (idx + 1) as Step
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={label} className="flex items-center gap-2">
            {idx > 0 && (
              <div
                className={`h-px w-6 ${
                  isDone ? 'bg-teal-500' : 'bg-[rgb(var(--border-primary))]'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : isDone
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                      : 'bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-tertiary))]'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  isActive
                    ? 'text-[rgb(var(--text-primary))]'
                    : 'text-[rgb(var(--text-tertiary))]'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BulkInvoiceForm({ schoolId, onComplete, onCancel }: BulkInvoiceFormProps) {
  // Data fetching
  const { data: studentsData, isLoading: studentsLoading } = useEnrolledStudents(schoolId)
  const { data: feeStructureData, isLoading: feesLoading } = useFeeStructures(schoolId)
  const { data: academicYearsData } = useAcademicYears(schoolId)
  const bulkGenerateMutation = useBulkGenerateInvoices(schoolId)

  const students: StudentSearchResult[] = Array.isArray(studentsData) ? studentsData : []
  const feeStructures: FeeStructure[] = useMemo(() => {
    const raw: FeeStructure[] = Array.isArray(feeStructureData) ? feeStructureData : []
    return raw.filter((f) => f.isActive !== false)
  }, [feeStructureData])

  // Filter to active/planning years, sorted most recent first
  const academicYears = useMemo(() => {
    const raw = Array.isArray(academicYearsData) ? academicYearsData : []
    return raw
      .filter((y) => y.status === 'active' || y.status === 'planning')
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
  }, [academicYearsData])

  // Form state
  const [step, setStep] = useState<Step>(1)
  const [formState, setFormState] = useState<FormState>('editing')
  const [result, setResult] = useState<BulkResult | null>(null)

  // Step 1 — Student selection
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  // Step 2 — Fee structures
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([])

  // Step 3 — Details
  const [academicYear, setAcademicYear] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  // Auto-select current academic year
  useEffect(() => {
    if (!academicYear && academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrent)
      setAcademicYear(current?.name ?? academicYears[0].name)
    }
  }, [academicYears, academicYear])

  // Derived values
  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students
    const term = studentSearch.toLowerCase()
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(term) ||
        s.firstName?.toLowerCase().includes(term) ||
        s.lastName?.toLowerCase().includes(term) ||
        s.studentNumber?.toLowerCase().includes(term)
    )
  }, [students, studentSearch])

  const selectedFeeStructures = useMemo(
    () => feeStructures.filter((f) => selectedFeeIds.includes(f.id)),
    [feeStructures, selectedFeeIds]
  )

  const perStudentSubtotal = selectedFeeStructures.reduce((sum, f) => sum + (f.amount || 0), 0)
  const perStudentTax = selectedFeeStructures.reduce(
    (sum, f) => sum + ((f.amount || 0) * (f.taxRate || 0)) / 100,
    0
  )
  const perStudentTotal = perStudentSubtotal + perStudentTax
  const grandTotal = perStudentTotal * selectedStudentIds.length

  // Validation per step
  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return selectedStudentIds.length > 0
      case 2:
        return selectedFeeIds.length > 0
      case 3:
        return !!academicYear.trim() && !!dueDate
      case 4:
        return true
      default:
        return false
    }
  }

  // Navigation
  const goNext = () => {
    if (step < 4 && canProceed(step)) setStep((step + 1) as Step)
  }
  const goBack = () => {
    if (step > 1) setStep((step - 1) as Step)
  }

  // Submit
  const handleSubmit = async () => {
    setFormState('submitting')
    try {
      const response = await bulkGenerateMutation.mutateAsync({
        studentIds: selectedStudentIds,
        feeStructureIds: selectedFeeIds,
        academicYear: academicYear.trim(),
        billingPeriod: billingPeriod.trim() || undefined,
        dueDate,
        notes: notes.trim() || undefined,
      })
      setResult({
        generated: response.generated ?? response.invoiceIds?.length ?? 0,
        skipped: response.skipped ?? 0,
        errors: response.errors,
      })
      setFormState('done')
      toast.success(`Generated ${response.generated ?? response.invoiceIds?.length ?? 0} invoices`)
    } catch {
      toast.error('Failed to generate invoices. Please try again.')
      setFormState('editing')
    }
  }

  // Toggle helpers
  const toggleAccount = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleAllStudents = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.studentId))
    }
  }

  const toggleFee = (id: string) => {
    setSelectedFeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // ==================== RENDER ====================

  // Submitting state
  if (formState === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          Generating invoices for {selectedStudentIds.length} students...
        </p>
        <p className="text-xs text-[rgb(var(--text-tertiary))]">
          This may take a moment.
        </p>
      </div>
    )
  }

  // Done state
  if (formState === 'done' && result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 text-center space-y-4"
      >
        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          Bulk Generation Complete
        </h2>
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          Generated {result.generated} invoices.{' '}
          {result.skipped > 0 && `${result.skipped} skipped.`}
        </p>

        {result.errors && result.errors.length > 0 && (
          <div className="max-w-lg mx-auto mt-4 text-left">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {result.errors.length} invoice{result.errors.length > 1 ? 's' : ''} could not be generated
              </p>
            </div>
            <div className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgb(var(--surface-secondary))] border-b border-[rgb(var(--border-primary))]">
                    <th className="text-left px-3 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Student
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                      Error Reason
                    </th>
                  </tr>
                </thead>
              </table>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full">
                  <tbody className="divide-y divide-[rgb(var(--border-primary))]">
                    {result.errors.map((err, i) => {
                      const student = students.find((s) => s.studentId === err.studentId)
                      return (
                        <tr key={i} className="hover:bg-[rgb(var(--surface-secondary))]">
                          <td className="px-3 py-2 text-sm text-[rgb(var(--text-primary))]">
                            {student?.fullName || `Student ${err.studentId.slice(0, 8)}...`}
                          </td>
                          <td className="px-3 py-2 text-sm text-red-600 dark:text-red-400">
                            {err.reason}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Close
          </Button>
          <Button onClick={onComplete}>
            View Invoices
          </Button>
        </div>
      </motion.div>
    )
  }

  // Editing state (wizard steps)
  return (
    <div>
      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
        >
          {/* Step 1: Select Students */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Select Students
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                  Choose which students to generate invoices for.
                </p>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <input
                  type="text"
                  placeholder="Search by name or student number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              {/* Selection summary */}
              <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary))]">
                <span>{selectedStudentIds.length} selected</span>
                <button
                  type="button"
                  onClick={toggleAllStudents}
                  className="text-teal-600 dark:text-teal-400 hover:underline"
                >
                  {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              </div>

              {/* Student list */}
              {studentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-8 h-8 mx-auto mb-2 text-[rgb(var(--text-tertiary))] opacity-40" />
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    {studentSearch ? 'No students match your search.' : 'No enrolled students found.'}
                  </p>
                </div>
              ) : (
                <div className="border border-[rgb(var(--border-primary))] rounded-lg max-h-72 overflow-y-auto divide-y divide-[rgb(var(--border-primary))]">
                  {filteredStudents.map((student) => (
                    <label
                      key={student.studentId}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--surface-secondary))] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.includes(student.studentId)}
                        onChange={() => toggleAccount(student.studentId)}
                        className="rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-[rgb(var(--text-primary))]">
                          {student.fullName}
                        </span>
                        {student.currentGradeLevel && (
                          <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                            Grade {student.currentGradeLevel}
                          </span>
                        )}
                      </div>
                      {student.studentNumber && (
                        <span className="text-xs text-[rgb(var(--text-tertiary))] font-mono">
                          {student.studentNumber}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Fee Structures */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Select Fee Structures
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                  Choose which fees to include on each invoice.
                </p>
              </div>

              {feesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 text-teal-500 animate-spin" />
                </div>
              ) : feeStructures.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-[rgb(var(--text-tertiary))] opacity-40" />
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">
                    No active fee structures configured.
                  </p>
                </div>
              ) : (
                <div className="border border-[rgb(var(--border-primary))] rounded-lg divide-y divide-[rgb(var(--border-primary))]">
                  {feeStructures.map((fee) => (
                    <label
                      key={fee.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--surface-secondary))] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeeIds.includes(fee.id)}
                        onChange={() => toggleFee(fee.id)}
                        className="rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          {fee.name}
                        </span>
                        {fee.description && (
                          <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
                            {fee.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                          {formatNPR(fee.amount)}
                        </span>
                        {fee.taxRate > 0 && (
                          <p className="text-xs text-[rgb(var(--text-tertiary))]">
                            +{fee.taxRate}% tax
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {selectedFeeIds.length > 0 && (
                <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-3">
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Per-student subtotal</span>
                    <span>{formatNPR(perStudentSubtotal)}</span>
                  </div>
                  {perStudentTax > 0 && (
                    <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                      <span>Per-student tax</span>
                      <span>{formatNPR(perStudentTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-1 mt-1">
                    <span>Per-student total</span>
                    <span>{formatNPR(perStudentTotal)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Invoice Details
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                  Set the academic year, billing period, and due date.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                    Academic Year *
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  >
                    <option value="">Select academic year</option>
                    {academicYears.map((y) => (
                      <option key={y.yearId} value={y.name}>
                        {y.name}{y.isCurrent ? ' (Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  Billing Period
                </label>
                <input
                  type="text"
                  value={billingPeriod}
                  onChange={(e) => setBillingPeriod(e.target.value)}
                  placeholder="e.g., First Term, Admission"
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes to include on all invoices..."
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Review & Confirm
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                  Verify the details before generating invoices.
                </p>
              </div>

              <div className="border border-[rgb(var(--border-primary))] rounded-lg divide-y divide-[rgb(var(--border-primary))]">
                {/* Students count */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">Students</span>
                  </div>
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {selectedStudentIds.length}
                  </span>
                </div>

                {/* Fee structures */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">Fee Structures</span>
                  </div>
                  <div className="space-y-1 ml-6">
                    {selectedFeeStructures.map((fee) => (
                      <div key={fee.id} className="flex justify-between text-xs">
                        <span className="text-[rgb(var(--text-secondary))]">{fee.name}</span>
                        <span className="text-[rgb(var(--text-primary))] font-medium">
                          {formatNPR(fee.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">Details</span>
                  </div>
                  <div className="ml-6 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[rgb(var(--text-tertiary))]">Academic Year</span>
                      <span className="text-[rgb(var(--text-primary))]">{academicYear}</span>
                    </div>
                    {billingPeriod && (
                      <div className="flex justify-between">
                        <span className="text-[rgb(var(--text-tertiary))]">Billing Period</span>
                        <span className="text-[rgb(var(--text-primary))]">{billingPeriod}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[rgb(var(--text-tertiary))]">Due Date</span>
                      <span className="text-[rgb(var(--text-primary))]">
                        {formatDate(dueDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="px-4 py-3 bg-[rgb(var(--surface-secondary))]">
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Per-student total</span>
                    <span>{formatNPR(perStudentTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Number of students</span>
                    <span>&times; {selectedStudentIds.length}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2 mt-2">
                    <span>Grand Total</span>
                    <span>{formatNPR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="text-xs text-[rgb(var(--text-tertiary))]">
                  <span className="font-medium">Notes:</span> {notes}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgb(var(--border-primary))]">
        <div>
          {step > 1 ? (
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
        <div>
          {step < 4 ? (
            <Button onClick={goNext} disabled={!canProceed(step)}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed(step)}>
              <Eye className="w-4 h-4 mr-1.5" />
              Generate {selectedStudentIds.length} Invoices
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
