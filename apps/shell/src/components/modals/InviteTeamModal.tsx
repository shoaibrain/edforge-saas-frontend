/**
 * Invite Team Modal
 * 
 * Modal for inviting team members (teachers, staff) via email.
 * Features:
 * - Bulk email input (paste multiple)
 * - Role selection per invite
 * - Email validation
 * - Preview of invitations
 */

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail,
  UserPlus,
  Loader2,
  AlertCircle,
  Check,
  ChevronDown,
  Trash2,
  Send,
} from 'lucide-react'
import { BaseModal, ModalHeader, ModalBody, ModalFooter } from './BaseModal'
import { useInviteTeamModal } from '../../stores/modal.store'
import { cn } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface InviteEntry {
  id: string
  email: string
  role: 'teacher' | 'staff' | 'admin'
  isValid: boolean
  error?: string
}

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teacher', description: 'Can manage classes and grades' },
  { value: 'staff', label: 'Staff', description: 'Administrative access' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
] as const

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim()
  if (!trimmed) return { isValid: false, error: 'Email is required' }
  if (!emailRegex.test(trimmed)) return { isValid: false, error: 'Invalid email format' }
  return { isValid: true }
}

// ============================================================================
// INVITE ENTRY COMPONENT
// ============================================================================

interface InviteEntryRowProps {
  entry: InviteEntry
  onUpdate: (id: string, updates: Partial<InviteEntry>) => void
  onRemove: (id: string) => void
  canRemove: boolean
}

function InviteEntryRow({ entry, onUpdate, onRemove, canRemove }: InviteEntryRowProps) {
  const [focused, setFocused] = useState(false)

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value
    const validation = validateEmail(email)
    onUpdate(entry.id, { email, ...validation })
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="flex items-start gap-3"
    >
      {/* Email Input */}
      <div
        className={cn(
          'flex-1 relative rounded-xl border-2 bg-[rgb(var(--surface-tertiary))] overflow-hidden transition-colors duration-200',
          entry.error
            ? 'border-rust-500'
            : focused
              ? 'border-teal-500'
              : 'border-[rgb(var(--border-primary))]'
        )}
      >
        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          type="email"
          value={entry.email}
          onChange={handleEmailChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="colleague@school.edu"
          className={cn(
            'w-full pl-11 pr-4 py-3 bg-transparent',
            'text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))]',
            'focus:outline-none'
          )}
        />
        {entry.isValid && entry.email && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500" />
        )}
      </div>

      {/* Role Selector */}
      <div className="relative w-36">
        <select
          value={entry.role}
          onChange={(e) => onUpdate(entry.id, { role: e.target.value as InviteEntry['role'] })}
          className={cn(
            'w-full px-3 py-3 rounded-xl border-2 bg-[rgb(var(--surface-tertiary))]',
            'text-sm text-[rgb(var(--text-primary))]',
            'border-[rgb(var(--border-primary))]',
            'focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20',
            'appearance-none'
          )}
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))] pointer-events-none" />
      </div>

      {/* Remove Button */}
      {canRemove && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onRemove(entry.id)}
          className="p-2.5 rounded-xl text-rust-500 hover:bg-rust-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function InviteTeamModal() {
  const { isOpen, data, close } = useInviteTeamModal()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [entries, setEntries] = useState<InviteEntry[]>([
    { id: '1', email: '', role: data?.defaultRole || 'teacher', isValid: false },
  ])

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setEntries([
        { id: '1', email: '', role: data?.defaultRole || 'teacher', isValid: false },
      ])
    }
  }, [isOpen, data?.defaultRole])

  // Handle bulk paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text')
    const emails = text
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0)

    if (emails.length > 1) {
      e.preventDefault()
      const newEntries: InviteEntry[] = emails.map((email, i) => {
        const validation = validateEmail(email)
        return {
          id: `${Date.now()}-${i}`,
          email,
          role: 'teacher' as const,
          ...validation,
        }
      })
      setEntries((prev) => {
        // Replace empty first entry or add to list
        if (prev.length === 1 && !prev[0].email) {
          return newEntries
        }
        return [...prev, ...newEntries]
      })
    }
  }, [])

  // Add new entry
  const addEntry = useCallback(() => {
    setEntries((prev) => [
      ...prev,
      { id: `${Date.now()}`, email: '', role: 'teacher', isValid: false },
    ])
  }, [])

  // Update entry
  const updateEntry = useCallback((id: string, updates: Partial<InviteEntry>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    )
  }, [])

  // Remove entry
  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }, [])

  // Valid entries count
  const validCount = useMemo(
    () => entries.filter((e) => e.isValid).length,
    [entries]
  )

  // Handle submit
  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.isValid)
    if (validEntries.length === 0) return

    setIsSubmitting(true)
    try {
      // TODO: Send invitations via API
      console.log('Sending invitations:', validEntries)
      await new Promise((resolve) => setTimeout(resolve, 1500))
      close()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BaseModal open={isOpen} onClose={close} size="lg" title="Invite Team">
      <ModalHeader
        title="Invite Team Members"
        subtitle="Send email invitations to add new team members to your school."
        icon={<UserPlus className="w-6 h-6 text-teal-600 dark:text-cyan-400" />}
      />

      <ModalBody className="space-y-4">
        {/* Bulk paste hint */}
        <div className="flex items-center gap-2 px-3 py-2 bg-vanilla-400/20 dark:bg-vanilla-400/10 rounded-lg border border-vanilla-400/30">
          <Mail className="w-4 h-4 text-vanilla-700 dark:text-vanilla-400" />
          <p className="text-xs text-vanilla-800 dark:text-vanilla-300">
            Tip: Paste multiple emails separated by commas or newlines
          </p>
        </div>

        {/* Invite entries */}
        <div className="space-y-3" onPaste={handlePaste}>
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <InviteEntryRow
                  entry={entry}
                  onUpdate={updateEntry}
                  onRemove={removeEntry}
                  canRemove={entries.length > 1}
                />
                {entry.error && entry.email && (
                  <p className="mt-1 ml-11 flex items-center gap-1.5 text-xs text-rust-500">
                    <AlertCircle className="w-3 h-3" />
                    {entry.error}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add more button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="button"
          onClick={addEntry}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3',
            'border-2 border-dashed border-[rgb(var(--border-primary))] rounded-xl',
            'text-sm font-medium text-[rgb(var(--text-tertiary))]',
            'hover:border-teal-500/50 hover:text-teal-600 dark:hover:text-cyan-400 hover:bg-teal-500/5',
            'transition-colors'
          )}
        >
          <Mail className="w-4 h-4" />
          Add another email
        </motion.button>

        {/* Summary */}
        {validCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between px-4 py-3 bg-teal-500/10 dark:bg-cyan-500/10 rounded-xl border border-teal-500/20"
          >
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              <span className="text-sm text-teal-700 dark:text-cyan-300">
                {validCount} {validCount === 1 ? 'invitation' : 'invitations'} ready to send
              </span>
            </div>
          </motion.div>
        )}
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
          type="button"
          onClick={handleSubmit}
          disabled={validCount === 0 || isSubmitting}
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
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send {validCount > 0 ? validCount : ''} Invitation{validCount !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </ModalFooter>
    </BaseModal>
  )
}

