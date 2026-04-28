/**
 * EditStaffModal Component
 *
 * Modal for editing an existing staff member with form validation.
 * Features dirty form warning when closing with unsaved changes.
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateStaffSchema, type UpdateStaffDto, type StaffResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { staffService } from '../../services/staff.service'
import { useDepartments } from './wizard/steps/AssignmentStep'
import { parseApiError } from '../../services/people.service'

export interface EditStaffModalProps {
  open: boolean
  onClose: () => void
  staff: StaffResponseDto | null
}

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'principal', label: 'Principal' },
  { value: 'vice_principal', label: 'Vice Principal' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'admin_staff', label: 'Admin Staff' },
  { value: 'support_staff', label: 'Support Staff' },
  { value: 'it_staff', label: 'IT Staff' },
  { value: 'substitute', label: 'Substitute' },
  { value: 'contractor', label: 'Contractor' },
] as const

const EMPLOYMENT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'retired', label: 'Retired' },
  { value: 'resigned', label: 'Resigned' },
] as const

// Sprint B.9 — 5 S4.1 IEMIS Staff fields. These shipped on the backend in
// April 2026 (Sprint 4 S4.1 — emisStaffId 16-digit format, S4.6 validator)
// but were never wired into the EditStaffModal until now.
const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const

const APPOINTMENT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'contract', label: 'Contract' },
  { value: 'honorary', label: 'Honorary' },
  { value: 'volunteer', label: 'Volunteer' },
] as const

// Common ISO-3166 alpha-3 codes for the staff nationality select. Nepal first
// since that's the pilot market; canonical alphabetical thereafter. Operators
// can type any alpha-3 — the schema validates length+format, not value.
const NATIONALITY_OPTIONS = [
  { value: 'NPL', label: 'Nepal (NPL)' },
  { value: 'IND', label: 'India (IND)' },
  { value: 'BTN', label: 'Bhutan (BTN)' },
  { value: 'BGD', label: 'Bangladesh (BGD)' },
  { value: 'CHN', label: 'China (CHN)' },
  { value: 'PAK', label: 'Pakistan (PAK)' },
  { value: 'USA', label: 'United States (USA)' },
  { value: 'GBR', label: 'United Kingdom (GBR)' },
  { value: 'AUS', label: 'Australia (AUS)' },
  { value: 'CAN', label: 'Canada (CAN)' },
  { value: 'OTHER', label: 'Other' },
] as const

export function EditStaffModal({ open, onClose, staff }: EditStaffModalProps) {
  const queryClient = useQueryClient()
  const firstInputRef = useRef<HTMLInputElement>(null)
  const { data: departments = [], isLoading: loadingDepts } = useDepartments(staff?.primarySchoolId || undefined)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateStaffDto>({
    resolver: zodResolver(updateStaffSchema),
  })

  // Reset form when staff changes or modal opens
  useEffect(() => {
    if (open && staff) {
      reset({
        firstName: staff.firstName,
        lastSurname: staff.lastSurname,
        phone: staff.phone || '',
        role: staff.role,
        departmentId: staff.departmentId || '',
        title: staff.title || '',
        employmentStatus: staff.employmentStatus,
        // Sprint B.9 — IEMIS Staff fields (S4.1 backend, never wired to UI)
        emisStaffId: (staff as any).emisStaffId || '',
        nationality: (staff as any).nationality || '',
        maritalStatus: (staff as any).maritalStatus || undefined,
        appointmentType: (staff as any).appointmentType || undefined,
        appointmentDate: (staff as any).appointmentDate || '',
      } as UpdateStaffDto)
    }
  }, [open, staff, reset])

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

  const handleClose = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      )
      if (!confirmed) return
    }
    onClose()
  }

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStaffDto) => {
      if (!staff) throw new Error('No staff member to update')
      return staffService.updateStaff(staff.staffId, data)
    },
    onSuccess: () => {
      toast.success('Staff member updated successfully')
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdateStaffDto, { message })
        })
      } else {
        toast.error(parsed.message)
      }
    },
  })

  const onSubmit = handleSubmit((data) => updateMutation.mutate(data))

  if (!staff) return null

  const inputClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors
    ${hasError ? 'border-red-500' : 'border-border-secondary'}
  `

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Staff Member"
      description={`Update information for ${staff.firstName} ${staff.lastSurname}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1.5">
            Email Address
          </label>
          <div className="px-3 py-2 rounded-lg border border-border-secondary bg-surface-tertiary text-text-secondary">
            {staff.email}
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Email address cannot be changed
          </p>
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-1.5">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              ref={(e) => {
                register('firstName').ref(e)
                if (e) firstInputRef.current = e
              }}
              className={inputClass(!!errors.firstName)}
              placeholder="John"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastSurname" className="block text-sm font-medium text-text-primary mb-1.5">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastSurname"
              type="text"
              {...register('lastSurname')}
              className={inputClass(!!errors.lastSurname)}
              placeholder="Doe"
              disabled={isSubmitting}
            />
            {errors.lastSurname && (
              <p className="mt-1 text-sm text-red-500">{errors.lastSurname.message}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-1.5">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={inputClass(!!errors.phone)}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Role & Employment Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-1.5">
              Role
            </label>
            <select
              id="role"
              {...register('role')}
              className={inputClass(!!errors.role)}
              disabled={isSubmitting}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-red-500">{errors.role.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="employmentStatus" className="block text-sm font-medium text-text-primary mb-1.5">
              Employment Status
            </label>
            <select
              id="employmentStatus"
              {...register('employmentStatus')}
              className={inputClass(!!errors.employmentStatus)}
              disabled={isSubmitting}
            >
              {EMPLOYMENT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.employmentStatus && (
              <p className="mt-1 text-sm text-red-500">{errors.employmentStatus.message}</p>
            )}
          </div>
        </div>

        {/* Department & Title */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-text-primary mb-1.5">
              Department
            </label>
            <select
              id="departmentId"
              {...register('departmentId')}
              className={inputClass(!!errors.departmentId)}
              disabled={isSubmitting || loadingDepts}
            >
              <option value="">{loadingDepts ? 'Loading...' : 'Select department...'}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
            {errors.departmentId && (
              <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-text-primary mb-1.5">
              Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className={inputClass(!!errors.title)}
              placeholder="Senior Teacher"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
        </div>

        {/* IEMIS Identity (Sprint B.9) — Nepal CEHRD register fields */}
        <div className="pt-4 border-t border-border-secondary">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            IEMIS / CEHRD Identity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="emisStaffId" className="block text-sm font-medium text-text-primary mb-1.5">
                IEMIS Staff ID
              </label>
              <input
                id="emisStaffId"
                type="text"
                inputMode="numeric"
                {...register('emisStaffId')}
                className={inputClass(!!errors.emisStaffId)}
                placeholder="16-digit CEHRD ID"
                maxLength={16}
                disabled={isSubmitting}
              />
              {errors.emisStaffId && (
                <p className="mt-1 text-sm text-red-500">{errors.emisStaffId.message}</p>
              )}
              <p className="mt-1 text-xs text-text-tertiary">
                CEHRD-issued 16-digit identifier (V1 placeholder format).
              </p>
            </div>
            <div>
              <label htmlFor="nationality" className="block text-sm font-medium text-text-primary mb-1.5">
                Nationality
              </label>
              <select
                id="nationality"
                {...register('nationality')}
                className={inputClass(!!errors.nationality)}
                disabled={isSubmitting}
              >
                <option value="">Select…</option>
                {NATIONALITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.nationality && (
                <p className="mt-1 text-sm text-red-500">{errors.nationality.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="maritalStatus" className="block text-sm font-medium text-text-primary mb-1.5">
                Marital Status
              </label>
              <select
                id="maritalStatus"
                {...register('maritalStatus')}
                className={inputClass(!!errors.maritalStatus)}
                disabled={isSubmitting}
              >
                <option value="">Select…</option>
                {MARITAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.maritalStatus && (
                <p className="mt-1 text-sm text-red-500">{errors.maritalStatus.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="appointmentType" className="block text-sm font-medium text-text-primary mb-1.5">
                Appointment Type
              </label>
              <select
                id="appointmentType"
                {...register('appointmentType')}
                className={inputClass(!!errors.appointmentType)}
                disabled={isSubmitting}
              >
                <option value="">Select…</option>
                {APPOINTMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {errors.appointmentType && (
                <p className="mt-1 text-sm text-red-500">{errors.appointmentType.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="appointmentDate" className="block text-sm font-medium text-text-primary mb-1.5">
              Appointment Date
            </label>
            <input
              id="appointmentDate"
              type="date"
              {...register('appointmentDate')}
              className={inputClass(!!errors.appointmentDate)}
              disabled={isSubmitting}
            />
            {errors.appointmentDate && (
              <p className="mt-1 text-sm text-red-500">{errors.appointmentDate.message}</p>
            )}
            <p className="mt-1 text-xs text-text-tertiary">
              Official appointment date per CEHRD register.
            </p>
          </div>
        </div>

        {isDirty && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </p>
        )}

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
