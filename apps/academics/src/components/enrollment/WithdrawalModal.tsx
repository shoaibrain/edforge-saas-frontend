/**
 * WithdrawalModal Component
 *
 * Modal for withdrawing a student with reason, date, and notes.
 */

import { useState } from 'react'
import { X, Loader2, AlertTriangle } from 'lucide-react'
import { useWithdrawStudent } from '../../hooks/useEnrollments'
import type { EnrollmentResponseDto } from '../../services/academics.service'

interface WithdrawalModalProps {
  open: boolean
  onClose: () => void
  enrollment: EnrollmentResponseDto
  schoolId: string
  yearId: string
}

const withdrawalReasons = [
  { value: 'moved', label: 'Moved out of district' },
  { value: 'transferred', label: 'Transferred to another school' },
  { value: 'homeschool', label: 'Homeschooling' },
  { value: 'private_school', label: 'Private school' },
  { value: 'disciplinary', label: 'Disciplinary action' },
  { value: 'health', label: 'Health reasons' },
  { value: 'family', label: 'Family circumstances' },
  { value: 'other', label: 'Other' },
]

export function WithdrawalModal({
  open,
  onClose,
  enrollment,
  schoolId,
  yearId,
}: WithdrawalModalProps) {
  const withdrawMutation = useWithdrawStudent()
  const [withdrawalDate, setWithdrawalDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [reason, setReason] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!reason) return
    await withdrawMutation.mutateAsync({
      schoolId,
      yearId,
      studentId: enrollment.studentId,
      data: {
        withdrawalDate,
        reason,
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
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-text-primary">
              Withdraw Student
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-text-secondary">
            This will withdraw the student from their current enrollment. This action can be reviewed later.
          </p>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Withdrawal Date *
            </label>
            <input
              type="date"
              value={withdrawalDate}
              onChange={(e) => setWithdrawalDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Reason *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="">Select a reason...</option>
              {withdrawalReasons.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
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
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
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
            disabled={withdrawMutation.isPending || !reason}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Withdraw Student
          </button>
        </div>
      </div>
    </div>
  )
}
