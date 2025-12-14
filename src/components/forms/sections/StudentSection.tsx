/**
 * StudentSection Component
 * 
 * A composable form section for student-specific information.
 * Includes grade, enrollment, guardian, and medical info.
 */

import { GraduationCap, type LucideIcon } from 'lucide-react'
import { TextField, SelectField, DateField } from '../fields'
import { FormSection } from './FormSection'

const GRADE_OPTIONS = [
  { value: 'pre-k', label: 'Pre-K' },
  { value: 'kindergarten', label: 'Kindergarten' },
  { value: '1st', label: '1st Grade' },
  { value: '2nd', label: '2nd Grade' },
  { value: '3rd', label: '3rd Grade' },
  { value: '4th', label: '4th Grade' },
  { value: '5th', label: '5th Grade' },
  { value: '6th', label: '6th Grade' },
  { value: '7th', label: '7th Grade' },
  { value: '8th', label: '8th Grade' },
  { value: '9th', label: '9th Grade' },
  { value: '10th', label: '10th Grade' },
  { value: '11th', label: '11th Grade' },
  { value: '12th', label: '12th Grade' },
]

const TRANSPORT_OPTIONS = [
  { value: 'bus', label: 'School Bus' },
  { value: 'self', label: 'Self / Walk' },
  { value: 'carpool', label: 'Carpool' },
  { value: 'other', label: 'Other' },
]

export interface StudentSectionProps {
  namePrefix?: string
  showHeader?: boolean
  title?: string
  icon?: LucideIcon
  disabled?: boolean
  showMedical?: boolean
  showTransport?: boolean
}

export function StudentSection({
  namePrefix = '',
  showHeader = true,
  title = 'Student Information',
  icon: Icon = GraduationCap,
  disabled = false,
  showMedical = false,
  showTransport = true,
}: StudentSectionProps) {
  const prefix = namePrefix ? `${namePrefix}.` : ''

  return (
    <FormSection
      title={showHeader ? title : undefined}
      icon={showHeader ? Icon : undefined}
      description={showHeader ? 'Academic and enrollment details' : undefined}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student ID */}
          <TextField
            name={`${prefix}studentId`}
            label="Student ID"
            placeholder="STU-0001"
            required
            disabled={disabled}
            helperText="Unique student identifier"
          />

          {/* Grade */}
          <SelectField
            name={`${prefix}grade`}
            label="Grade Level"
            placeholder="Select grade"
            options={GRADE_OPTIONS}
            required
            disabled={disabled}
          />

          {/* Section */}
          <TextField
            name={`${prefix}section`}
            label="Section / Class"
            placeholder="e.g., A, B, C"
            disabled={disabled}
          />

          {/* Enrollment Date */}
          <DateField
            name={`${prefix}enrollmentDate`}
            label="Enrollment Date"
            required
            disabled={disabled}
          />

          {/* Expected Graduation */}
          <DateField
            name={`${prefix}expectedGraduationDate`}
            label="Expected Graduation"
            disabled={disabled}
          />

          {/* Admission Number */}
          <TextField
            name={`${prefix}admissionNumber`}
            label="Admission Number"
            placeholder="ADM-2024-001"
            disabled={disabled}
          />

          {/* Previous School */}
          <TextField
            name={`${prefix}previousSchool`}
            label="Previous School"
            placeholder="Name of previous school"
            disabled={disabled}
            className="md:col-span-2"
          />

          {/* Transport Mode */}
          {showTransport && (
            <SelectField
              name={`${prefix}transportMode`}
              label="Transport Mode"
              placeholder="Select transport"
              options={TRANSPORT_OPTIONS}
              disabled={disabled}
            />
          )}
        </div>

        {/* Medical Information */}
        {showMedical && (
          <div className="pt-4 border-t border-[rgb(var(--border-primary))]">
            <h4 className="text-sm font-medium text-[rgb(var(--text-secondary))] mb-4">
              Medical Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                name={`${prefix}medical.bloodType`}
                label="Blood Type"
                placeholder="e.g., A+, O-"
                disabled={disabled}
              />
              <TextField
                name={`${prefix}medical.allergies`}
                label="Allergies"
                placeholder="Comma-separated list"
                disabled={disabled}
                helperText="e.g., Peanuts, Penicillin"
              />
              <TextField
                name={`${prefix}medical.medications`}
                label="Current Medications"
                placeholder="Comma-separated list"
                disabled={disabled}
                className="md:col-span-2"
              />
            </div>
          </div>
        )}
      </div>
    </FormSection>
  )
}

