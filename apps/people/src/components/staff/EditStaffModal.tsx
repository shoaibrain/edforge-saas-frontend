/**
 * EditStaffModal Component
 *
 * Modal for editing an existing staff member with form validation.
 * Features dirty form warning when closing with unsaved changes.
 */

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateStaffSchema, type UpdateStaffDto, type StaffResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { TextField, SelectField, DateField } from '@edforge/forms'
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

// Empty input → undefined so Zod's optional path runs and the format/enum
// check doesn't fire on a cleared field.
const emptyToUndefined = { setValueAs: (v: string) => (v === '' ? undefined : v) }

export function EditStaffModal({ open, onClose, staff }: EditStaffModalProps) {
  const queryClient = useQueryClient()
  const { data: departments = [], isLoading: loadingDepts } = useDepartments(staff?.primarySchoolId || undefined)

  const methods = useForm<UpdateStaffDto>({
    resolver: zodResolver(updateStaffSchema),
  })

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = methods

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

  // Native-select base styling for the three IEMIS selects that rely on
  // register() setValueAs (empty → undefined). The shared SelectField is
  // Controller-based and cannot apply setValueAs, so keeping native preserves
  // the optional-field validation behavior exactly.
  const nativeSelectClass = (hasError: boolean) => `
    w-full px-3 py-2 rounded-lg border
    bg-surface-secondary text-text-primary
    placeholder:text-text-tertiary
    focus:outline-none focus:ring-2 focus:ring-accent-primary/20
    transition-colors
    ${hasError ? 'border-[rgb(var(--state-danger-border))]' : 'border-border-secondary'}
  `

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Staff Member"
      description={`Update information for ${staff.firstName} ${staff.lastSurname}`}
      size="2xl"
    >
      <FormProvider {...methods}>
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

          {/* Name + Phone Row (3-col) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <TextField
              name="firstName"
              label="First Name"
              type="text"
              placeholder="John"
              required
              autoFocus
              disabled={isSubmitting}
            />
            <TextField
              name="lastSurname"
              label="Last Name"
              type="text"
              placeholder="Doe"
              required
              disabled={isSubmitting}
            />
            <TextField
              name="phone"
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />
          </div>

          {/* Role & Employment Status */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="role"
              label="Role"
              options={ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={isSubmitting}
            />
            <SelectField
              name="employmentStatus"
              label="Employment Status"
              options={EMPLOYMENT_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              disabled={isSubmitting}
            />
          </div>

          {/* Department & Title */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="departmentId"
              label="Department"
              placeholder={loadingDepts ? 'Loading...' : 'Select department...'}
              options={departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))}
              disabled={isSubmitting || loadingDepts}
            />
            <TextField
              name="title"
              label="Title"
              type="text"
              placeholder="Senior Teacher"
              disabled={isSubmitting}
            />
          </div>

          {/* IEMIS Identity (Sprint B.9) — Nepal CEHRD register fields */}
          <div className="pt-4 border-t border-border-secondary">
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              IEMIS / CEHRD Identity
            </h3>
            <p className="text-xs text-text-tertiary mb-4">
              Optional — populate to support CEHRD Flash-II Staff register exports.
            </p>

            {/* Row 1 — IEMIS Staff ID + Nationality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name="emisStaffId"
                label="IEMIS Staff ID"
                type="text"
                placeholder="16-digit CEHRD ID"
                maxLength={16}
                disabled={isSubmitting}
                rules={emptyToUndefined}
                helperText="CEHRD-issued 16-digit identifier (V1 placeholder format)."
              />
              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-text-primary mb-1.5">
                  Nationality
                </label>
                <select
                  // allow-native-form-control: setValueAs (empty → undefined) keeps the optional alpha-3 check from firing on a cleared field; the Controller-based SelectField cannot apply setValueAs
                  id="nationality"
                  {...register('nationality', emptyToUndefined)}
                  className={nativeSelectClass(!!errors.nationality)}
                  disabled={isSubmitting}
                >
                  <option value="">Select…</option>
                  {NATIONALITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.nationality && (
                  <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.nationality.message}</p>
                )}
              </div>
            </div>

            {/* Row 2 — Marital Status / Appointment Type / Appointment Date (3-col) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label htmlFor="maritalStatus" className="block text-sm font-medium text-text-primary mb-1.5">
                  Marital Status
                </label>
                <select
                  // allow-native-form-control: setValueAs (empty → undefined) keeps the optional enum check from firing on a cleared field; the Controller-based SelectField cannot apply setValueAs
                  id="maritalStatus"
                  {...register('maritalStatus', emptyToUndefined)}
                  className={nativeSelectClass(!!errors.maritalStatus)}
                  disabled={isSubmitting}
                >
                  <option value="">Select…</option>
                  {MARITAL_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.maritalStatus && (
                  <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.maritalStatus.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="appointmentType" className="block text-sm font-medium text-text-primary mb-1.5">
                  Appointment Type
                </label>
                <select
                  // allow-native-form-control: setValueAs (empty → undefined) keeps the optional enum check from firing on a cleared field; the Controller-based SelectField cannot apply setValueAs
                  id="appointmentType"
                  {...register('appointmentType', emptyToUndefined)}
                  className={nativeSelectClass(!!errors.appointmentType)}
                  disabled={isSubmitting}
                >
                  <option value="">Select…</option>
                  {APPOINTMENT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {errors.appointmentType && (
                  <p className="mt-1 text-sm text-[rgb(var(--state-danger-fg))]">{errors.appointmentType.message}</p>
                )}
              </div>
              <DateField
                name="appointmentDate"
                label="Appointment Date"
                disabled={isSubmitting}
                rules={emptyToUndefined}
                helperText="Per CEHRD register."
              />
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
              className="min-w-24"
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
      </FormProvider>
    </Modal>
  )
}
