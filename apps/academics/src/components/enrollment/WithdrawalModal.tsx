/**
 * WithdrawalModal Component
 *
 * Modal for withdrawing a student with reason, date, exit type descriptor, and notes.
 *
 * Sprint Alaska changes:
 * - Added exitWithdrawTypeDescriptor field (AK-2.7)
 * - Aligned with shared-types WithdrawStudentDto
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select, Textarea } from '@edforge/ui'
import { useWithdrawStudent } from '../../hooks/useEnrollments'
import { EXIT_WITHDRAW_TYPE_OPTIONS } from '../../schemas/edfi-descriptors'
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
  const [exitWithdrawType, setExitWithdrawType] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async () => {
    if (!reason || !exitWithdrawType) return
    await withdrawMutation.mutateAsync({
      schoolId,
      yearId,
      studentId: enrollment.studentId,
      data: {
        withdrawalDate,
        reason,
        notes: notes || undefined,
        exitWithdrawTypeDescriptor: exitWithdrawType,
      },
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Withdraw Student"
      description="This will withdraw the student from their current enrollment. This action can be reviewed later."
      size="md"
    >
      <div className="space-y-4">
        <Field label="Withdrawal Date" required>
          <Input
            type="date"
            value={withdrawalDate}
            onChange={(e) => setWithdrawalDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
          />
        </Field>

        {/* Ed-Fi Exit/Withdraw Type Descriptor */}
        <Select
          label="Exit Type"
          required
          value={exitWithdrawType}
          onChange={(v) => setExitWithdrawType(v ?? '')}
          placeholder="Select exit type..."
          helperText="Ed-Fi aligned exit/withdraw type for state reporting"
          options={EXIT_WITHDRAW_TYPE_OPTIONS}
        />

        <Select
          label="Reason"
          required
          value={reason}
          onChange={(v) => setReason(v ?? '')}
          placeholder="Select a reason..."
          options={withdrawalReasons}
        />

        <Field label="Notes" optionalText={null}>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes..."
            rows={3}
          />
        </Field>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleSubmit}
          disabled={withdrawMutation.isPending || !reason || !exitWithdrawType}
        >
          {withdrawMutation.isPending && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
          Withdraw Student
        </Button>
      </ModalFooter>
    </Modal>
  )
}
