/**
 * HomeroomEditModal
 *
 * Edit a homeroom's class teacher, co-teacher, display name, and capacity.
 * The grade + section number are NOT editable here — a homeroom's grade is
 * write-once (changing it would orphan the roster's grade scoping).
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { Modal, ModalFooter, Button, Field, Input, Select } from '@edforge/ui'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useUpdateHomeroom } from '../../hooks/useHomeroom'
import type { SectionResponseDto, UpdateSectionDto } from '../../services/academics.service'

export interface HomeroomEditModalProps {
  open: boolean
  onClose: () => void
  schoolId: string
  homeroom: SectionResponseDto
}

const DEFAULT_MAX = 40

export function HomeroomEditModal({ open, onClose, schoolId, homeroom }: HomeroomEditModalProps) {
  const { data: staffData } = useSchoolStaff(schoolId)
  const teachers = useMemo(() => flattenStaffData(staffData), [staffData])
  const teacherOptions = useMemo(
    () => teachers.map((t) => ({ value: t.staffId, label: getStaffDisplayName(t) })),
    [teachers],
  )

  const update = useUpdateHomeroom()

  const [primaryTeacherId, setPrimaryTeacherId] = useState('')
  const [coTeacherId, setCoTeacherId] = useState('')
  const [sectionName, setSectionName] = useState('')
  const [maxEnrollment, setMaxEnrollment] = useState(DEFAULT_MAX)
  const [saving, setSaving] = useState(false)

  // Reseed from the homeroom each time the modal opens.
  useEffect(() => {
    if (open) {
      setPrimaryTeacherId(homeroom.primaryTeacherId || '')
      setCoTeacherId(homeroom.coTeacherIds?.[0] || '')
      setSectionName(homeroom.sectionName || '')
      setMaxEnrollment(homeroom.maxEnrollment || DEFAULT_MAX)
      setSaving(false)
    }
  }, [open, homeroom])

  const effSchoolId = homeroom.schoolId || schoolId
  const homeroomLabel = homeroom.sectionName || `Homeroom ${homeroom.sectionNumber}`

  const handleSave = async () => {
    // Only studentId-free section fields; an empty co-teacher clears it ([]),
    // a present one sets it. gradeLevel/sectionNumber are intentionally omitted.
    const data: UpdateSectionDto = {
      sectionName: sectionName.trim() || undefined,
      primaryTeacherId: primaryTeacherId || undefined,
      coTeacherIds: coTeacherId ? [coTeacherId] : [],
      maxEnrollment,
    }
    setSaving(true)
    try {
      await update.mutateAsync({ sectionId: homeroom.sectionId, schoolId: effSchoolId, data })
      onClose()
    } catch {
      // useUpdateHomeroom toasts the error; keep the modal open for a retry.
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => {} : onClose}
      title={`Edit ${homeroomLabel}`}
      description="Update the class teacher, co-teacher, name, or capacity. The grade is fixed."
      size="lg"
      showCloseButton={!saving}
    >
      <div className="space-y-4">
        <Field label="Homeroom name">
          <Input
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder={`Homeroom ${homeroom.sectionNumber}`}
            disabled={saving}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Class teacher"
            required
            optionalText={null}
            value={primaryTeacherId || ''}
            onChange={(v) => setPrimaryTeacherId(v ?? '')}
            placeholder="Select teacher…"
            options={teacherOptions}
            disabled={saving}
            error={!primaryTeacherId ? 'Required' : undefined}
          />
          <Select
            label="Co-teacher"
            clearable
            value={coTeacherId || ''}
            onChange={(v) => setCoTeacherId(v ?? '')}
            placeholder="Optional…"
            options={teacherOptions.filter((t) => t.value !== primaryTeacherId)}
            disabled={saving}
          />
        </div>

        <Field label="Max capacity">
          <Input
            type="number"
            min={1}
            max={200}
            value={maxEnrollment}
            onChange={(e) => setMaxEnrollment(Number(e.target.value) || DEFAULT_MAX)}
            aria-label="Max enrollment"
            disabled={saving}
          />
        </Field>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !primaryTeacherId}
          className="min-w-32"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
