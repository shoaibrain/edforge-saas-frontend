/**
 * CreateUserModal Component — V2
 *
 * Modal for creating a new user with V2 visual treatment.
 * Form fields, validation, and submit logic unchanged.
 * DiceBear avatar behavior communicated via info strip.
 */

import { useEffect, useRef, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, UserPlus, X } from 'lucide-react'
import { createUserSchema, type CreateUserDto } from '@aibrains/shared-types'
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
  const firstInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
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

  const firstName = watch('firstName')
  const avatarColors = useMemo(
    () => getAvatarGradient(firstName?.[0] || ''),
    [firstName],
  )

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 100)
    }
  }, [open])

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

  if (!open) return null

  return (
    <>
      {/* BACKDROP */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 99,
        }}
        onClick={onClose}
      />

      {/* MODAL */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: 480,
          background: 'var(--v2-bg-surface, #161b27)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 14,
          zIndex: 100,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
        data-v2
      >
        {/* HEADER */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'rgba(216,90,48,0.10)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserPlus style={{ width: 14, height: 14, color: '#D85A30' }} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--v2-text-primary, #e8eaf0)',
                }}
              >
                Add staff member
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--v2-text-muted, #7a8099)',
                }}
              >
                Create a new user account for your organization
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--v2-text-hint, #4a5068)',
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* AVATAR PREVIEW STRIP */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                {firstName?.[0]?.toUpperCase() || '?'}
              </div>
              <span style={{ fontSize: 10, color: 'var(--v2-text-hint, #4a5068)', lineHeight: 1.5 }}>
                A DiceBear avatar will be auto-generated from the staff member's name after creation.
              </span>
            </div>

            {/* GROUP 1: Identity */}
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--v2-text-ghost, #2a3045)',
              }}
            >
              Identity
            </div>

            {/* Email */}
            <FormField label="Email Address" required error={errors.email?.message}>
              <input
                type="email"
                {...register('email')}
                ref={(e) => {
                  register('email').ref(e)
                  if (e) firstInputRef.current = e
                }}
                placeholder="user@example.com"
                disabled={isSubmitting}
                style={inputStyle(!!errors.email)}
              />
            </FormField>

            {/* Name row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <FormField label="First Name" required error={errors.firstName?.message}>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="John"
                  disabled={isSubmitting}
                  style={inputStyle(!!errors.firstName)}
                />
              </FormField>
              <FormField label="Last Name" required error={errors.lastName?.message}>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="Doe"
                  disabled={isSubmitting}
                  style={inputStyle(!!errors.lastName)}
                />
              </FormField>
            </div>

            {/* Phone */}
            <FormField label="Phone Number" error={errors.phone?.message}>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
                disabled={isSubmitting}
                style={inputStyle(!!errors.phone)}
              />
            </FormField>

            {/* GROUP 2: Access & Role */}
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--v2-text-ghost, #2a3045)',
                marginTop: 4,
              }}
            >
              Access & Role
            </div>

            {/* Role */}
            <FormField label="System Role" error={errors.globalRole?.message}>
              <select
                {...register('globalRole')}
                disabled={isSubmitting}
                style={inputStyle(!!errors.globalRole)}
              >
                <option value="TenantUser">Tenant User</option>
                <option value="TenantAdmin">Tenant Admin</option>
              </select>
            </FormField>

            {/* Role helper */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 5,
                padding: '6px 8px',
                fontSize: 10,
                color: 'var(--v2-text-ghost, #2a3045)',
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: 'var(--v2-text-secondary, #c8ccd8)' }}>Tenant Admin</span> — full access to all features.{' '}
              <span style={{ color: 'var(--v2-text-secondary, #c8ccd8)' }}>Tenant User</span> — school-scoped access based on assigned roles.
            </div>
          </div>

          {/* FOOTER */}
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 10, color: 'var(--v2-text-ghost, #2a3045)' }}>
              * Required fields
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  height: 36,
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 8,
                  padding: '0 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--v2-text-muted, #7a8099)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: 36,
                  background: '#1D9E75',
                  border: 'none',
                  borderRadius: 8,
                  padding: '0 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'white',
                  cursor: isSubmitting ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus style={{ width: 14, height: 14 }} />
                    Create user
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--v2-text-muted, #7a8099)',
          marginBottom: 4,
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--v2-danger, #E24B4A)', fontSize: 11, marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 10, color: '#E24B4A', marginTop: 3 }}>{error}</p>
      )}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${hasError ? 'rgba(226,75,74,0.5)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 8,
    padding: '8px 11px',
    fontSize: 12,
    color: 'var(--v2-text-primary, #e8eaf0)',
    outline: 'none',
    colorScheme: 'dark' as const,
    transition: 'border-color 0.12s',
  }
}
