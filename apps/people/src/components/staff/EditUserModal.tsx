/**
 * EditUserModal Component
 * 
 * Modal for editing an existing user with form validation.
 * Features dirty form warning when closing with unsaved changes.
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateUserSchema, type UpdateUserDto, type UserResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { peopleService, parseApiError } from '../../services/people.service'

export interface EditUserModalProps {
  open: boolean
  onClose: () => void
  user: UserResponseDto | null
}

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const queryClient = useQueryClient()
  const firstInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'active',
    },
  })

  // Reset form when user changes or modal opens
  useEffect(() => {
    if (open && user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        status: user.status as 'active' | 'inactive' | 'suspended',
      })
    }
  }, [open, user, reset])

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Handle close with dirty form warning
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
    mutationFn: (data: UpdateUserDto) => {
      if (!user) throw new Error('No user to update')
      return peopleService.updateUser(user.userId, data)
    },
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      
      // Set field-level errors if available
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof UpdateUserDto, { message })
        })
      } else {
        toast.error(parsed.message)
      }
    },
  })

  const onSubmit = handleSubmit((data) => {
    updateMutation.mutate(data)
  })

  if (!user) return null

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Edit Staff Member"
      description={`Update information for ${user.firstName ?? ''} ${user.lastName ?? ''}`}
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email (read-only) */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Email Address
          </label>
          <div className="px-3 py-2 rounded-lg border border-border-secondary bg-surface-tertiary text-text-secondary">
            {user.email}
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Email address cannot be changed
          </p>
        </div>

        {/* Name Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label 
              htmlFor="firstName" 
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
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
              className={`
                w-full px-3 py-2 rounded-lg border
                bg-surface-secondary text-text-primary
                placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent-primary/20
                transition-colors
                ${errors.firstName ? 'border-red-500' : 'border-border-secondary'}
              `}
              placeholder="John"
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label 
              htmlFor="lastName" 
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={`
                w-full px-3 py-2 rounded-lg border
                bg-surface-secondary text-text-primary
                placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent-primary/20
                transition-colors
                ${errors.lastName ? 'border-red-500' : 'border-border-secondary'}
              `}
              placeholder="Doe"
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label 
            htmlFor="phone" 
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-accent-primary/20
              transition-colors
              ${errors.phone ? 'border-red-500' : 'border-border-secondary'}
            `}
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label 
            htmlFor="status" 
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Account Status
          </label>
          <select
            id="status"
            {...register('status')}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              focus:outline-none focus:ring-2 focus:ring-accent-primary/20
              transition-colors
              ${errors.status ? 'border-red-500' : 'border-border-secondary'}
            `}
            disabled={isSubmitting}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>
          )}
        </div>

        {/* Dirty form indicator */}
        {isDirty && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            You have unsaved changes
          </p>
        )}

        {/* Footer with actions */}
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
