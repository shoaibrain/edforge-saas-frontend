/**
 * SectionForm Component
 *
 * Form for creating/editing a class section.
 * Uses react-hook-form context + @edforge/ui form primitives.
 */

import { useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { User, BookOpen, MapPin } from 'lucide-react'
import { Field, Input, Select } from '@edforge/ui'
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
        <Icon className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]" />
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
// SECTION FORM
// ============================================================================

interface SectionFormProps {
  isEdit?: boolean
}

export function SectionForm({ isEdit }: SectionFormProps) {
  const schoolId = useActiveSchoolId() || ''
  const {
    register,
    control,
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

  return (
    <div className="space-y-6">
      {/* Section Identity */}
      <FormSection
        title="Section Identity"
        description="Link this section to a course and give it a unique identifier."
        icon={BookOpen}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="courseId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Course"
                required
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isEdit}
                error={fieldState.error?.message}
                placeholder="Select a course..."
                options={courses.map((c) => ({
                  value: c.courseId,
                  label: `${c.courseCode} — ${c.courseName}`,
                }))}
              />
            )}
          />

          <Field label="Section Number" required error={errors.sectionNumber?.message}>
            <Input placeholder="e.g., 001" {...register('sectionNumber')} />
          </Field>
        </div>

        <Field label="Section Name" optionalText={null} error={errors.sectionName?.message}>
          <Input placeholder="e.g., Algebra I - Period 3 (optional)" {...register('sectionName')} />
        </Field>
      </FormSection>

      {/* Teacher Assignment */}
      <FormSection
        title="Teacher Assignment"
        description="Assign the primary instructor for this section."
        icon={User}
      >
        <Controller
          name="primaryTeacherId"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              label="Primary Teacher"
              required
              value={field.value ?? ''}
              onChange={field.onChange}
              error={fieldState.error?.message}
              placeholder="Select a teacher..."
              options={teachers.map((t) => ({
                value: t.staffId,
                label: getStaffDisplayName(t),
              }))}
            />
          )}
        />
      </FormSection>

      {/* Logistics & Schedule */}
      <FormSection
        title="Logistics"
        description="Room, capacity, term, and period assignment."
        icon={MapPin}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="locationId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Location / Room"
                optionalText={null}
                clearable
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                error={fieldState.error?.message}
                placeholder="No room assigned"
                options={locations.map((l) => ({
                  value: l.locationId,
                  label: `${l.roomNumber}${l.buildingName ? ` (${l.buildingName})` : ''}${l.capacity ? ` — ${l.capacity} seats` : ''}`,
                }))}
              />
            )}
          />

          <Field label="Max Enrollment" required error={errors.maxEnrollment?.message}>
            <Input type="number" min={1} max={500} {...register('maxEnrollment')} />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="academicYearId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Academic Year"
                required
                value={field.value ?? ''}
                onChange={field.onChange}
                disabled={isEdit}
                error={fieldState.error?.message}
                placeholder="Select year..."
                options={(academicYears || []).map((y) => ({
                  value: y.yearId,
                  label: `${y.name}${y.isCurrent ? ' (Current)' : ''}`,
                }))}
              />
            )}
          />

          <Controller
            name="termId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Term"
                optionalText={null}
                clearable
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                error={fieldState.error?.message}
                placeholder="All terms / Full year"
                options={(gradingPeriods || []).map((p) => ({
                  value: p.termId ?? p.periodId ?? '',
                  label: p.name,
                }))}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Controller
            name="classPeriodId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                label="Class Period"
                optionalText={null}
                clearable
                value={field.value ?? ''}
                onChange={(v) => field.onChange(v ?? '')}
                error={fieldState.error?.message}
                placeholder="No period assigned"
                options={[...classPeriods]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p) => ({
                    value: p.periodId,
                    label: `${p.classPeriodName} (${p.startTime} - ${p.endTime})`,
                  }))}
              />
            )}
          />

          {courseId && (
            <Controller
              name="courseOfferingId"
              control={control}
              render={({ field, fieldState }) => (
                <Select
                  label="Course Offering"
                  optionalText={null}
                  clearable
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v ?? '')}
                  error={fieldState.error?.message}
                  placeholder="No offering linked"
                  options={offerings.map((o) => ({
                    value: o.courseOfferingId,
                    label: `${o.courseName || o.courseCode} — ${o.sessionName || o.academicSessionId}${o.localCourseCode ? ` (${o.localCourseCode})` : ''}`,
                  }))}
                />
              )}
            />
          )}
        </div>
      </FormSection>
    </div>
  )
}
