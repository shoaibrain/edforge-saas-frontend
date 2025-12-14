/**
 * InviteForm Component
 * 
 * A modal form for inviting team members via email.
 * Supports role assignment and bulk invitations.
 */

import { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  Mail,
  Users,
  Briefcase,
  X,
  Send,
  UserPlus,
  Check,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField, SelectField, TextareaField, ToggleField } from './fields'
import { inviteSchema, type InviteFormValues } from '@/schemas/person.schema'
import { cn } from '@/lib/utils'

// ============================================================================
// ROLE OPTIONS
// ============================================================================

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher', icon: Users },
  { value: 'staff', label: 'Staff', icon: Briefcase },
  { value: 'admin', label: 'Administrator', icon: Users },
]

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
]

const DEPARTMENT_OPTIONS = [
  { value: 'administration', label: 'Administration' },
  { value: 'academics', label: 'Academics' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'sciences', label: 'Sciences' },
  { value: 'languages', label: 'Languages' },
  { value: 'arts', label: 'Arts' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'human_resources', label: 'Human Resources' },
]

// ============================================================================
// INVITE FORM PROPS
// ============================================================================

export interface InviteFormProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal is closed */
  onClose: () => void
  /** Callback when invites are sent */
  onSubmit: (data: InviteFormValues) => Promise<void>
  /** School name for context */
  schoolName?: string
}

// ============================================================================
// INVITE FORM COMPONENT
// ============================================================================

export function InviteForm({
  isOpen,
  onClose,
  onSubmit,
  schoolName = 'your school',
}: InviteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [emailCount, setEmailCount] = useState(0)

  // Form setup
  const methods = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      emails: '',
      role: 'teacher',
      department: '',
      employmentType: 'full_time',
      sendWelcomeEmail: true,
      message: '',
    },
  })

  const { handleSubmit, watch, reset, formState: { errors } } = methods

  // Watch emails to count them
  const emailsValue = watch('emails')

  // Update email count
  const parseEmails = (value: string) => {
    const emails = value.split(',').map(e => e.trim()).filter(Boolean)
    setEmailCount(emails.length)
    return emails
  }

  // Handle form submission
  const handleFormSubmit = async (data: InviteFormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      setSubmitSuccess(true)
      setTimeout(() => {
        setSubmitSuccess(false)
        reset()
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to send invites:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Animation springs
  const backdropSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    config: config.gentle,
  })

  const modalSpring = useSpring({
    opacity: isOpen ? 1 : 0,
    transform: isOpen 
      ? 'scale(1) translateY(0px)' 
      : 'scale(0.95) translateY(-20px)',
    config: { tension: 280, friction: 25 },
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <animated.div
        style={backdropSpring}
        onClick={onClose}
        className="absolute inset-0 bg-ink-500/70 dark:bg-ink-900/85 backdrop-blur-md"
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-lg rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-2xl shadow-black/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(var(--border-primary))]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
              <UserPlus className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Invite Team Members
              </h2>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">
                to {schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </button>
        </div>

        {/* Form */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
            {/* Email Input */}
            <div>
              <TextareaField
                name="emails"
                label="Email Addresses"
                placeholder="Enter email addresses separated by commas&#10;e.g., john@school.edu, jane@school.edu"
                rows={3}
                required
                helperText={emailCount > 0 ? `${emailCount} email${emailCount > 1 ? 's' : ''} entered` : 'Separate multiple emails with commas'}
              />
            </div>

            {/* Role & Employment Type */}
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                name="role"
                label="Role"
                placeholder="Select role"
                options={ROLE_OPTIONS}
                required
              />
              <SelectField
                name="employmentType"
                label="Employment Type"
                placeholder="Select type"
                options={EMPLOYMENT_TYPE_OPTIONS}
                required
              />
            </div>

            {/* Department */}
            <SelectField
              name="department"
              label="Department"
              placeholder="Select department"
              options={DEPARTMENT_OPTIONS}
              required
            />

            {/* Custom Message */}
            <TextareaField
              name="message"
              label="Personal Message (Optional)"
              placeholder="Add a personal message to include in the invitation email..."
              rows={2}
              maxLength={500}
              showCharacterCount
            />

            {/* Send Welcome Email Toggle */}
            <ToggleField
              name="sendWelcomeEmail"
              label="Send Welcome Email"
              description="Invitees will receive an email with login instructions"
            />

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgb(var(--border-primary))]">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || emailCount === 0}
                className="min-w-[140px]"
              >
                <AnimatePresence mode="wait">
                  {isSubmitting ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      <span>Sending...</span>
                    </motion.div>
                  ) : submitSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Invites Sent!</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send {emailCount > 1 ? `${emailCount} Invites` : 'Invite'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </form>
        </FormProvider>

        {/* Success Overlay */}
        <AnimatePresence>
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[rgb(var(--surface-secondary))]/95 rounded-2xl"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-teal-500" />
                </div>
                <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Invitations Sent!
                </p>
                <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
                  {emailCount} invite{emailCount > 1 ? 's' : ''} sent successfully
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </animated.div>
    </div>
  )
}

// ============================================================================
// INVITE BUTTON WITH MODAL
// ============================================================================

export interface InviteButtonProps {
  schoolName?: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function InviteButton({
  schoolName,
  className,
  variant = 'default',
  size = 'md',
}: InviteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSubmit = async (data: InviteFormValues) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Invites sent:', data)
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Invite Team
      </Button>

      <InviteForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        schoolName={schoolName}
      />
    </>
  )
}

