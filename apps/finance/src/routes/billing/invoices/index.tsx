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
import { Button } from '@edforge/ui'
import {
  Plus,
  FileText,
  Loader2,
  Search,
  Check,
  X,
  Eye,
  Users,
  Send,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useAppStore } from '../../../stores/app.store'
import {
  useInvoices,
  useGenerateInvoice,
  useIssueInvoice,
  useCancelInvoice,
  useBulkIssueInvoices,
  useFeeStructures,
} from '@edforge/finance-services'
import { formatNPR } from '@edforge/types'
import { formatDate } from '../../../utils/format-date'

type InvoiceStatusFilter = '' | 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    issued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.draft}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

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
  const [searchTerm, setSearchTerm] = useState('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
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
  const filtered = searchTerm
    ? invoices.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          inv.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : invoices

  // Selected draft invoices for bulk issue
  const selectedDraftIds = useMemo(() => {
    return [...selectedIds].filter((id) => {
      const inv = invoices.find((i) => i.id === id)
      return inv?.status === 'draft'
    })
  }, [selectedIds, invoices])

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
      setSelectedIds(new Set())
      setShowBulkIssueConfirm(false)
    } catch {
      toast.error('Failed to issue invoices')
      setShowBulkIssueConfirm(false)
    }
  }

  // Toggle selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((inv) => inv.id)))
    }
  }

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
            onClick={() => navigate({ to: '/finance/billing/invoices/bulk-generate' as string })}
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

      {/* Filters + Bulk actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search by invoice # or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
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

        {/* Bulk issue button — visible when draft invoices are selected */}
        {selectedDraftIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button
              onClick={() => setShowBulkIssueConfirm(true)}
              disabled={bulkIssueMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {bulkIssueMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Send className="w-4 h-4 mr-1.5" />
              )}
              Bulk Issue ({selectedDraftIds.length})
            </Button>
          </motion.div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 mx-auto mb-3 text-[rgb(var(--text-tertiary))] opacity-40" />
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">No invoices found</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">
            Generate your first invoice to get started.
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-[rgb(var(--border-primary))] rounded-lg overflow-hidden"
        >
          <table className="w-full">
            <thead>
              <tr className="bg-[rgb(var(--surface-secondary))] border-b border-[rgb(var(--border-primary))]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Student</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Due Date</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border-primary))]">
              {filtered.map((invoice) => {
                const overdueDays = invoice.status === 'overdue' ? getOverdueDays(invoice.dueDate) : 0
                return (
                  <tr key={invoice.id} className="hover:bg-[rgb(var(--surface-secondary))] transition-colors">
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(invoice.id)}
                        onChange={() => toggleSelect(invoice.id)}
                        className="rounded border-[rgb(var(--border-primary))] text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[rgb(var(--text-primary))]">
                      {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                      {invoice.studentName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-[rgb(var(--text-primary))]">
                      {formatNPR(invoice.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[rgb(var(--text-secondary))]">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                        </span>
                        {invoice.status === 'overdue' && overdueDays > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-xs text-red-600 dark:text-red-400">
                            <Clock className="w-3 h-3" />
                            Overdue by {overdueDays}d
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {statusBadge(invoice.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate({ to: `/finance/billing/invoices/${invoice.id}` as string })}
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </motion.div>
      )}

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
  const feeStructures = Array.isArray(feeStructureData) ? feeStructureData : []

  const [studentId, setStudentId] = useState('')
  const [selectedFees, setSelectedFees] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [academicYear, setAcademicYear] = useState('')
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
    if (!studentId || selectedFees.length === 0 || !dueDate || !academicYear) {
      toast.error('Please fill all required fields')
      return
    }
    try {
      await generateMutation.mutateAsync({
        studentId,
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
          {/* Student ID */}
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1">
              Student ID *
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID"
              className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
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
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2081/82"
                className="w-full px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--surface-primary))] text-[rgb(var(--text-primary))]"
              />
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
