/**
 * Section Edit Page
 *
 * Full-page form for editing an existing class section.
 * Replaces the SectionDrawer's edit mode with a dedicated route.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { z } from 'zod'
import type { UpdateSectionDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useSection, useUpdateSection } from '../../hooks/useSections'
import {
  sectionFormSchema,
  type SectionFormData,
} from '../../schemas/section.form'
import { SectionForm } from '../../components/scheduling/SectionForm'
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog'

export function SectionEditPage() {
  const params = useParams({ strict: false }) as { sectionId?: string }
  const sectionId = params.sectionId || ''
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''
  const updateMutation = useUpdateSection()
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const isValidId = useMemo(() => {
    try {
      z.string().uuid().parse(sectionId)
      return true
    } catch {
      return false
    }
  }, [sectionId])

  const { data: section, isLoading } = useSection({
    sectionId,
    schoolId,
    enabled: isValidId && !!schoolId,
  })

  const defaultValues = useMemo(() => {
    if (!section) return undefined
    return {
      courseId: section.courseId,
      sectionNumber: section.sectionNumber,
      sectionName: section.sectionName || '',
      primaryTeacherId: section.primaryTeacherId,
      coTeacherIds: section.coTeacherIds || [],
      maxEnrollment: section.maxEnrollment,
      academicYearId: section.academicYearId,
      termId: section.termId || '',
      locationId: section.locationId || '',
      classPeriodId: section.classPeriodId || '',
      courseOfferingId: section.courseOfferingId || '',
    }
  }, [section])

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues,
    mode: 'onBlur',
  })

  // Reset form when section data loads
  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues)
    }
  }, [defaultValues, form])

  const isDirty = form.formState.isDirty

  const onSubmit = useCallback(
    async (data: SectionFormData) => {
      if (!section) return
      const payload: UpdateSectionDto = {
        termId: data.termId || undefined,
        sectionNumber: data.sectionNumber,
        sectionName: data.sectionName || undefined,
        primaryTeacherId: data.primaryTeacherId,
        coTeacherIds: data.coTeacherIds?.length ? data.coTeacherIds : undefined,
        locationId: data.locationId || undefined,
        classPeriodId: data.classPeriodId || undefined,
        courseOfferingId: data.courseOfferingId || undefined,
        maxEnrollment: data.maxEnrollment,
      }
      await updateMutation.mutateAsync({
        sectionId: section.sectionId,
        schoolId: schoolId || section.schoolId,
        data: payload,
      })
      navigate({ to: `/classrooms/${sectionId}` })
    },
    [section, schoolId, sectionId, updateMutation, navigate]
  )

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      navigate({ to: `/classrooms/${sectionId}` })
    }
  }

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      e.target instanceof HTMLElement &&
      e.target.tagName !== 'TEXTAREA' &&
      e.target.getAttribute('type') !== 'submit'
    ) {
      e.preventDefault()
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-full p-6">
        <div className="animate-pulse space-y-6 max-w-3xl">
          <div className="h-8 w-48 rounded bg-surface-secondary" />
          <div className="h-4 w-64 rounded bg-surface-secondary" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-surface-secondary" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-text-primary mb-2">Section Not Found</h2>
          <p className="text-sm text-text-secondary mb-4">
            This section may have been removed or you don't have access.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Classrooms
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-border-secondary bg-surface-secondary/50">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
              aria-label="Back to section"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Edit Section
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {section.sectionName || `Section ${section.sectionNumber}`}
                {' · '}
                {section.courseName}
                {section.courseCode && ` (${section.courseCode})`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-6 max-w-3xl">
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            onKeyDown={handleFormKeyDown}
            className="space-y-6"
          >
            <SectionForm isEdit={true} />

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
              <button
                type="button"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      {/* Discard confirmation */}
      <ConfirmationDialog
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        onConfirm={() => navigate({ to: `/classrooms/${sectionId}` })}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </div>
  )
}
