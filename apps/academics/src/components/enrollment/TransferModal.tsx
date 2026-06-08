/**
 * TransferModal Component
 *
 * Modal for transferring a student to another school.
 */

import { useState } from 'react'
import { X, Loader2, ArrowRightLeft } from 'lucide-react'
import { useTransferStudent } from '../../hooks/useEnrollments'
import type { EnrollmentResponseDto } from '../../services/academics.service'

interface TransferModalProps {
  open: boolean
  onClose: () => void
  enrollment: EnrollmentResponseDto
  schoolId: string
  yearId: string
}

export function TransferModal({
  open,
  onClose,
  enrollment,
  schoolId,
  yearId,
}: TransferModalProps) {
  const transferMutation = useTransferStudent()
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [destinationSchoolId, setDestinationSchoolId] = useState('')
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!destinationSchoolId) return
    await transferMutation.mutateAsync({
      schoolId,
      yearId,
      studentId: enrollment.studentId,
      data: {
        newSchoolId: destinationSchoolId,
        effectiveDate: transferDate,
        transferReason: reason || undefined,
        notes: notes || undefined,
      },
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-border-secondary shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-[rgb(var(--state-info-fg))]" />
            <h3 className="text-lg font-semibold text-text-primary">
              Transfer Student
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            Transfer this student to another school within your district.
            A new enrollment record will be created at the destination school.
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Transfer Date *
            </label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Destination School ID *
            </label>
            <input
              type="text"
              value={destinationSchoolId}
              onChange={(e) => setDestinationSchoolId(e.target.value)}
              placeholder="Enter school ID"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
            <p className="text-xs text-text-tertiary mt-1">
              The UUID of the destination school within your district
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Optional reason for transfer"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={transferMutation.isPending || !destinationSchoolId}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-fg))] hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {transferMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Transfer Student
          </button>
        </div>
      </div>
    </div>
  )
}
