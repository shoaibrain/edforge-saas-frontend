/**
 * Guardian Form Card
 *
 * A single guardian entry within the guardians step.
 * Rendered as an expandable card with all guardian fields.
 */

import { useMemo, useState } from 'react'
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
import { useAcademicsI18n } from '../../../lib/i18n'

interface GuardianFormProps {
  /** Index in the guardians array (for field name prefixing) */
  index: number
  /** Remove this guardian */
  onRemove: () => void
  /** Whether this is the only guardian (can't remove) */
  canRemove: boolean
}

export function GuardianForm({ index, onRemove, canRemove }: GuardianFormProps) {
  const { t, formatNumber } = useAcademicsI18n()
  const [isExpanded, setIsExpanded] = useState(true)
  const prefix = `guardians.${index}`
  const relationshipOptions = useMemo(
    () => RELATIONSHIP_OPTIONS.map((option) => ({
      value: option.value,
      label: t(`relationships.${option.value === 'guardian' ? 'legalGuardian' : option.value}`),
    })),
    [t],
  )
  const phoneTypeOptions = useMemo(
    () => PHONE_TYPE_OPTIONS.map((option) => ({ value: option.value, label: t(`enrollmentModule.step.contact.phoneTypes.${option.value}`) })),
    [t],
  )

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
            {t('enrollmentModule.step.guardians.guardianNumber', { number: formatNumber(index + 1) })}
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
              aria-label={t('enrollmentModule.step.guardians.remove')}
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
                  label={t('fields.firstName')}
                  placeholder={t('fields.firstName')}
                  required
                />
                <TextField
                  name={`${prefix}.lastName`}
                  label={t('fields.lastName')}
                  placeholder={t('fields.lastName')}
                  required
                />
                <SelectField
                  name={`${prefix}.relationship`}
                  label={t('enrollmentModule.step.guardians.relationship')}
                  options={relationshipOptions}
                  placeholder={t('enrollmentModule.step.guardians.select')}
                  required
                />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4">
                <TextField
                  name={`${prefix}.email`}
                  label={t('fields.email')}
                  type="email"
                  placeholder="email@example.com"
                  required={hasPortalAccess}
                />
                <PhoneInput
                  name={`${prefix}.phone`}
                  archetype={archetype}
                  country={country}
                  label={t('fields.phone')}
                />
                <SelectField
                  name={`${prefix}.phoneType`}
                  label={t('enrollmentModule.step.contact.phoneType')}
                  options={phoneTypeOptions}
                  placeholder={t('enrollmentModule.step.guardians.select')}
                />
              </div>

              {/* Work Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <TextField
                  name={`${prefix}.employer`}
                  label={t('enrollmentModule.step.guardians.employer')}
                  placeholder={t('enrollmentModule.step.guardians.employerPlaceholder')}
                />
                <TextField
                  name={`${prefix}.occupation`}
                  label={t('fields.occupation')}
                  placeholder={t('enrollmentModule.step.guardians.occupationPlaceholder')}
                />
              </div>

              {/* Permissions */}
              <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
                <h4 className="text-xs font-semibold text-[rgb(var(--text-secondary))] uppercase tracking-wider mb-3">
                  {t('enrollmentModule.step.guardians.permissions')}
                </h4>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  <CheckboxField
                    name={`${prefix}.isPrimary`}
                    label={t('enrollmentModule.step.guardians.primaryGuardian')}
                    description={t('enrollmentModule.step.guardians.primaryGuardianDescription')}
                  />
                  <CheckboxField
                    name={`${prefix}.hasPortalAccess`}
                    label={t('enrollmentModule.step.guardians.portalAccess')}
                    description={t('enrollmentModule.step.guardians.portalAccessDescription')}
                  />
                  <CheckboxField
                    name={`${prefix}.canPickup`}
                    label={t('enrollmentModule.step.guardians.pickup')}
                    description={t('enrollmentModule.step.guardians.pickupDescription')}
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
