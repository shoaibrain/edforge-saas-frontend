/**
 * EditDemographicsModal — Student Detail Sprint 3 S3.6
 *
 * PATCH-form for the eight Ed-Fi descriptor fields. Persists via
 * `useUpdateStudentDescriptors` → PATCH /academics/students/:id/descriptors.
 * Backend emits a `student.descriptor.edited` audit event on success (S3.7).
 *
 * Field layout:
 *   - Sex / primary language / mother-tongue: dropdowns sourced from
 *     `listDescriptorUris(type)`, labelled via `getDisplayName(uri, locale)`.
 *   - Disabilities: dynamic array (disability URI + optional notes); +/- rows.
 *   - Ethnicity: free-text URI input (URI shape only — Sprint 6 replaces this
 *     with a catalog dropdown once the ethnicity taxonomy passes legal review).
 *   - Flags: isTransferred (checkbox), belowPovertyLine (checkbox) +
 *     scholarshipCategory shown conditionally when belowPovertyLine is true.
 */

import { useMemo } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { Modal, ModalFooter, Button } from '@edforge/ui'
import {
  getDisplayName,
  listDescriptorUris,
  type DescriptorLocale,
  type StudentProfileResponseDto,
} from '@aibrains/shared-types'
import { useUpdateStudentDescriptors } from '../../../hooks'
import type { StudentDescriptorPatchInput } from '../../../services/academics.service'

// ============================================================================
// PROPS
// ============================================================================

export interface EditDemographicsModalProps {
  student: StudentProfileResponseDto
  onClose: () => void
  locale?: DescriptorLocale
}

// ============================================================================
// FORM SHAPE
// ============================================================================

interface FormShape {
  sexDescriptor: string
  languageDescriptor: string
  motherTongueDescriptor: string
  disabilities: Array<{ descriptor: string; notes: string }>
  ethnicityDescriptor: string
  isTransferred: boolean
  belowPovertyLine: boolean
  scholarshipCategory: string
}

function studentToFormDefaults(student: StudentProfileResponseDto): FormShape {
  return {
    sexDescriptor: student.sexDescriptor ?? '',
    languageDescriptor: student.languageDescriptor ?? '',
    motherTongueDescriptor: student.motherTongueDescriptor ?? '',
    disabilities:
      student.disabilities?.map((d) => ({
        descriptor: d.descriptor,
        notes: d.notes ?? '',
      })) ?? [],
    ethnicityDescriptor: student.ethnicityDescriptor ?? '',
    isTransferred: student.isTransferred ?? false,
    belowPovertyLine: student.belowPovertyLine ?? false,
    scholarshipCategory: student.scholarshipCategory ?? '',
  }
}

/**
 * Project the form values back to the PATCH payload. Empty strings become
 * `undefined` (so the backend doesn't receive `""` for optional URIs). Empty
 * disability rows (no descriptor chosen) are dropped.
 */
function formToPatch(form: FormShape): StudentDescriptorPatchInput {
  const patch: StudentDescriptorPatchInput = {}

  if (form.sexDescriptor) patch.sexDescriptor = form.sexDescriptor
  if (form.languageDescriptor) patch.languageDescriptor = form.languageDescriptor
  if (form.motherTongueDescriptor) patch.motherTongueDescriptor = form.motherTongueDescriptor
  if (form.ethnicityDescriptor) patch.ethnicityDescriptor = form.ethnicityDescriptor

  const cleanDisabilities = form.disabilities
    .filter((d) => d.descriptor.trim() !== '')
    .map((d) => (d.notes.trim() ? { descriptor: d.descriptor, notes: d.notes } : { descriptor: d.descriptor }))
  patch.disabilities = cleanDisabilities

  patch.isTransferred = form.isTransferred
  patch.belowPovertyLine = form.belowPovertyLine
  if (form.belowPovertyLine && form.scholarshipCategory) {
    patch.scholarshipCategory = form.scholarshipCategory
  }

  return patch
}

// ============================================================================
// COMPONENT
// ============================================================================

const inputClass =
  'w-full px-3 py-2 rounded-lg border text-sm bg-surface-secondary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent-primary/20 transition-colors border-border-secondary'

const labelClass = 'block text-sm font-medium text-text-primary mb-1.5'

export function EditDemographicsModal({
  student,
  onClose,
  locale = 'en',
}: EditDemographicsModalProps) {
  const mutation = useUpdateStudentDescriptors()

  const sexOptions = useMemo(() => listDescriptorUris('SexDescriptor'), [])
  const languageOptions = useMemo(() => listDescriptorUris('LanguageDescriptor'), [])
  const disabilityOptions = useMemo(() => listDescriptorUris('DisabilityDescriptor'), [])

  const { register, handleSubmit, control, watch, formState } = useForm<FormShape>({
    defaultValues: studentToFormDefaults(student),
  })

  const disabilitiesArray = useFieldArray({ control, name: 'disabilities' })
  const belowPovertyLine = watch('belowPovertyLine')
  const isSubmitting = mutation.isPending

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync({
      studentId: student.studentId,
      data: formToPatch(values),
    })
    onClose()
  })

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Demographics"
      description={`Ed-Fi descriptor fields for ${student.fullName ?? 'this student'}. Changes are audited.`}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Identity descriptors */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
            Identity
          </h4>

          <div>
            <label htmlFor="sexDescriptor" className={labelClass}>Sex</label>
            <select
              id="sexDescriptor"
              {...register('sexDescriptor')}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="">— Not specified —</option>
              {sexOptions.map((uri) => (
                <option key={uri} value={uri}>
                  {getDisplayName(uri, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="languageDescriptor" className={labelClass}>Primary language</label>
            <select
              id="languageDescriptor"
              {...register('languageDescriptor')}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="">— Not specified —</option>
              {languageOptions.map((uri) => (
                <option key={uri} value={uri}>
                  {getDisplayName(uri, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="motherTongueDescriptor" className={labelClass}>Mother tongue</label>
            <select
              id="motherTongueDescriptor"
              {...register('motherTongueDescriptor')}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="">— Not specified —</option>
              {languageOptions.map((uri) => (
                <option key={uri} value={uri}>
                  {getDisplayName(uri, locale)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ethnicityDescriptor" className={labelClass}>
              Ethnicity descriptor URI
            </label>
            <input
              id="ethnicityDescriptor"
              type="text"
              {...register('ethnicityDescriptor')}
              placeholder="uri://ed-fi.org/EthnicityDescriptor#..."
              className={inputClass}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-text-tertiary">
              Free-text URI for V1 (the ethnicity catalog ships in Sprint 6).
              Format: <code>uri://...</code>
            </p>
          </div>
        </section>

        {/* Disabilities */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              Disabilities
            </h4>
            <button
              type="button"
              onClick={() => disabilitiesArray.append({ descriptor: '', notes: '' })}
              data-testid="add-disability"
              className="inline-flex items-center gap-1 text-xs text-accent-primary hover:underline"
              disabled={isSubmitting}
            >
              <Plus className="w-3 h-3" aria-hidden /> Add disability
            </button>
          </div>

          {disabilitiesArray.fields.length === 0 && (
            <p className="text-xs italic text-text-tertiary py-1">No disabilities recorded.</p>
          )}

          {disabilitiesArray.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-[1fr,auto] gap-3 items-start border border-border-secondary rounded-lg p-3"
              data-testid={`disability-row-${index}`}
            >
              <div className="space-y-2">
                <Controller
                  control={control}
                  name={`disabilities.${index}.descriptor`}
                  render={({ field: f }) => (
                    <select {...f} className={inputClass} disabled={isSubmitting}>
                      <option value="">— Select disability —</option>
                      {disabilityOptions.map((uri) => (
                        <option key={uri} value={uri}>
                          {getDisplayName(uri, locale)}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <textarea
                  {...register(`disabilities.${index}.notes`)}
                  placeholder="Notes (optional — kept private; stripped before audit emit)"
                  rows={2}
                  className={inputClass}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="button"
                onClick={() => disabilitiesArray.remove(index)}
                aria-label="Remove disability"
                className="p-2 rounded-md text-text-tertiary hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)] transition-colors self-start"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" aria-hidden />
              </button>
            </div>
          ))}
        </section>

        {/* Flags */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Flags</h4>

          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" {...register('isTransferred')} disabled={isSubmitting} />
            Transferred from another school
          </label>

          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" {...register('belowPovertyLine')} disabled={isSubmitting} />
            Below poverty line
          </label>

          {belowPovertyLine && (
            <div>
              <label htmlFor="scholarshipCategory" className={labelClass}>
                Scholarship category
              </label>
              <input
                id="scholarshipCategory"
                type="text"
                {...register('scholarshipCategory')}
                placeholder="e.g. Dalit, Janajati, …"
                className={inputClass}
                disabled={isSubmitting}
              />
            </div>
          )}
        </section>

        <ModalFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !formState.isDirty}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
