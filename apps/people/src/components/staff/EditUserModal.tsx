/**
 * EditUserModal Component
 *
 * Modal for editing an existing user with form validation.
 * Features dirty form warning when closing with unsaved changes.
 */

import { useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { updateUserSchema, type UpdateUserDto, type UserResponseDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { TextField, SelectField } from '@edforge/forms'
import { peopleService, parseApiError } from '../../services/people.service'

export interface EditUserModalProps {
  open: boolean
  onClose: () => void
  user: UserResponseDto | null
}

export function EditUserModal({ open, onClose, user }: EditUserModalProps) {
  const queryClient = useQueryClient()

  const methods = useForm<UpdateUserDto>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      status: 'active',
    },
  })

  const {
    handleSubmit,
    reset,
    setError,
    formState: { isSubmitting, isDirty },
  } = methods

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
      <FormProvider {...methods}>
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
              name="lastName"
              label="Last Name"
              type="text"
              placeholder="Doe"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Phone */}
          <TextField
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="+1 (555) 123-4567"
            disabled={isSubmitting}
          />

          {/* Status */}
          <SelectField
            name="status"
            label="Account Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            disabled={isSubmitting}
          />

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
