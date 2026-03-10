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
import {
  STAFF_ROLE_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GLOBAL_ROLE_OPTIONS,
  TEACHING_ROLES,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, AnimatedCheckbox, SectionHeader } from './shared'

export function EmploymentStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const role = data.role as string
  const isTeachingRole = TEACHING_ROLES.includes(role)
  const createAccount = data.createUserAccount === true

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
          title="Employment Details"
          description="Role and employment classification"
          icon={<Briefcase className="w-4 h-4" />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedSelect
            label="Role"
            required
            value={role || ''}
            onChange={(e) => {
              updateData({ role: e.target.value })
              clearError('role')
            }}
            error={errors.role}
            options={[{ value: '', label: 'Select a role...' }, ...STAFF_ROLE_OPTIONS]}
          />
          <AnimatedSelect
            label="Employment Type"
            required
            value={(data.employmentType as string) || 'full_time'}
            onChange={handleChange('employmentType')}
            error={errors.employmentType}
            options={EMPLOYMENT_TYPE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatedInput
            label="Hire Date"
            required
            type="date"
            value={(data.hireDate as string) || ''}
            onChange={handleChange('hireDate')}
            error={errors.hireDate}
          />
          <AnimatedInput
            label="Position Title"
            placeholder="e.g., Senior Math Teacher"
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
              title="Teaching Qualifications"
              description="Ed-Fi fields for instructional staff"
              icon={<GraduationCap className="w-4 h-4" />}
            />

            <AnimatedCheckbox
              label="Highly Qualified Teacher (HQT)"
              checked={data.highlyQualifiedTeacher === true}
              onChange={(checked) => updateData({ highlyQualifiedTeacher: checked })}
              helpText="As defined by NCLB/ESSA requirements"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatedInput
                label="Years of Prior Teaching Experience"
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
                label="Years of Prior Professional Experience"
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
          title="User Account"
          description="Optionally create a login account for this staff member"
          icon={<UserPlus className="w-4 h-4" />}
        />

        <AnimatedCheckbox
          label="Create user account for this staff member"
          checked={createAccount}
          onChange={(checked) => updateData({ createUserAccount: checked })}
          helpText="Enables login access to EdForge. An email invitation will be sent."
        />

        <AnimatePresence>
          {createAccount && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pl-8 border-l-2 border-teal-500/30"
            >
              <div className="p-3 rounded-lg bg-teal-500/10 text-sm text-teal-700 dark:text-teal-300">
                A Cognito account will be created with the email from Step 2
                ({(data.email as string) || 'not set yet'}). A temporary password will be auto-generated.
              </div>

              <AnimatedSelect
                label="Global Role"
                value={(data.globalRole as string) || 'TenantUser'}
                onChange={handleChange('globalRole')}
                options={GLOBAL_ROLE_OPTIONS}
                helpText="TenantAdmin has full system access"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
