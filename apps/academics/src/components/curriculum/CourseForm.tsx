/**
 * CourseForm Component
 *
 * Form for creating and editing courses, organized by section.
 * Uses @edforge/forms fields with react-hook-form context.
 * Must be wrapped in a FormProvider.
 */

import { useEffect, useMemo } from 'react'
import { useFieldArray, useFormContext } from '@edforge/forms'
import {
  TextField,
  SelectField,
  TextareaField,
  FormSection,
} from '@edforge/forms'
import { Input, Tooltip, InlineAlert } from '@edforge/ui'
import {
  Hash,
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  Plus,
  X,
  RotateCw,
  AlertTriangle,
} from 'lucide-react'
import type { AcademicSubjectDescriptor } from '@aibrains/shared-types'
import {
  ACADEMIC_SUBJECT_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CREDIT_TYPE_OPTIONS,
  DURATION_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  generateCourseCode,
  dedupeCourseCode,
  type CourseFormData,
} from '../../schemas/course.form'
import { useSchoolEnabledGradeOptions } from '../../hooks/useGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

interface CourseFormProps {
  /** Whether course code field is locked (edit mode) */
  isEdit?: boolean
  /**
   * School ID. The grade-level multi-select reads
   * `school.enabledGradeLevels` (with `gradeRange` fallback) to scope the
   * pickable codes. Pass null when no school is active.
   */
  schoolId: string | null
  /**
   * Course codes already in the catalog (loaded pages). Used to de-duplicate
   * the auto-generated course code (best-effort; the backend 409 is the
   * authoritative uniqueness guard).
   */
  existingCourseCodes?: string[]
}

// ============================================================================
// COURSE CODE AUTO-FILL (create mode)
// ============================================================================

/**
 * Suggests a compliant course code from the chosen Academic Subject + Grade
 * Levels and keeps it in sync — until the operator edits the code manually, at
 * which point it becomes a custom value and stops auto-updating. "Regenerate"
 * re-derives and re-enables auto-fill. Only rendered in create mode.
 */
function CourseCodeAutoFill({
  existingCourseCodes = [],
}: {
  existingCourseCodes?: string[]
}) {
  const { watch, setValue, getValues, resetField, formState } =
    useFormContext<CourseFormData>()
  const academicSubject = watch('academicSubject') as
    | AcademicSubjectDescriptor
    | undefined
  const gradeLevels = (watch('gradeLevels') ?? []) as string[]
  // Reading dirtyFields here subscribes the component to its changes (RHF proxy).
  const isCustom = Boolean(formState.dirtyFields.courseCode)
  const gradeKey = gradeLevels.join(',')
  const canGenerate = Boolean(academicSubject) && gradeLevels.length > 0

  useEffect(() => {
    if (isCustom || !canGenerate) return
    const next = dedupeCourseCode(
      generateCourseCode(academicSubject, gradeLevels),
      existingCourseCodes
    )
    if (next && next !== getValues('courseCode')) {
      setValue('courseCode', next, { shouldDirty: false, shouldValidate: true })
    }
    // existingCourseCodes is a fresh array each render; gradeKey + subject +
    // isCustom are the inputs that should re-derive the suggestion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicSubject, gradeKey, isCustom])

  const handleRegenerate = () => {
    if (!canGenerate) return
    const next = dedupeCourseCode(
      generateCourseCode(academicSubject, gradeLevels),
      existingCourseCodes
    )
    // resetField makes `next` the new pristine default, clearing the manual-edit
    // flag so the field resumes auto-updating with subject/grade changes.
    resetField('courseCode', { defaultValue: next })
  }

  return (
    <div className="mt-1.5 flex items-center justify-between gap-2">
      <p className="text-xs text-text-tertiary">
        {isCustom
          ? 'Custom code — won’t auto-update.'
          : 'Auto-generated from subject + grades — edit to override.'}
      </p>
      <button
        type="button"
        onClick={handleRegenerate}
        disabled={!canGenerate}
        className="inline-flex items-center gap-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCw className="w-3 h-3" />
        Regenerate
      </button>
    </div>
  )
}

// ============================================================================
// GRADE LEVEL MULTI-SELECT
// ============================================================================

function GradeLevelSelector({
  schoolId,
}: {
  schoolId: string | null
}) {
  const { watch, setValue, formState: { errors } } = useFormContext()
  const selected: string[] = watch('gradeLevels') ?? []
  const { options: baseOptions } = useSchoolEnabledGradeOptions(schoolId)

  // Include any already-selected grades that fall outside the school range
  // (edge case: school range narrowed after course creation)
  const options = useMemo(() => {
    const baseValues = new Set<string>(baseOptions.map((o) => o.value))
    const outOfRange = selected
      .filter((v) => !baseValues.has(v))
      .map((v) => GRADE_LEVEL_OPTIONS.find((o) => o.value === v))
      .filter(Boolean) as (typeof GRADE_LEVEL_OPTIONS)[number][]
    return outOfRange.length > 0 ? [...baseOptions, ...outOfRange] : baseOptions
  }, [baseOptions, selected])

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    setValue('gradeLevels', next, { shouldValidate: true })
  }

  const error = errors?.gradeLevels?.message as string | undefined
  const baseValues = new Set<string>(baseOptions.map((o) => o.value))

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Grade Levels <span className="text-[rgb(var(--state-danger-fg))]">*</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt.value)
          const isOutOfRange = !baseValues.has(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                isSelected
                  ? isOutOfRange
                    ? 'bg-[rgb(var(--state-warning-fg))] text-[rgb(var(--action-primary-fg))] border-amber-500 shadow-sm'
                    : 'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] border-[rgb(var(--border-focus))] shadow-sm'
                  : isOutOfRange
                    ? 'bg-surface-primary text-amber-500 border-amber-300 border-dashed hover:border-amber-400'
                    : 'bg-surface-primary text-text-secondary border-border-primary hover:border-[rgb(var(--border-focus))] hover:text-text-primary'
              }`}
              title={isOutOfRange ? 'Outside school grade range' : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-[rgb(var(--state-danger-fg))]">{error}</p>
      )}
    </div>
  )
}

// ============================================================================
// OBJECTIVES TAG INPUT
// ============================================================================

function ObjectivesInput() {
  const { watch, setValue } = useFormContext()
  const objectives: string[] = watch('objectives') ?? []

  const addObjective = (value: string) => {
    if (value.trim() && objectives.length < 20) {
      setValue('objectives', [...objectives, value.trim()], { shouldValidate: true })
    }
  }

  const removeObjective = (index: number) => {
    setValue('objectives', objectives.filter((_, i) => i !== index), { shouldValidate: true })
  }

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-2">
        Learning Objectives
      </label>
      <div className="space-y-2">
        {objectives.map((obj, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-3 py-2 bg-surface-secondary rounded-lg border border-border-secondary"
          >
            <span className="flex-1 text-sm text-text-primary">{obj}</span>
            <button
              type="button"
              onClick={() => removeObjective(i)}
              className="p-0.5 rounded text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {objectives.length < 20 && (
          <Input
            placeholder="Type an objective and press Enter"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addObjective(e.currentTarget.value)
                e.currentTarget.value = ''
              }
            }}
          />
        )}
      </div>
      <p className="mt-1 text-xs text-text-tertiary">
        {objectives.length}/20 objectives
      </p>
    </div>
  )
}

// ============================================================================
// MATERIALS LIST
// ============================================================================

function MaterialsList() {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'textbooks',
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-text-primary">
          Course Materials
        </label>
        <button
          type="button"
          onClick={() =>
            append({
              type: 'textbook',
              title: '',
              author: '',
              isbn: '',
              isRequired: true,
            })
          }
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--state-info-bg)/0.18)] rounded-md transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Material
        </button>
      </div>

      {fields.length === 0 ? (
        <p className="text-sm text-text-tertiary py-2">
          No materials added yet. Click "Add Material" to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 bg-surface-secondary rounded-lg border border-border-secondary space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                  Material {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-1 rounded text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <SelectField
                    name={`textbooks.${index}.type`}
                    label="Type"
                    options={MATERIAL_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <TextField
                    name={`textbooks.${index}.title`}
                    label="Title"
                    placeholder="Material title"
                  />
                </div>

                <TextField
                  name={`textbooks.${index}.author`}
                  label="Author"
                  placeholder="Author name"
                />

                <TextField
                  name={`textbooks.${index}.isbn`}
                  label="ISBN"
                  placeholder="ISBN-13"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COURSE FORM
// ============================================================================

export function CourseForm({ isEdit = false, schoolId, existingCourseCodes }: CourseFormProps) {
  const { watch } = useFormContext<CourseFormData>()
  const academicSubject = watch('academicSubject')
  // Legacy courses created before academicSubject became required can load without
  // it; surface the gap in edit mode so the operator can complete the record.
  const subjectMissing = isEdit && !academicSubject

  return (
    <div className="space-y-8">
      {subjectMissing && (
        <InlineAlert variant="warning" title="Incomplete course data">
          This course has no granular Academic Subject. Set it below so report cards and the Ed-Fi
          subject rollup label correctly, then Save.
        </InlineAlert>
      )}

      {/* Section 1: Identity */}
      <FormSection
        title="Course Identity"
        description="The course code is auto-generated from the subject and grade levels. It's a unique identifier and cannot be changed after creation."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <TextField
              name="courseCode"
              label="Course Code"
              placeholder="e.g., MATH-101"
              icon={Hash}
              disabled={isEdit}
            />
            {!isEdit && <CourseCodeAutoFill existingCourseCodes={existingCourseCodes} />}
          </div>
          <TextField
            name="courseName"
            label="Course Name"
            placeholder="e.g., Algebra I"
            icon={BookOpen}
          />
        </div>
      </FormSection>

      {/* Section 2: Classification */}
      <FormSection
        title="Classification"
        description="Categorize this course by subject, type, and credit level. The broad Ed-Fi subject area is derived automatically from the academic subject."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            name="academicSubject"
            label={
              subjectMissing ? (
                <span className="inline-flex items-center gap-1">
                  Academic Subject
                  <Tooltip content="Missing — required for report-card labels and the Ed-Fi subject rollup.">
                    <AlertTriangle className="w-3.5 h-3.5 text-[rgb(var(--state-warning-fg))]" />
                  </Tooltip>
                </span>
              ) : (
                'Academic Subject'
              )
            }
            placeholder="Select academic subject"
            options={ACADEMIC_SUBJECT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            icon={GraduationCap}
          />
          <SelectField
            name="courseType"
            label="Course Type"
            placeholder="Select course type"
            options={COURSE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <SelectField
            name="creditType"
            label="Credit Type"
            placeholder="Select credit type"
            options={CREDIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            icon={Award}
          />
          <TextField
            name="credits"
            label="Credits"
            type="number"
            placeholder="e.g., 1"
          />
          <SelectField
            name="typicalDuration"
            label="Duration"
            placeholder="Select duration"
            options={DURATION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            icon={Clock}
          />
          <TextField
            name="periodsPerWeek"
            label="Periods per Week"
            type="number"
            placeholder="e.g., 5"
          />
        </div>
      </FormSection>

      {/* Section 3: Grade Levels */}
      <FormSection
        title="Grade Levels"
        description="Select which grade levels this course is offered to."
      >
        <GradeLevelSelector schoolId={schoolId} />
      </FormSection>

      {/* Section 4: Description & Objectives */}
      <FormSection
        title="Description & Objectives"
        description="Provide a course description and define learning objectives."
      >
        <TextareaField
          name="description"
          label="Course Description"
          placeholder="Describe what this course covers, its goals, and student expectations..."
        />
        <div className="mt-4">
          <ObjectivesInput />
        </div>
      </FormSection>

      {/* Section 5: Materials (optional) */}
      <FormSection
        title="Course Materials"
        description="Add textbooks, workbooks, or digital resources for this course."
      >
        <MaterialsList />
      </FormSection>
    </div>
  )
}
