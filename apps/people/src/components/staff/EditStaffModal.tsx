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

export function EditStaffModal({ open, onClose, staff }: EditStaffModalProps) {
  const queryClient = useQueryClient()
  const firstInputRef = useRef<HTMLInputElement>(null)

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
        department: staff.department || '',
        title: staff.title || '',
        employmentStatus: staff.employmentStatus,
      })
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
            <label htmlFor="department" className="block text-sm font-medium text-text-primary mb-1.5">
              Department
            </label>
            <input
              id="department"
              type="text"
              {...register('department')}
              className={inputClass(!!errors.department)}
              placeholder="Mathematics"
              disabled={isSubmitting}
            />
            {errors.department && (
              <p className="mt-1 text-sm text-red-500">{errors.department.message}</p>
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
