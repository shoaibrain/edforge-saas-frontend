/**
 * Employment Step
 *
 * Step 3: Role, employment type, hire date, department,
 * teaching-specific fields, and optional user account setup.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, GraduationCap, UserPlus } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { useTranslation } from '@edforge/i18n'
import {
  STAFF_ROLE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GLOBAL_ROLE_OPTIONS,
  TEACHING_ROLES,
  optionValueToI18nKey,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, AnimatedCheckbox, SectionHeader } from './shared'
import { getRoleI18nKey } from '../../StaffRoleBadge'

export function EmploymentStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const { t } = useTranslation('people')
  const role = data.role as string
  const isTeachingRole = TEACHING_ROLES.includes(role)
  const createAccount = data.createUserAccount === true
  const roleOptions = STAFF_ROLE_OPTIONS.map((option) => ({
    ...option,
    label: t(`roles.${getRoleI18nKey(option.value)}`, { defaultValue: option.label }),
  }))
  const employmentTypeOptions = EMPLOYMENT_TYPE_OPTIONS.map((option) => ({
    ...option,
    label: t(`choices.employmentType.${optionValueToI18nKey(option.value)}`, { defaultValue: option.label }),
  }))
  const globalRoleOptions = GLOBAL_ROLE_OPTIONS.map((option) => ({
    ...option,
    label: t(`quickAdd.roles.${option.value === 'TenantAdmin' ? 'tenantAdmin' : 'tenantUser'}`, { defaultValue: option.label }),
  }))

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Core Employment */}
      <div className="space-y-4">
        <SectionHeader
          title={t('wizard.employment.details')}
          description={t('wizard.employment.detailsDescription')}
          icon={<Briefcase className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedSelect
            label={t('fields.role')}
            required
            value={role || ''}
            onChange={(e) => {
              updateData({ role: e.target.value })
              clearError('role')
            }}
            error={errors.role}
            options={[{ value: '', label: t('wizard.placeholders.selectRole') }, ...roleOptions]}
          />
          <AnimatedSelect
            label={t('fields.employmentType')}
            required
            value={(data.employmentType as string) || 'full_time'}
            onChange={handleChange('employmentType')}
            error={errors.employmentType}
            options={employmentTypeOptions}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label={t('fields.hireDate')}
            required
            type="date"
            value={(data.hireDate as string) || ''}
            onChange={handleChange('hireDate')}
            error={errors.hireDate}
          />
          <AnimatedInput
            label={t('fields.positionTitle')}
            placeholder={t('wizard.placeholders.positionTitle')}
            value={(data.title as string) || ''}
            onChange={handleChange('title')}
          />
        </div>
      </div>

      {/* Teaching-Specific (conditional) */}
      <AnimatePresence>
        {isTeachingRole && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <SectionHeader
              title={t('wizard.employment.teachingQualifications')}
              description={t('wizard.employment.teachingQualificationsDescription')}
              icon={<GraduationCap className="w-4 h-4" />}
            />

            <AnimatedCheckbox
              label={t('wizard.employment.highlyQualifiedTeacher')}
              checked={data.highlyQualifiedTeacher === true}
              onChange={(checked) => updateData({ highlyQualifiedTeacher: checked })}
              helpText={t('wizard.employment.highlyQualifiedHelp')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedInput
                label={t('wizard.employment.priorTeachingExperience')}
                type="number"
                min={0}
                placeholder="0"
                value={data.yearsOfPriorTeachingExperience !== undefined ? String(data.yearsOfPriorTeachingExperience) : ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                  updateData({ yearsOfPriorTeachingExperience: val })
                }}
              />
              <AnimatedInput
                label={t('wizard.employment.priorProfessionalExperience')}
                type="number"
                min={0}
                placeholder="0"
                value={data.yearsOfPriorProfessionalExperience !== undefined ? String(data.yearsOfPriorProfessionalExperience) : ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined
                  updateData({ yearsOfPriorProfessionalExperience: val })
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Setup */}
      <div className="space-y-4">
        <SectionHeader
          title={t('wizard.employment.userAccount')}
          description={t('wizard.employment.userAccountDescription')}
          icon={<UserPlus className="w-4 h-4" />}
        />

        <AnimatedCheckbox
          label={t('wizard.employment.createUserAccount')}
          checked={createAccount}
          onChange={(checked) => updateData({ createUserAccount: checked })}
          helpText={t('wizard.employment.createUserAccountHelp')}
        />

        <AnimatePresence>
          {createAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pl-8 border-l-2 border-[rgb(var(--border-focus)/0.35)]"
            >
              <div className="p-3 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] text-sm text-[rgb(var(--state-info-fg))] ">
                {t('wizard.employment.cognitoNotice', { email: (data.email as string) || t('wizard.employment.emailNotSet') })}
              </div>

              <AnimatedSelect
                label={t('quickAdd.systemRole')}
                value={(data.globalRole as string) || 'TenantUser'}
                onChange={handleChange('globalRole')}
                options={globalRoleOptions}
                helpText={t('wizard.employment.globalRoleHelp')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
