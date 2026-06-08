/**
 * CreateUserModal Component
 *
 * Modal for creating a new user.
 * Form fields, validation, and submit logic unchanged.
 * DiceBear avatar behavior communicated via info strip.
 */

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { createUserSchema, type CreateUserDto } from '@aibrains/shared-types'
import { Modal, ModalFooter, Button } from '../ui'
import { TextField, SelectField } from '@edforge/forms'
import { peopleService, parseApiError } from '../../services/people.service'

export interface CreateUserModalProps {
  open: boolean
  onClose: () => void
}

// ============================================================================
// AVATAR PREVIEW HELPERS
// ============================================================================

const PLACEHOLDER_COLORS = [
  ['#D85A30', '#EF9F27'],
  ['#1D9E75', '#378ADD'],
  ['#7F77DD', '#378ADD'],
  ['#E24B4A', '#EF9F27'],
]

function getAvatarGradient(firstLetter: string): string[] {
  if (!firstLetter) return ['#4a5068', '#2a3045']
  const idx = firstLetter.toUpperCase().charCodeAt(0) % PLACEHOLDER_COLORS.length
  return PLACEHOLDER_COLORS[idx]
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreateUserModal({ open, onClose }: CreateUserModalProps) {
  const queryClient = useQueryClient()

  const methods = useForm<CreateUserDto>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      globalRole: 'TenantUser',
    },
  })

  const {
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { isSubmitting },
  } = methods

  const firstName = watch('firstName')
  const avatarColors = useMemo(
    () => getAvatarGradient(firstName?.[0] || ''),
    [firstName],
  )

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const createMutation = useMutation({
    mutationFn: (data: CreateUserDto) => peopleService.createUser(data),
    onSuccess: () => {
      toast.success('User created successfully')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      onClose()
    },
    onError: (error) => {
      const parsed = parseApiError(error)
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
      title="Add staff member"
      description="Create a new user account for your organization"
      size="md"
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit} className="space-y-3.5">
          {/* AVATAR PREVIEW STRIP */}
          <div className="flex items-center gap-2.5 bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg p-3">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold"
              // allow-presentation-style: dynamic avatar gradient
              style={{
                background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                color: 'white',
              }}
            >
              {firstName?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-xs text-[rgb(var(--text-tertiary))] leading-normal">
              A DiceBear avatar will be auto-generated from the staff member's name after creation.
            </span>
          </div>

          {/* GROUP 1: Identity */}
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))]">
            Identity
          </div>

          {/* Email */}
          <TextField
            name="email"
            label="Email Address"
            type="email"
            placeholder="user@example.com"
            required
            autoFocus
            disabled={isSubmitting}
          />

          {/* Name row */}
          <div className="grid grid-cols-2 gap-2.5">
            <TextField
              name="firstName"
              label="First Name"
              type="text"
              placeholder="John"
              required
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

          {/* GROUP 2: Access & Role */}
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-tertiary))] mt-1">
            Access &amp; Role
          </div>

          {/* Role */}
          <SelectField
            name="globalRole"
            label="System Role"
            options={[
              { value: 'TenantUser', label: 'Tenant User' },
              { value: 'TenantAdmin', label: 'Tenant Admin' },
            ]}
            disabled={isSubmitting}
          />

          {/* Role helper */}
          <div className="bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))] rounded-lg p-3 text-xs text-[rgb(var(--text-tertiary))] leading-normal">
            <span className="text-[rgb(var(--text-secondary))]">Tenant Admin</span> — full access to all features.{' '}
            <span className="text-[rgb(var(--text-secondary))]">Tenant User</span> — school-scoped access based on assigned roles.
          </div>

          {/* FOOTER */}
          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create user
            </Button>
          </ModalFooter>
        </form>
      </FormProvider>
    </Modal>
  )
}
