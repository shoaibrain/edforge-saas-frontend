/**
 * CreateUserModal Component
 * 
 * Modal for creating a new user with form validation.
 * Uses @edforge/shared-types schemas for validation.
 */

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, UserPlus } from 'lucide-react'
import { createUserSchema, type CreateUserDto } from '@edforge/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { peopleService, parseApiError } from '../../services/people.service'

export interface CreateUserModalProps {
  open: boolean
  onClose: () => void
}

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const queryClient = useQueryClient()
  const firstInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      globalRole: 'TenantUser',
    },
  })

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset()
    }
  }, [open, reset])

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => peopleService.createUser(data),
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (error) => {
      const parsed = parseApiError(error)
      
      // Set field-level errors if available
      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, message]) => {
          setError(field as keyof CreateUserDto, { message })
        })
      } else {
        toast.error(parsed.message)
      }
    },
  })

  const onSubmit = handleSubmit((data) => {
    createMutation.mutate(data)
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add New Staff Member"
      description="Create a new user account for your organization"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            ref={(e) => {
              register('email').ref(e)
              if (e) firstInputRef.current = e
            }}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-accent-primary/20
              transition-colors
              ${errors.email ? 'border-red-500' : 'border-border-secondary'}
            `}
            placeholder="user@example.com"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
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

        {/* Role */}
        <div>
          <label 
            htmlFor="globalRole" 
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            Role
          </label>
          <select
            id="globalRole"
            {...register('globalRole')}
            className={`
              w-full px-3 py-2 rounded-lg border
              bg-surface-secondary text-text-primary
              focus:outline-none focus:ring-2 focus:ring-accent-primary/20
              transition-colors
              ${errors.globalRole ? 'border-red-500' : 'border-border-secondary'}
            `}
            disabled={isSubmitting}
          >
            <option value="TenantUser">Tenant User</option>
            <option value="TenantAdmin">Tenant Admin</option>
          </select>
          {errors.globalRole && (
            <p className="mt-1 text-sm text-red-500">{errors.globalRole.message}</p>
          )}
          <p className="mt-1 text-xs text-text-tertiary">
            Tenant Admins have full access to all features. Tenant Users have school-scoped access based on their assigned school roles.
          </p>
        </div>

        {/* Footer with actions */}
        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
