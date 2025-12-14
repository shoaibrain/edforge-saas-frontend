/**
 * TeacherSection Component
 * 
 * A composable form section for teacher-specific information.
 * Includes subjects, grades, and specializations.
 */

import { GraduationCap, type LucideIcon } from 'lucide-react'
import { TextField, SelectField } from '../fields'
import { FormSection } from './FormSection'

const SUBJECT_OPTIONS = [
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'english', label: 'English' },
  { value: 'science', label: 'Science' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'history', label: 'History' },
  { value: 'geography', label: 'Geography' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'physical_education', label: 'Physical Education' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'foreign_language', label: 'Foreign Language' },
]

const GRADE_OPTIONS = [
  { value: 'elementary', label: 'Elementary (K-5)' },
  { value: 'middle', label: 'Middle School (6-8)' },
  { value: 'high', label: 'High School (9-12)' },
  { value: 'all', label: 'All Grades' },
]

export interface TeacherSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  showClassroom?: boolean
  showQualifications?: boolean
}

export function TeacherSection({
  namePrefix = '',
  showHeader = true,
  title = 'Teaching Information',
  icon: Icon = GraduationCap,
  disabled = false,
  showClassroom = true,
  showQualifications = true,
}: TeacherSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Subjects, grades, and teaching details' : undefined}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Primary Subject */}
          <SelectField
            name={`${prefix}subjects[0]`}
            label="Primary Subject"
            placeholder="Select subject"
            options={SUBJECT_OPTIONS}
            required
            disabled={disabled}
          />

          {/* Grade Level */}
          <SelectField
            name={`${prefix}grades[0]`}
            label="Grade Level"
            placeholder="Select grades"
            options={GRADE_OPTIONS}
            required
            disabled={disabled}
          />

          {/* Classroom ID */}
          {showClassroom && (
            <TextField
              name={`${prefix}classroomId`}
              label="Assigned Classroom"
              placeholder="e.g., Room 101"
              disabled={disabled}
            />
          )}

          {/* Specializations */}
          <TextField
            name={`${prefix}specializations`}
            label="Specializations"
            placeholder="e.g., AP Physics, ESL"
            disabled={disabled}
            helperText="Comma-separated list"
          />
        </div>

        {/* Qualifications */}
        {showQualifications && (
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-4">
              Qualifications & Certifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`${prefix}qualifications`}
                label="Degrees / Qualifications"
                placeholder="e.g., M.Ed, B.S. Mathematics"
                disabled={disabled}
                helperText="Comma-separated list"
              />
              <TextField
                name={`${prefix}certifications`}
                label="Certifications"
                placeholder="e.g., State Teaching License"
                disabled={disabled}
                helperText="Comma-separated list"
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  )
}

