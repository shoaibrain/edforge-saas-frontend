/**
 * Quick Add Person Modal
 * 
 * Modal for capturing basic person information before redirecting
 * to the full wizard for complete profile creation.
 * 
 * Features:
 * - Animated form fields with spring physics
 * - Real-time validation with debounce
 * - Person type selection with visual cards
 * - Keyboard navigation support
 * - Accessibility compliant
 */

import React, { useEffect, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSpring, animated, config } from '@react-spring/web'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserPlus,
  ArrowRight,
  Loader2,
  Mail,
  User,
  GraduationCap,
  Users,
  Heart,
  Check,
  AlertCircle,
} from 'lucide-react'
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from './BaseModal'
import { useQuickAddPersonModal } from '../../stores/modal.store'
import {
  quickAddPersonSchema,
  type QuickAddPersonInput,
  PERSON_TYPE_OPTIONS,
} from '../../lib/quick-add.schema'
import { cn } from '../../lib/utils'

// ============================================================================
// ICON MAP
// ============================================================================

const IconMap = {
  GraduationCap,
  User,
  Users,
  Heart,
}

// ============================================================================
// ANIMATED INPUT COMPONENT
// ============================================================================

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
}

const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false)
    
    const springProps = useSpring({
      borderColor: error
        ? 'rgb(185, 62, 3)' // rust-500
        : focused
        ? 'rgb(10, 147, 150)' // teal-500
        : 'rgb(var(--border-primary))',
      boxShadow: error
        ? '0 0 0 3px rgba(185, 62, 3, 0.15)'
        : focused
        ? '0 0 0 3px rgba(10, 147, 150, 0.15)'
        : '0 0 0 0px transparent',
      scale: focused ? 1.01 : 1,
      config: { tension: 300, friction: 20 },
    })

    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
          <span className="text-rust-500 ml-0.5">*</span>
        </label>
        <animated.div
          style={{
            borderColor: springProps.borderColor,
            boxShadow: springProps.boxShadow,
            transform: springProps.scale.to((s) => `scale(${s})`),
          }}
          className="relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors"
        >
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgb(var(--text-tertiary))]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            onFocus={(e) => {
              setFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setFocused(false)
              props.onBlur?.(e)
            }}
            className={cn(
              'w-full px-4 py-3 bg-transparent',
              'text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
              'focus:outline-none',
              'text-sm',
              icon && 'pl-11',
              className
            )}
          />
        </animated.div>
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="flex items-center gap-1.5 text-xs text-rust-500"
            >
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

AnimatedInput.displayName = 'AnimatedInput'

// ============================================================================
// PERSON TYPE CARD COMPONENT
// ============================================================================

interface PersonTypeCardProps {
  option: typeof PERSON_TYPE_OPTIONS[0]
  selected: boolean
  onSelect: () => void
}

function PersonTypeCard({ option, selected, onSelect }: PersonTypeCardProps) {
  const [hovered, setHovered] = React.useState(false)
  const Icon = IconMap[option.icon as keyof typeof IconMap]

  const springProps = useSpring({
    scale: selected ? 1.02 : hovered ? 1.01 : 1,
    y: selected ? -2 : hovered ? -1 : 0,
    config: config.gentle,
  })

  return (
    <animated.button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      className={cn(
        'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface-primary))]',
        selected
          ? cn('border-teal-500 dark:border-cyan-500', option.color.bg)
          : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-secondary))] hover:bg-[rgb(var(--interactive-hover))]'
      )}
      aria-pressed={selected}
    >
      {/* Selected checkmark */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-teal-500 dark:bg-cyan-500 flex items-center justify-center shadow-md"
          >
            <Check className="w-3 h-3 text-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <div
        className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          selected ? option.color.bg : 'bg-[rgb(var(--surface-tertiary))]'
        )}
      >
        <Icon
          className={cn(
            'w-5 h-5',
            selected ? option.color.text : 'text-[rgb(var(--text-tertiary))]'
          )}
        />
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-sm font-medium',
          selected ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'
        )}
      >
        {option.label}
      </span>
    </animated.button>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuickAddPersonModal() {
  const navigate = useNavigate()
  const { isOpen, data, close } = useQuickAddPersonModal()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<QuickAddPersonInput>({
    resolver: zodResolver(quickAddPersonSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      personType: (data?.personType && data.personType !== 'admin' ? data.personType : 'student') as 'student' | 'teacher' | 'staff' | 'guardian',
    },
    mode: 'onChange',
  })

  // Update person type when modal data changes
  useEffect(() => {
    if (data?.personType && data.personType !== 'admin') {
      setValue('personType', data.personType as 'student' | 'teacher' | 'staff' | 'guardian')
    }
  }, [data?.personType, setValue])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  // Handle form submission
  const onSubmit = useCallback(
    async (formData: QuickAddPersonInput) => {
      // Simulate a brief delay for UX
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Navigate to wizard with pre-filled data
      navigate({
        to: '/people/new',
        search: {
          type: formData.personType,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
        },
      })

      close()
    },
    [navigate, close]
  )

  return (
    <BaseModal
      open={isOpen}
      onClose={close}
      size="md"
      title="Add New Person"
    >
      <form onSubmit={handleSubmit(onSubmit as any)}>
        <ModalHeader
          title="Add New Person"
          subtitle="Enter basic information to get started. You'll complete the full profile in the next step."
          icon={<UserPlus className="w-6 h-6 text-teal-600 dark:text-cyan-400" />}
        />

        <ModalBody className="space-y-6">
          {/* Person Type Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
              Person Type
              <span className="text-rust-500 ml-0.5">*</span>
            </label>
            <Controller
              name="personType"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-4 gap-3">
                  {PERSON_TYPE_OPTIONS.map((option) => (
                    <PersonTypeCard
                      key={option.value}
                      option={option}
                      selected={field.value === option.value}
                      onSelect={() => field.onChange(option.value)}
                    />
                  ))}
                </div>
              )}
            />
            {errors.personType && (
              <p className="flex items-center gap-1.5 text-xs text-rust-500">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.personType.message}
              </p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <AnimatedInput
              label="First Name"
              placeholder="John"
              icon={<User className="w-4 h-4" />}
              error={errors.firstName?.message}
              autoComplete="given-name"
              {...register('firstName')}
            />
            <AnimatedInput
              label="Last Name"
              placeholder="Doe"
              icon={<User className="w-4 h-4" />}
              error={errors.lastName?.message}
              autoComplete="family-name"
              {...register('lastName')}
            />
          </div>

          {/* Email Field */}
          <AnimatedInput
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            icon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            autoComplete="email"
            {...register('email')}
          />
        </ModalBody>

        <ModalFooter>
          <button
            type="button"
            onClick={close}
            className={cn(
              'px-4 py-2.5 text-sm font-medium rounded-xl',
              'text-[rgb(var(--text-secondary))]',
              'hover:bg-[rgb(var(--interactive-hover))]',
              'transition-colors'
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl',
              'text-white brand-gradient-warm',
              'shadow-md shadow-golden-500/20',
              'hover:opacity-90 hover:shadow-lg hover:shadow-golden-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
              'transition-all duration-200'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </ModalFooter>
      </form>
    </BaseModal>
  )
}

