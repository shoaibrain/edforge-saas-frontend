/**
 * Admin Invoice Management Page
 *
 * List, filter, generate, issue, and cancel invoices.
 * Supports bulk selection with bulk-issue action and overdue status display.
 * Route: /finance/billing/invoices
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Button,
  TanstackDataTable,
  createSelectColumn,
  createActionsColumn,
  type ColumnDef,
} from '@edforge/ui'
import {
  Plus,
  FileText,
  Loader2,
  Check,
  X,
  Eye,
  Users,
  Send,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import type { RowSelectionState } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoices,
  useGenerateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useBulkIssueInvoices,
  useFeeStructures,
  useAcademicYears,
} from '@edforge/finance-services'
import { formatNPR, type Invoice } from '@edforge/types'
import { formatDateDual } from '../../../utils/format-date'
import { StudentSearchInput } from '../../../components/billing/StudentSearchInput'
import { StatusBadge } from '../../../components/StatusBadge'

type InvoiceStatusFilter = '' | 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

/** Calculate how many days overdue an invoice is */
function getOverdueDays(dueDate: string | undefined): number {
  if (!dueDate) return 0
  const due = new Date(dueDate)
  const now = new Date()
  const diffMs = now.getTime() - due.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export default function InvoicesPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)

  // Row selection state (controlled by DataTable)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [showBulkIssueConfirm, setShowBulkIssueConfirm] = useState(false)

  // Cancel dialog state
  const [cancelTarget, setCancelTarget] = useState<{ id: string; invoiceNumber: string } | null>(null)

  const { data: invoiceData, isLoading } = useInvoices(schoolId ?? '', {
    ...(statusFilter && { status: statusFilter as any }),
  })
  const issueMutation = useIssueInvoice(schoolId ?? '')
  const cancelMutation = useCancelInvoice(schoolId ?? '')
  const bulkIssueMutation = useBulkIssueInvoices(schoolId ?? '')

  const invoices = invoiceData?.items ?? []

  // Selected draft invoice IDs for bulk issue
  const selectedDraftIds = useMemo(() => {
    return Object.keys(rowSelection)
      .filter((id) => rowSelection[id])
      .filter((id) => {
        const inv = invoices.find((i) => i.id === id)
        return inv?.status === 'draft'
      })
  }, [rowSelection, invoices])

  const handleIssue = async (invoiceId: string) => {
    try {
      await issueMutation.mutateAsync(invoiceId)
      toast.success('Invoice issued successfully')
    } catch {
      toast.error('Failed to issue invoice')
    }
  }

  const openCancelDialog = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId)
    setCancelTarget({
      id: invoiceId,
      invoiceNumber: inv?.invoiceNumber || invoiceId.slice(0, 8),
    })
  }

  const handleConfirmCancel = async (reason: string) => {
    if (!cancelTarget) return
    try {
      await cancelMutation.mutateAsync({ invoiceId: cancelTarget.id, reason })
      toast.success('Invoice cancelled')
      setCancelTarget(null)
    } catch {
      toast.error('Failed to cancel invoice')
    }
  }

  const handleBulkIssue = async () => {
    try {
      const result = await bulkIssueMutation.mutateAsync({ invoiceIds: selectedDraftIds })
      const issued = result.issued ?? selectedDraftIds.length
      const skipped = result.skipped ?? 0
      toast.success(`Issued ${issued} invoices.${skipped > 0 ? ` ${skipped} skipped.` : ''}`)
      setRowSelection({})
      setShowBulkIssueConfirm(false)
    } catch {
      toast.error('Failed to issue invoices')
      setShowBulkIssueConfirm(false)
    }
  }

  // -- Column definitions --
  const columns = useMemo<ColumnDef<Invoice, unknown>[]>(
    () => [
      createSelectColumn<Invoice>(),
      {
        accessorKey: 'invoiceNumber',
        header: 'Invoice #',
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {row.original.invoiceNumber || row.original.id.slice(0, 8)}
          </span>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'studentName',
        header: 'Student',
        cell: ({ row }) => {
          const invoice = row.original
          return invoice.studentName ? (
            <span className="text-[rgb(var(--text-secondary))]">{invoice.studentName}</span>
          ) : (
            <span
              className="text-[rgb(var(--text-tertiary))] font-mono text-xs"
              title={invoice.studentId}
            >
              {invoice.studentId?.slice(0, 8) || '-'}
            </span>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'grandTotal',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium text-[rgb(var(--text-primary))]">
            {formatNPR(row.original.grandTotal)}
          </span>
        ),
        meta: { align: 'right' as const },
        enableSorting: true,
      },
      {
        accessorKey: 'dueDate',
        header: 'Due Date',
        cell: ({ row }) => {
          const invoice = row.original
          const overdueDays = invoice.status === 'overdue' ? getOverdueDays(invoice.dueDate) : 0
          return (
            <div className="flex items-center gap-1.5 text-[rgb(var(--text-secondary))]">
              <span>{invoice.dueDate ? formatDateDual(invoice.dueDate) : '-'}</span>
              {invoice.status === 'overdue' && overdueDays > 0 && (
                <span className="inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                  <Clock className="w-3 h-3" />
                  Overdue by {overdueDays}d
                </span>
              )}
            </div>
          )
        },
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
        meta: { align: 'center' as const },
        enableSorting: true,
      },
      createActionsColumn<Invoice>({
        size: 120,
        cell: ({ row }) => {
          const invoice = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate({ to: `/invoices/${invoice.id}` as string })}
                className="p-1.5 rounded-md hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
                title="View"
              >
                <Eye className="w-4 h-4" />
              </button>
              {invoice.status === 'draft' && (
                <>
                  <button
                    onClick={() => handleIssue(invoice.id)}
                    disabled={issueMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-green-50 text-green-600 dark:hover:bg-green-900/20 dark:text-green-400"
                    title="Issue"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openCancelDialog(invoice.id)}
                    disabled={cancelMutation.isPending}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 dark:text-red-400"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              )}
              {(invoice.status === 'issued' || invoice.status === 'overdue') && (
                <button
                  onClick={() => openCancelDialog(invoice.id)}
                  disabled={cancelMutation.isPending}
                  className="p-1.5 rounded-md hover:bg-red-50 text-red-500 dark:hover:bg-red-900/20 dark:text-red-400"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        },
      }),
    ],
    [navigate, issueMutation.isPending, cancelMutation.isPending]
  )

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to manage invoices.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Invoices</h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            Generate, issue, and manage student invoices.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate({ to: '/invoices/bulk-generate' as string })}
          >
            <Users className="w-4 h-4 mr-1.5" />
            Bulk Generate
          </Button>
          <Button onClick={() => setShowGenerateForm(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* DataTable */}
      <TanstackDataTable<Invoice>
        columns={columns}
        data={invoices}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        enableRowSelection={true}
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        enableSorting={true}
        pagination={{ pageSize: 20 }}
        searchPlaceholder="Search by invoice # or student..."
        toolbarExtra={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvoiceStatusFilter)}
            className="px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        }
        bulkActions={[
          {
            label: `Issue Selected (${selectedDraftIds.length})`,
            onClick: () => setShowBulkIssueConfirm(true),
            icon: <Send className="w-4 h-4" />,
            variant: 'primary',
            disabled: selectedDraftIds.length === 0 || bulkIssueMutation.isPending,
          },
        ]}
        emptyState={{
          icon: <FileText className="w-10 h-10 text-[rgb(var(--text-tertiary))] opacity-40" />,
          title: 'No invoices found',
          description: 'Generate your first invoice to get started.',
          action: {
            label: 'Generate Invoice',
            onClick: () => setShowGenerateForm(true),
          },
        }}
      />

      {/* Generate Invoice Modal */}
      {showGenerateForm && (
        <GenerateInvoiceModal
          schoolId={schoolId}
          onClose={() => setShowGenerateForm(false)}
        />
      )}

      {/* Bulk Issue Confirmation Modal */}
      <AnimatePresence>
        {showBulkIssueConfirm && (
          <BulkIssueConfirmModal
            count={selectedDraftIds.length}
            isPending={bulkIssueMutation.isPending}
            onConfirm={handleBulkIssue}
            onCancel={() => setShowBulkIssueConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Cancel Invoice Dialog */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelInvoiceDialog
            invoiceNumber={cancelTarget.invoiceNumber}
            isPending={cancelMutation.isPending}
            onConfirm={handleConfirmCancel}
            onClose={() => setCancelTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// CANCEL INVOICE DIALOG
// ============================================================================

function CancelInvoiceDialog({
  invoiceNumber,
  isPending,
  onConfirm,
  onClose,
}: {
  invoiceNumber: string
  isPending: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    },
    [isPending, onClose]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Cancel Invoice {invoiceNumber}?
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              This action is <span className="font-semibold text-red-600 dark:text-red-400">irreversible</span>.
              The invoice will be permanently cancelled and cannot be re-issued.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
            Reason for cancellation *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter the reason for cancelling this invoice..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Keep Invoice
          </Button>
          <Button
            onClick={() => onConfirm(reason.trim())}
            disabled={isPending || !reason.trim()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <X className="w-4 h-4 mr-1.5" />
            )}
            Cancel Invoice
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// BULK ISSUE CONFIRMATION MODAL
// ============================================================================

function BulkIssueConfirmModal({
  count,
  isPending,
  onConfirm,
  onCancel,
}: {
  count: number
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--text-primary))]">
              Issue {count} invoices?
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] mt-1">
              Students will be able to see and pay these invoices once issued.
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : (
              <Check className="w-4 h-4 mr-1.5" />
            )}
            Issue {count} Invoices
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ============================================================================
// GENERATE INVOICE MODAL
// ============================================================================

function GenerateInvoiceModal({
  schoolId,
  onClose,
}: {
  schoolId: string
  onClose: () => void
}) {
  const generateMutation = useGenerateInvoice(schoolId)
  const { data: feeStructureData } = useFeeStructures(schoolId)
  const { data: academicYearsData } = useAcademicYears(schoolId)
  const feeStructures = Array.isArray(feeStructureData) ? feeStructureData : []

  // Filter to active/planning years, sorted most recent first
  const academicYears = useMemo(() => {
    const raw = Array.isArray(academicYearsData) ? academicYearsData : []
    return raw
      .filter((y) => y.status === 'active' || y.status === 'planning')
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
  }, [academicYearsData])

  const [selectedStudent, setSelectedStudent] = useState<{ studentId: string; studentName: string } | null>(null)
  const [selectedFees, setSelectedFees] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  // Auto-select current academic year
  useEffect(() => {
    if (!academicYear && academicYears.length > 0) {
      const current = academicYears.find((y) => y.isCurrent)
      setAcademicYear(current?.name ?? academicYears[0].name)
    }
  }, [academicYears, academicYear])
  const [billingPeriod, setBillingPeriod] = useState('')
  const [notes, setNotes] = useState('')

  const selectedFeeStructures = feeStructures.filter((f: any) => selectedFees.includes(f.id))
  const subtotal = selectedFeeStructures.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)
  const taxTotal = selectedFeeStructures.reduce(
    (sum: number, f: any) => sum + ((f.amount || 0) * (f.taxRate || 0)) / 100,
    0
  )
  const grandTotal = subtotal + taxTotal

  const handleSubmit = async () => {
    if (!selectedStudent || selectedFees.length === 0 || !dueDate || !academicYear) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      await generateMutation.mutateAsync({
        studentId: selectedStudent.studentId,
        feeStructureIds: selectedFees,
        dueDate,
        academicYear,
        billingPeriod: billingPeriod || undefined,
        notes: notes || undefined,
      })
      toast.success('Invoice generated')
      onClose()
    } catch {
      toast.error('Failed to generate invoice')
    }
  }

  const toggleFee = (feeId: string) => {
    setSelectedFees((prev) =>
      prev.includes(feeId) ? prev.filter((id) => id !== feeId) : [...prev, feeId]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[rgb(var(--surface-primary))] rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6"
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          Generate Invoice
        </h2>

        <div className="space-y-4">
          {/* Student */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Student *
            </label>
            <StudentSearchInput
              schoolId={schoolId}
              value={selectedStudent}
              onChange={setSelectedStudent}
            />
          </div>

          {/* Fee Structures */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Fee Structures *
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-[rgb(var(--border-primary))] rounded-lg p-2">
              {feeStructures.length === 0 ? (
                <p className="text-xs text-[rgb(var(--text-tertiary))] p-2">No fee structures configured.</p>
              ) : (
                feeStructures.map((fee: any) => (
                  <label
                    key={fee.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[rgb(var(--surface-secondary))] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedFees.includes(fee.id)}
                      onChange={() => toggleFee(fee.id)}
                      className="rounded border-[rgb(var(--border-primary))]"
                    />
                    <span className="flex-1 text-sm text-[rgb(var(--text-primary))]">{fee.name}</span>
                    <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                      {formatNPR(fee.amount)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Academic Year + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
                Academic Year *
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
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
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
              />
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Billing Period
            </label>
            <input
              type="text"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              placeholder="e.g., First Term, Admission"
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] resize-none"
            />
          </div>

          {/* Totals Preview */}
          {selectedFees.length > 0 && (
            <div className="bg-[rgb(var(--surface-secondary))] rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                <span>Subtotal</span>
                <span>{formatNPR(subtotal)}</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between text-sm text-[rgb(var(--text-secondary))]">
                  <span>Tax</span>
                  <span>{formatNPR(taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold text-[rgb(var(--text-primary))] border-t border-[rgb(var(--border-primary))] pt-1">
                <span>Grand Total</span>
                <span>{formatNPR(grandTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
            ) : null}
            Generate Invoice
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
