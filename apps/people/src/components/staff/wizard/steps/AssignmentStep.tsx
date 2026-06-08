/**
 * School Assignment Step
 *
 * Step 4: Primary school assignment and optional additional assignments.
 * Fetches school list for dropdown, tracks FTE across assignments.
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, Plus, X, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { WizardStepProps } from '@edforge/wizard'
import { apiGet } from '../../../../lib/api'
import {
  STAFF_ROLE_OPTIONS,
} from '../staff-wizard.utils'
import { AnimatedInput, AnimatedSelect, SectionHeader } from './shared'

// ============================================================================
// SCHOOL DATA HOOK
// ============================================================================

interface SchoolOption {
  id: string
  name: string
  code: string
  leaName?: string
}

function useSchools() {
  return useQuery<SchoolOption[]>({
    queryKey: ['schools', 'wizard-options'],
    queryFn: async () => {
      const response = await apiGet<{ items: Array<{ schoolId: string; name: string; schoolCode: string; localEducationAgencyName?: string }> }>('/schools')
      return (response.items || []).map((s) => ({
        id: s.schoolId,
        name: s.name,
        code: s.schoolCode,
        leaName: s.localEducationAgencyName,
      }))
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// ============================================================================
// DEPARTMENT DATA HOOK
// ============================================================================

interface DepartmentOption {
  id: string
  name: string
  code: string
}

export function useDepartments(schoolId: string | undefined) {
  return useQuery<DepartmentOption[]>({
    queryKey: ['departments', schoolId],
    queryFn: async () => {
      if (!schoolId) return []
      const response = await apiGet<{ items: Array<{ departmentId: string; name: string; code: string; isActive: boolean }> }>(
        `/schools/${schoolId}/departments`,
      )
      return (response.items || [])
        .filter((d) => d.isActive)
        .map((d) => ({ id: d.departmentId, name: d.name, code: d.code }))
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// ADDITIONAL ASSIGNMENT TYPE
// ============================================================================

interface AdditionalAssignment {
  schoolId: string
  role: string
  beginDate: string
  fullTimeEquivalency: number
  departmentId: string
}

function emptyAssignment(): AdditionalAssignment {
  return {
    schoolId: '',
    role: '',
    beginDate: new Date().toISOString().split('T')[0],
    fullTimeEquivalency: 0.5,
    departmentId: '',
  }
}

// ============================================================================
// FTE SLIDER
// ============================================================================

function FteSlider({
  value,
  onChange,
}: {
  value: number
  onChange: (val: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[rgb(var(--text-secondary))]">
        Full-Time Equivalency (FTE)
      </label>
      <div className="flex items-center gap-4">
        <input
          // allow-native-form-control: range slider has no DS adapter equivalent
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 h-2 rounded-full appearance-none bg-[rgb(var(--border-primary))] accent-teal-500"
        />
        <span className="text-sm font-mono font-medium text-[rgb(var(--text-primary))] w-12 text-right">
          {value.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// STEP COMPONENT
// ============================================================================

function AdditionalAssignmentDepartmentSelect({
  schoolId,
  value,
  onChange,
}: {
  schoolId: string
  value: string
  onChange: (val: string) => void
}) {
  const { data: departments = [], isLoading } = useDepartments(schoolId || undefined)
  return (
    <AnimatedSelect
      label="Department"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={[
        { value: '', label: isLoading ? 'Loading...' : 'Select department...' },
        ...departments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
      ]}
    />
  )
}

export function AssignmentStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const { data: schools = [], isLoading: loadingSchools } = useSchools()
  const primarySchoolId = (data.primarySchoolId as string) || ''
  const { data: primaryDepartments = [], isLoading: loadingPrimaryDepts } = useDepartments(primarySchoolId || undefined)
  const additionalAssignments = (data.additionalAssignments as AdditionalAssignment[]) || []

  const primaryFte = typeof data.primaryAssignmentFte === 'number' ? data.primaryAssignmentFte : 1.0
  const additionalFteTotal = additionalAssignments.reduce(
    (sum, a) => sum + (a.fullTimeEquivalency || 0),
    0,
  )
  const totalFte = primaryFte + additionalFteTotal
  const isOvercommitted = totalFte > 1.0

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  const schoolOptions = [
    { value: '', label: loadingSchools ? 'Loading schools...' : 'Select a school...' },
    ...schools.map((s) => ({
      value: s.id,
      label: s.leaName ? `${s.name} (${s.leaName})` : s.name,
    })),
  ]

  const roleOptions = [
    { value: '', label: 'Same as employment role' },
    ...STAFF_ROLE_OPTIONS,
  ]

  // Set defaults from employment step
  const effectiveBeginDate =
    (data.primaryAssignmentBeginDate as string) || (data.hireDate as string) || ''
  const effectiveRole =
    (data.primaryAssignmentRole as string) || (data.role as string) || ''

  // Additional assignments helpers
  const addAssignment = () => {
    updateData({ additionalAssignments: [...additionalAssignments, emptyAssignment()] })
  }
  const removeAdditionalAssignment = (index: number) => {
    updateData({
      additionalAssignments: additionalAssignments.filter((_, i) => i !== index),
    })
  }
  const updateAdditionalAssignment = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const updated = [...additionalAssignments]
    updated[index] = { ...updated[index], [field]: value }
    updateData({ additionalAssignments: updated })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Primary Assignment */}
      <div className="space-y-4">
        <SectionHeader
          title="Primary School Assignment"
          description="The staff member's main school placement"
          icon={<Building2 className="w-4 h-4" />}
        />

        <AnimatedSelect
          label="Primary School"
          required
          value={(data.primarySchoolId as string) || ''}
          onChange={(e) => {
            updateData({ primarySchoolId: e.target.value })
            clearError('primarySchoolId')
          }}
          error={errors.primarySchoolId}
          options={schoolOptions}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AnimatedSelect
            label="Role at School"
            value={effectiveRole}
            onChange={handleChange('primaryAssignmentRole')}
            options={roleOptions}
            helpText="Defaults to employment role"
          />
          <AnimatedSelect
            label="Department"
            value={(data.primaryAssignmentDepartmentId as string) || ''}
            onChange={(e) => {
              const deptId = e.target.value
              const dept = primaryDepartments.find((d) => d.id === deptId)
              updateData({
                primaryAssignmentDepartmentId: deptId,
                departmentName: dept?.name || '',
              })
            }}
            options={[
              { value: '', label: loadingPrimaryDepts ? 'Loading...' : 'Select department...' },
              ...primaryDepartments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` })),
            ]}
          />
          <AnimatedInput
            label="Begin Date"
            type="date"
            value={effectiveBeginDate}
            onChange={handleChange('primaryAssignmentBeginDate')}
            helpText="Defaults to hire date"
          />
        </div>

        <FteSlider
          value={primaryFte}
          onChange={(val) => updateData({ primaryAssignmentFte: val })}
        />
      </div>

      {/* Additional Assignments */}
      <div className="space-y-4">
        <SectionHeader
          title="Additional Assignments"
          description="Staff can be assigned to multiple schools"
        />

        <AnimatePresence>
          {additionalAssignments.map((assignment, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-[rgb(var(--border-secondary))] rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                  Assignment {index + 2}
                </span>
                <button
                  type="button"
                  onClick={() => removeAdditionalAssignment(index)}
                  className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] dark:hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <AnimatedSelect
                label="School"
                value={assignment.schoolId || ''}
                onChange={(e) => updateAdditionalAssignment(index, 'schoolId', e.target.value)}
                options={schoolOptions}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <AnimatedSelect
                  label="Role"
                  value={assignment.role || ''}
                  onChange={(e) => updateAdditionalAssignment(index, 'role', e.target.value)}
                  options={roleOptions}
                />
                <AnimatedInput
                  label="Begin Date"
                  type="date"
                  value={assignment.beginDate || ''}
                  onChange={(e) => updateAdditionalAssignment(index, 'beginDate', e.target.value)}
                />
                <AdditionalAssignmentDepartmentSelect
                  schoolId={assignment.schoolId}
                  value={assignment.departmentId || ''}
                  onChange={(val) => updateAdditionalAssignment(index, 'departmentId', val)}
                />
              </div>

              <FteSlider
                value={assignment.fullTimeEquivalency || 0.5}
                onChange={(val) => updateAdditionalAssignment(index, 'fullTimeEquivalency', val)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addAssignment}
          className="flex items-center gap-2 text-sm text-[rgb(var(--action-secondary-fg))]  hover:text-[rgb(var(--state-info-fg))] dark:hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Another School Assignment
        </button>
      </div>

      {/* FTE Summary */}
      <motion.div
        animate={{
          borderColor: isOvercommitted ? 'rgb(185, 62, 3)' : 'rgb(var(--border-secondary))',
        }}
        className="flex items-center justify-between p-4 rounded-xl border-2 bg-[rgb(var(--background-secondary))]"
      >
        <div className="flex items-center gap-2">
          {isOvercommitted && <AlertTriangle className="w-4 h-4 text-rust-500" />}
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            Total FTE
          </span>
        </div>
        <span
          className={`text-lg font-mono font-semibold ${
            isOvercommitted
              ? 'text-rust-500'
              : 'text-[rgb(var(--action-secondary-fg))] '
          }`}
        >
          {totalFte.toFixed(2)}
        </span>
      </motion.div>
      {isOvercommitted && (
        <p className="text-xs text-rust-500">
          Total FTE exceeds 1.0. This staff member may be overcommitted.
        </p>
      )}
    </motion.div>
  )
}
