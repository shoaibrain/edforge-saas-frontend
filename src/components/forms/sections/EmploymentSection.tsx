/**
 * EmploymentSection Component
 * 
 * A composable form section for employment information.
 * Used for teachers, staff, and admin personnel.
 */

import { Briefcase, type LucideIcon } from 'lucide-react'
import { TextField, SelectField, DateField } from '../fields'
import { FormSection } from './FormSection'

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
  { value: 'library', label: 'Library' },
  { value: 'counseling', label: 'Counseling' },
  { value: 'finance', label: 'Finance' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'facilities', label: 'Facilities' },
  { value: 'security', label: 'Security' },
]

export interface EmploymentSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  showSalary?: boolean
  showTerminationDate?: boolean
  departmentOptions?: typeof DEPARTMENT_OPTIONS
}

export function EmploymentSection({
  namePrefix = '',
  showHeader = true,
  title = 'Employment Details',
  icon: Icon = Briefcase,
  disabled = false,
  showSalary = false,
  showTerminationDate = false,
  departmentOptions = DEPARTMENT_OPTIONS,
}: EmploymentSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Employment and position information' : undefined}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee ID */}
        <TextField
          name={`${prefix}employeeId`}
          label="Employee ID"
          placeholder="EMP-001"
          required
          disabled={disabled}
          helperText="Unique identifier for this employee"
        />

        {/* Employment Type */}
        <SelectField
          name={`${prefix}employmentType`}
          label="Employment Type"
          placeholder="Select type"
          options={EMPLOYMENT_TYPE_OPTIONS}
          required
          disabled={disabled}
        />

        {/* Department */}
        <SelectField
          name={`${prefix}department`}
          label="Department"
          placeholder="Select department"
          options={departmentOptions}
          required
          disabled={disabled}
        />

        {/* Position / Title */}
        <TextField
          name={`${prefix}position`}
          label="Position / Title"
          placeholder="e.g., Math Teacher"
          required
          disabled={disabled}
        />

        {/* Hire Date */}
        <DateField
          name={`${prefix}hireDate`}
          label="Hire Date"
          required
          disabled={disabled}
        />

        {/* Reports To */}
        <TextField
          name={`${prefix}reportsTo`}
          label="Reports To"
          placeholder="Supervisor name or ID"
          disabled={disabled}
        />

        {/* Salary */}
        {showSalary && (
          <TextField
            name={`${prefix}salary`}
            label="Annual Salary"
            type="text"
            placeholder="$0.00"
            disabled={disabled}
            helperText="Annual compensation"
          />
        )}

        {/* Termination Date */}
        {showTerminationDate && (
          <DateField
            name={`${prefix}terminationDate`}
            label="Termination Date"
            disabled={disabled}
            helperText="Leave blank if still employed"
          />
        )}
      </div>
    </FormSection>
  )
}

