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
import type { FeeStructure } from '@edforge/types'
import { useCurrency } from '@edforge/types/use-currency'
import { useFinanceSettings } from '../../layouts/FinanceLayout'
import { Button, Select } from '@edforge/ui'
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
  useBulkPreview,
  useFeeStructures,
  useAcademicYears,
} from '@edforge/finance-services'
import type { StudentSearchResult } from '@edforge/finance-services'
import { UuidBadge } from '@edforge/archetype'
import { formatDate } from '../../utils/format-date'
import { useSchoolGradeOptions } from '../../hooks/useSchoolGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

type Step = 1 | 2 | 3 | 4
type FormState = 'editing' | 'submitting' | 'done'
// Bulk Ops Sprint C.5 — Step 1 split into a 2-tab selector. Operator
// either picks individual students (existing flow) or one+ grade levels
// (new flow — backend resolves studentIds via the C.3 helper).
type SelectionMode = 'students' | 'grades'

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
                  isDone ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--border-primary))]'
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive
                    ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]'
                    : isDone
                      ? 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  '
                      : 'bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]'
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
  const settings = useFinanceSettings()
  const { format } = useCurrency(settings)
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

  // Step 1 — Selection mode (Sprint C.5)
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('students')

  // Step 1a — Student selection (Students mode)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')

  // Step 1b — Grade selection (Grades mode — Sprint C.5)
  const [selectedGradeCodes, setSelectedGradeCodes] = useState<string[]>([])
  const [useAllGrades, setUseAllGrades] = useState(false)
  const { gradeCodes: availableGradeCodes } = useSchoolGradeOptions(schoolId)

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

  // Sprint C.5 — bulk preview (server-computed counts). Only fires on
  // Step 4 once the selection is non-empty AND at least one fee
  // structure is picked. Disabled on earlier steps to avoid spamming
  // the academics + finance services as the operator tweaks the form.
  const previewEnabled =
    step === 4 &&
    selectedFeeIds.length > 0 &&
    (selectionMode === 'students'
      ? selectedStudentIds.length > 0
      : useAllGrades || selectedGradeCodes.length > 0)
  const previewParams =
    selectionMode === 'grades'
      ? {
          selectionMode: 'grades' as const,
          gradeLevels: useAllGrades ? ['ALL'] : selectedGradeCodes,
          feeStructureIds: selectedFeeIds,
          billingPeriod: billingPeriod.trim() || undefined,
        }
      : {
          selectionMode: 'students' as const,
          studentIds: selectedStudentIds,
          feeStructureIds: selectedFeeIds,
          billingPeriod: billingPeriod.trim() || undefined,
        }
  const previewQuery = useBulkPreview(schoolId, previewParams, { enabled: previewEnabled })

  // Validation per step
  const canProceed = (s: Step): boolean => {
    switch (s) {
      case 1:
        return selectionMode === 'students'
          ? selectedStudentIds.length > 0
          : useAllGrades || selectedGradeCodes.length > 0
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

  // Submit — Sprint C.5 honors the new discriminated-union payload.
  const handleSubmit = async () => {
    setFormState('submitting')
    try {
      const basePayload = {
        feeStructureIds: selectedFeeIds,
        academicYear: academicYear.trim(),
        billingPeriod: billingPeriod.trim() || undefined,
        dueDate,
        notes: notes.trim() || undefined,
      }
      const payload =
        selectionMode === 'grades'
          ? {
              ...basePayload,
              selectionMode: 'grades' as const,
              gradeLevels: useAllGrades ? ['ALL'] : selectedGradeCodes,
            }
          : {
              ...basePayload,
              selectionMode: 'students' as const,
              studentIds: selectedStudentIds,
            }
      const response = await bulkGenerateMutation.mutateAsync(payload)
      // Normalize errors → {studentId, reason} so the result table renders
      // whether the backend returned the rich shape or just string messages
      const normalizedErrors = (response.errors ?? []).map(e =>
        typeof e === 'string' ? { studentId: '', reason: e } : e,
      )
      setResult({
        generated: response.generated ?? response.invoiceIds?.length ?? 0,
        skipped: response.skipped ?? 0,
        errors: normalizedErrors,
      })
      setFormState('done')
      const resolved =
        response.resolvedStudentCount ??
        response.generated ??
        response.invoiceIds?.length ??
        0
      toast.success(`Generated ${response.generated ?? 0} of ${resolved} invoices`)
    } catch (err: any) {
      // Sprint C.4 — backend returns 413 with code BULK_GENERATE_SYNC_LIMIT_EXCEEDED
      // when the resolved student count > 25. Surface the operator-actionable
      // message instead of the generic toast.
      const data = err?.response?.data
      if (data?.code === 'BULK_GENERATE_SYNC_LIMIT_EXCEEDED') {
        const n = data.resolvedStudentCount ?? '?'
        toast.error(
          `${n} students > sync limit of ${data.syncLimit ?? 25}. ` +
            `Async path (Sprint E) is not yet shipped — narrow the selection.`,
          { duration: 6000 },
        )
      } else {
        toast.error('Failed to generate invoices. Please try again.')
      }
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
    const submittingCount =
      previewQuery.data?.eligibleCount ??
      (selectionMode === 'students' ? selectedStudentIds.length : null)
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="w-8 h-8 text-[rgb(var(--action-secondary-fg))] animate-spin" />
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {submittingCount !== null
            ? `Generating invoices for ${submittingCount} students...`
            : 'Generating invoices...'}
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
        <CheckCircle2 className="w-12 h-12 mx-auto text-[rgb(var(--state-success-fg))]" />
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
                  <tr className="bg-[rgb(var(--background-secondary))] border-b border-[rgb(var(--border-primary))]">
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
                        <tr key={i} className="hover:bg-[rgb(var(--background-secondary))]">
                          <td className="px-3 py-2 text-sm text-[rgb(var(--text-primary))]">
                            {student?.fullName || (
                              <>
                                Student <UuidBadge value={err.studentId} />
                              </>
                            )}
                          </td>
                          <td className="px-3 py-2 text-sm text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]">
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
          {/* Step 1: Select Students or Grades — Sprint C.5 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
                  Select Recipients
                </h2>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">
                  Pick individual students, or generate for entire grade level(s).
                </p>
              </div>

              {/* Sprint C.5 — tab toggle between Students and Grades modes */}
              <div className="inline-flex rounded-lg border border-[rgb(var(--border-primary))] p-0.5 bg-[rgb(var(--background-secondary))]">
                <button
                  type="button"
                  onClick={() => setSelectionMode('students')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectionMode === 'students'
                      ? 'bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] shadow-sm'
                      : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                  }`}
                >
                  By Student
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('grades')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    selectionMode === 'grades'
                      ? 'bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] shadow-sm'
                      : 'text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))]'
                  }`}
                >
                  By Grade
                </button>
              </div>

              {/* By Student (existing flow) */}
              {selectionMode === 'students' && (
                <>
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <input
                      type="text"
                      placeholder="Search by name or student number..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[rgb(var(--text-secondary))]">
                    <span>{selectedStudentIds.length} selected</span>
                    <button
                      type="button"
                      onClick={toggleAllStudents}
                      className="text-[rgb(var(--action-secondary-fg))]  hover:underline"
                    >
                      {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>

                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] animate-spin" />
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
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[rgb(var(--background-secondary))] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.studentId)}
                            onChange={() => toggleAccount(student.studentId)}
                            className="rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
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
                </>
              )}

              {/* By Grade (Sprint C.5 new flow) */}
              {selectionMode === 'grades' && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useAllGrades}
                      onChange={(e) => {
                        setUseAllGrades(e.target.checked)
                        if (e.target.checked) setSelectedGradeCodes([])
                      }}
                      className="rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
                    />
                    <span className="text-sm text-[rgb(var(--text-primary))]">
                      All grade levels enabled at this school
                    </span>
                  </label>

                  {!useAllGrades && (
                    <>
                      <p className="text-xs text-[rgb(var(--text-tertiary))]">
                        {selectedGradeCodes.length} grade
                        {selectedGradeCodes.length === 1 ? '' : 's'} selected
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableGradeCodes.length === 0 ? (
                          <p className="text-xs text-[rgb(var(--text-tertiary))]">
                            Loading available grade levels…
                          </p>
                        ) : (
                          availableGradeCodes.map(code => {
                            const isSelected = selectedGradeCodes.includes(code)
                            return (
                              <button
                                key={code}
                                type="button"
                                onClick={() =>
                                  setSelectedGradeCodes(prev =>
                                    isSelected ? prev.filter(c => c !== code) : [...prev, code],
                                  )
                                }
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                  isSelected
                                    ? 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] border-transparent'
                                    : 'bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))]'
                                }`}
                              >
                                {code}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </>
                  )}

                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    Students are resolved from the academics service at submit time.
                    The preview on Step 4 shows the exact count + duplicate skips before
                    you commit. Sync limit is 25 students.
                  </p>
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
                  <Loader2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] animate-spin" />
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
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[rgb(var(--background-secondary))] cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeeIds.includes(fee.id)}
                        onChange={() => toggleFee(fee.id)}
                        className="rounded border-[rgb(var(--border-primary))] text-[rgb(var(--action-secondary-fg))] focus:ring-[rgb(var(--border-focus))]"
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
                          {format(fee.amount)}
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
                <div className="bg-[rgb(var(--background-secondary))] rounded-lg p-3">
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Per-student subtotal</span>
                    <span>{format(perStudentSubtotal)}</span>
                  </div>
                  {perStudentTax > 0 && (
                    <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                      <span>Per-student tax</span>
                      <span>{format(perStudentTax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-1 mt-1">
                    <span>Per-student total</span>
                    <span>{format(perStudentTotal)}</span>
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
                <Select
                  label="Academic Year"
                  required
                  value={academicYear}
                  onChange={(v) => setAcademicYear(v ?? '')}
                  placeholder="Select academic year"
                  options={academicYears.map((y) => ({
                    value: y.name,
                    label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
                  }))}
                />
                <div>
                  <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
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
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
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
                  className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
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

              {/* Sprint C.5 — server-resolved preview banner. Renders when
                  the bulk-preview query has resolved. Falls back to a
                  loading hint while in-flight, or to the local
                  selection-mode summary if the query is disabled. */}
              {selectionMode === 'grades' && previewQuery.isLoading && (
                <div className="border border-[rgb(var(--border-primary))] rounded-lg px-4 py-3 bg-[rgb(var(--background-secondary))] flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--text-tertiary))]" />
                  <span className="text-xs text-[rgb(var(--text-tertiary))]">
                    Resolving students from selected grade(s)…
                  </span>
                </div>
              )}
              {previewQuery.data && (
                <div className="border border-[rgb(var(--border-primary))] rounded-lg px-4 py-3 bg-[rgb(var(--background-secondary))] space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[rgb(var(--text-secondary))]">Resolved students</span>
                    <span className="font-semibold text-[rgb(var(--text-primary))]">
                      {previewQuery.data.studentCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[rgb(var(--text-secondary))]">Will generate</span>
                    <span className="font-semibold text-[rgb(var(--state-success-fg))]">
                      {previewQuery.data.eligibleCount}
                    </span>
                  </div>
                  {previewQuery.data.duplicateCount > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[rgb(var(--text-secondary))]">Skipped (duplicates)</span>
                      <span className="font-semibold text-[rgb(var(--state-warning-fg))]">
                        {previewQuery.data.duplicateCount}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[rgb(var(--border-primary))]">
                    <span className="text-[rgb(var(--text-tertiary))]">Estimated time</span>
                    <span className="text-[rgb(var(--text-tertiary))]">
                      ~{previewQuery.data.estimatedDurationSec}s
                    </span>
                  </div>
                  {previewQuery.data.studentCount > 25 && (
                    <div className="mt-2 pt-2 border-t border-[rgb(var(--border-primary))] flex items-start gap-2 text-xs text-[rgb(var(--state-warning-fg))]">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        {previewQuery.data.studentCount} students exceeds the 25-student
                        sync limit. Async path (Sprint E) is not yet shipped — narrow
                        the selection before submitting.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="border border-[rgb(var(--border-primary))] rounded-lg divide-y divide-[rgb(var(--border-primary))]">
                {/* Students count — local view (not server-resolved) */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    <span className="text-sm text-[rgb(var(--text-secondary))]">
                      {selectionMode === 'grades' ? 'Grade selection' : 'Students'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {selectionMode === 'grades'
                      ? useAllGrades
                        ? 'All grades'
                        : `${selectedGradeCodes.length} grade${selectedGradeCodes.length === 1 ? '' : 's'}`
                      : selectedStudentIds.length}
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
                          {format(fee.amount)}
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
                        {formatDate(dueDate, settings)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="px-4 py-3 bg-[rgb(var(--background-secondary))]">
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Per-student total</span>
                    <span>{format(perStudentTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                    <span>Number of students</span>
                    <span>&times; {selectedStudentIds.length}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-2 mt-2">
                    <span>Grand Total</span>
                    <span>{format(grandTotal)}</span>
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
            <Button
              onClick={handleSubmit}
              disabled={
                !canProceed(step) ||
                // Sprint C.5 — block submit when the server preview says
                // we'd exceed the 25-student sync limit. Avoids 413.
                (previewQuery.data ? previewQuery.data.studentCount > 25 : false)
              }
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Generate{' '}
              {previewQuery.data
                ? `${previewQuery.data.eligibleCount} Invoice${previewQuery.data.eligibleCount === 1 ? '' : 's'}`
                : selectionMode === 'students'
                  ? `${selectedStudentIds.length} Invoice${selectedStudentIds.length === 1 ? '' : 's'}`
                  : 'Invoices'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
