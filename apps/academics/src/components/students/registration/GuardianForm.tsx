/**
 * Guardian Form Card
 *
 * A single guardian entry within the guardians step.
 * Rendered as an expandable card with all guardian fields.
 */

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Trash2,
  User,
} from 'lucide-react'
import { TextField, PhoneInput, SelectField, CheckboxField, useTenantContext } from '@edforge/forms'
import {
  RELATIONSHIP_OPTIONS,
  PHONE_TYPE_OPTIONS,
} from '../../../schemas/student.form'

interface GuardianFormProps {
  /** Index in the guardians array (for field name prefixing) */
  index: number
  /** Remove this guardian */
  onRemove: () => void
  /** Whether this is the only guardian (can't remove) */
  canRemove: boolean
}

export function GuardianForm({ index, onRemove, canRemove }: GuardianFormProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const prefix = `guardians.${index}`

  // Watch portal access to conditionally require email
  const { watch } = useFormContext()
  const hasPortalAccess = watch(`${prefix}.hasPortalAccess`) as boolean

  // Sprint A.18: archetype-aware phone format (PABSON → +977 / Nepal mobile)
  const { archetype, country } = useTenantContext()

  return (
    <div className="rounded-xl border border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-primary))] overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgb(var(--background-secondary))] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex items-center justify-center">
            <User className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
          </div>
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            Guardian {index + 1}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              className="p-1.5 rounded-lg text-[rgb(var(--state-danger-fg))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
              aria-label="Remove guardian"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 space-y-6">
              {/* Name & Relationship */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <TextField
                  name={`${prefix}.firstName`}
                  label="First Name"
                  placeholder="First name"
                  required
                />
                <TextField
                  name={`${prefix}.lastName`}
                  label="Last Name"
                  placeholder="Last name"
                  required
                />
                <SelectField
                  name={`${prefix}.relationship`}
                  label="Relationship"
                  options={RELATIONSHIP_OPTIONS}
                  placeholder="Select"
                  required
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <TextField
                  name={`${prefix}.email`}
                  label="Email"
                  type="email"
                  placeholder="email@example.com"
                  required={hasPortalAccess}
                />
                <PhoneInput
                  name={`${prefix}.phone`}
                  archetype={archetype}
                  country={country}
                  label="Phone"
                />
                <SelectField
                  name={`${prefix}.phoneType`}
                  label="Phone Type"
                  options={PHONE_TYPE_OPTIONS}
                  placeholder="Select"
                />
              </div>

              {/* Work Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <TextField
                  name={`${prefix}.employer`}
                  label="Employer"
                  placeholder="Employer name"
                />
                <TextField
                  name={`${prefix}.occupation`}
                  label="Occupation"
                  placeholder="Occupation"
                />
              </div>

              {/* Permissions */}
              <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
                <h4 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-3">
                  Permissions
                </h4>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <CheckboxField
                    name={`${prefix}.isPrimary`}
                    label="Primary Guardian"
                    description="Main point of contact"
                  />
                  <CheckboxField
                    name={`${prefix}.hasPortalAccess`}
                    label="Portal Access"
                    description="Can view student records"
                  />
                  <CheckboxField
                    name={`${prefix}.canPickup`}
                    label="Authorized for Pickup"
                    description="Can pick up the student"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
