/**
 * SectionForm Component
 *
 * Form for creating/editing a class section.
 * Uses @edforge/forms components + custom teacher/course selectors.
 */

import { useEffect } from 'react'
import { useFormContext } from 'react-hook-form'
import { User, BookOpen, MapPin } from 'lucide-react'
import { useCourses, flattenCoursePages } from '../../hooks/useCourses'
import { useCourseOfferings, flattenOfferingPages } from '../../hooks/useCourseOfferings'
import { useSchoolStaff, flattenStaffData, getStaffDisplayName } from '../../hooks/useStaff'
import { useSchoolClassPeriods, useSchoolLocations } from '../../hooks/useScheduleResources'
import { useAcademicYears } from '../../hooks/useSchool'
import { useGradingPeriods } from '../../hooks/useSchool'
import { useActiveSchoolId } from '../../stores/app.store'
import type { SectionFormData } from '../../schemas/section.form'

// ============================================================================
// FORM SECTION WRAPPER
// ============================================================================

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description?: string
  icon: typeof BookOpen
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border-secondary p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 text-teal-500" />
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {description && (
            <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// FIELD WRAPPER
// ============================================================================

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-text-secondary">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ============================================================================
// SECTION FORM
// ============================================================================

interface SectionFormProps {
  isEdit?: boolean
}

export function SectionForm({ isEdit }: SectionFormProps) {
  const schoolId = useActiveSchoolId() || ''
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<SectionFormData>()

  const academicYearId = watch('academicYearId')

  // Fetch data for selectors
  const { data: coursesData } = useCourses({
    schoolId,
    filters: { isActive: true },
    limit: 200,
    enabled: !!schoolId,
  })
  const courses = flattenCoursePages(coursesData)

  const { data: staffData } = useSchoolStaff(schoolId)
  const teachers = flattenStaffData(staffData)

  const { data: academicYears } = useAcademicYears(schoolId)
  const { data: gradingPeriods } = useGradingPeriods(
    schoolId,
    academicYearId || '',
    !!academicYearId
  )

  // Sprint 3: Fetch schedule resources from Identity service
  const { data: classPeriodsData } = useSchoolClassPeriods(schoolId)
  const classPeriods = classPeriodsData?.items || []
  const { data: locationsData } = useSchoolLocations(schoolId)
  const locations = (locationsData?.items || []).filter((l) => l.isActive)

  // Sprint 3: Fetch course offerings filtered by selected course
  const courseId = watch('courseId')
  const offeringsData = useCourseOfferings({
    schoolId,
    courseId: courseId || undefined,
    enabled: !!schoolId && !!courseId,
  })
  const offerings = flattenOfferingPages(offeringsData.data)

  // Auto-select current academic year on mount
  useEffect(() => {
    if (!isEdit && academicYears && !academicYearId) {
      const current = academicYears.find((y) => y.isCurrent)
      if (current) {
        setValue('academicYearId', current.yearId)
      }
    }
  }, [academicYears, academicYearId, isEdit, setValue])

  const inputClass =
    'w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors'
  const selectClass = inputClass

  return (
    <div className="space-y-6">
      {/* Section Identity */}
      <FormSection
        title="Section Identity"
        description="Link this section to a course and give it a unique identifier."
        icon={BookOpen}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Course"
            required
            error={errors.courseId?.message}
          >
            <select
              {...register('courseId')}
              disabled={isEdit}
              className={selectClass}
            >
              <option value="">Select a course...</option>
              {courses.map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.courseCode} — {c.courseName}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Section Number"
            required
            error={errors.sectionNumber?.message}
          >
            <input
              type="text"
              placeholder="e.g., 001"
              {...register('sectionNumber')}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Section Name" error={errors.sectionName?.message}>
          <input
            type="text"
            placeholder="e.g., Algebra I - Period 3 (optional)"
            {...register('sectionName')}
            className={inputClass}
          />
        </Field>
      </FormSection>

      {/* Teacher Assignment */}
      <FormSection
        title="Teacher Assignment"
        description="Assign the primary instructor for this section."
        icon={User}
      >
        <Field
          label="Primary Teacher"
          required
          error={errors.primaryTeacherId?.message}
        >
          <select
            {...register('primaryTeacherId')}
            className={selectClass}
          >
            <option value="">Select a teacher...</option>
            {teachers.map((t) => (
              <option key={t.staffId} value={t.staffId}>
                {getStaffDisplayName(t)}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      {/* Logistics & Schedule */}
      <FormSection
        title="Logistics"
        description="Room, capacity, term, and period assignment."
        icon={MapPin}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Location / Room" error={errors.locationId?.message}>
            <select {...register('locationId')} className={selectClass}>
              <option value="">No room assigned</option>
              {locations.map((l) => (
                <option key={l.locationId} value={l.locationId}>
                  {l.roomNumber}{l.buildingName ? ` (${l.buildingName})` : ''}
                  {l.capacity ? ` — ${l.capacity} seats` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Max Enrollment"
            required
            error={errors.maxEnrollment?.message}
          >
            <input
              type="number"
              min={1}
              max={500}
              {...register('maxEnrollment')}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Academic Year"
            required
            error={errors.academicYearId?.message}
          >
            <select
              {...register('academicYearId')}
              disabled={isEdit}
              className={selectClass}
            >
              <option value="">Select year...</option>
              {(academicYears || []).map((y) => (
                <option key={y.yearId} value={y.yearId}>
                  {y.name} {y.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Term" error={errors.termId?.message}>
            <select {...register('termId')} className={selectClass}>
              <option value="">All terms / Full year</option>
              {(gradingPeriods || []).map((p) => (
                <option key={p.periodId} value={p.periodId}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Class Period" error={errors.classPeriodId?.message}>
            <select {...register('classPeriodId')} className={selectClass}>
              <option value="">No period assigned</option>
              {classPeriods
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((p) => (
                  <option key={p.periodId} value={p.periodId}>
                    {p.classPeriodName} ({p.startTime} - {p.endTime})
                  </option>
                ))}
            </select>
          </Field>

          {courseId && (
            <Field label="Course Offering" error={errors.courseOfferingId?.message}>
              <select {...register('courseOfferingId')} className={selectClass}>
                <option value="">No offering linked</option>
                {offerings.map((o) => (
                  <option key={o.courseOfferingId} value={o.courseOfferingId}>
                    {o.courseName || o.courseCode} — {o.sessionName || o.academicSessionId}
                    {o.localCourseCode ? ` (${o.localCourseCode})` : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
      </FormSection>
    </div>
  )
}
