/**
 * TransferModal Component
 *
 * Modal for transferring a student to another school.
 */

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Textarea } from '@edforge/ui'
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Transfer Student"
      description="Transfer this student to another school within your district. A new enrollment record will be created at the destination school."
      size="md"
    >
      <div className="space-y-4">
        <Field label="Transfer Date" required>
          <Input
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
          />
        </Field>

        <Field
          label="Destination School ID"
          required
          helperText="The UUID of the destination school within your district"
        >
          <Input
            type="text"
            value={destinationSchoolId}
            onChange={(e) => setDestinationSchoolId(e.target.value)}
            placeholder="Enter school ID"
          />
        </Field>

        <Field label="Reason" optionalText={null}>
          <Input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional reason for transfer"
          />
        </Field>

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
          onClick={handleSubmit}
          disabled={transferMutation.isPending || !destinationSchoolId}
        >
          {transferMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Transfer Student
        </Button>
      </ModalFooter>
    </Modal>
  )
}
