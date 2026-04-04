/**
 * CourseForm Component
 *
 * Form for creating and editing courses, organized by section.
 * Uses @edforge/forms fields with react-hook-form context.
 * Must be wrapped in a FormProvider.
 */

import { useMemo } from 'react'
import { useFieldArray, useFormContext } from '@edforge/forms'
import {
  TextField,
  SelectField,
  TextareaField,
  FormSection,
} from '@edforge/forms'
import {
  Hash,
  BookOpen,
  GraduationCap,
  Clock,
  Award,
  Plus,
  X,
} from 'lucide-react'
import {
  SUBJECT_AREA_OPTIONS,
  COURSE_TYPE_OPTIONS,
  CREDIT_TYPE_OPTIONS,
  DURATION_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from '../../schemas/course.form'
import { useFilteredGradeOptions } from '../../hooks/useGradeOptions'

// ============================================================================
// TYPES
// ============================================================================

interface CourseFormProps {
  /** Whether course code field is locked (edit mode) */
  isEdit?: boolean
  /** School's configured grade range for filtering grade options */
  schoolGradeRange?: { start: string; end: string } | null
}

// ============================================================================
// GRADE LEVEL MULTI-SELECT
// ============================================================================

function GradeLevelSelector({
  schoolGradeRange,
}: {
  schoolGradeRange?: { start: string; end: string } | null
}) {
  const { watch, setValue, formState: { errors } } = useFormContext()
  const selected: string[] = watch('gradeLevels') ?? []
  const baseOptions = useFilteredGradeOptions(schoolGradeRange)

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
        Grade Levels <span className="text-red-500">*</span>
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
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-teal-500 text-white border-teal-500 shadow-sm'
                  : isOutOfRange
                    ? 'bg-surface-primary text-amber-500 border-amber-300 border-dashed hover:border-amber-400'
                    : 'bg-surface-primary text-text-secondary border-border-primary hover:border-teal-400 hover:text-text-primary'
              }`}
              title={isOutOfRange ? 'Outside school grade range' : undefined}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
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
              className="p-0.5 rounded text-text-tertiary hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {objectives.length < 20 && (
          <input
            type="text"
            placeholder="Type an objective and press Enter"
            className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
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
  const { control, register } = useFormContext()
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
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
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
                  className="p-1 rounded text-text-tertiary hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Type
                  </label>
                  <select
                    {...register(`textbooks.${index}.type`)}
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {MATERIAL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Title *
                  </label>
                  <input
                    {...register(`textbooks.${index}.title`)}
                    placeholder="Material title"
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    Author
                  </label>
                  <input
                    {...register(`textbooks.${index}.author`)}
                    placeholder="Author name"
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    ISBN
                  </label>
                  <input
                    {...register(`textbooks.${index}.isbn`)}
                    placeholder="ISBN-13"
                    className="w-full px-3 py-2 text-sm bg-surface-primary border border-border-primary rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
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

export function CourseForm({ isEdit = false, schoolGradeRange }: CourseFormProps) {
  return (
    <div className="space-y-8">
      {/* Section 1: Identity */}
      <FormSection
        title="Course Identity"
        description="The course code is a unique identifier and cannot be changed after creation."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="courseCode"
            label="Course Code"
            placeholder="e.g., MATH-101"
            icon={Hash}
            disabled={isEdit}
          />
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
        description="Categorize this course by subject, type, and credit level."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            name="subjectArea"
            label="Subject Area"
            placeholder="Select subject area"
            options={SUBJECT_AREA_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
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
        <GradeLevelSelector schoolGradeRange={schoolGradeRange} />
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
