/**
 * Section Create Page
 *
 * Full-page form for creating a new class section.
 * Replaces the SectionDrawer's create mode with a dedicated route.
 */

import { useState, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { CreateSectionDto } from '@aibrains/shared-types'
import { useActiveSchoolId } from '../../stores/app.store'
import { useCreateSection } from '../../hooks/useSections'
import {
  sectionFormSchema,
  defaultSectionFormData,
  type SectionFormData,
} from '../../schemas/section.form'
import { SectionForm } from '../../components/scheduling/SectionForm'
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog'

export function SectionCreatePage() {
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId() || ''
  const createMutation = useCreateSection()
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)

  const form = useForm<SectionFormData>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: defaultSectionFormData,
    mode: 'onBlur',
  })

  const isDirty = form.formState.isDirty

  const onSubmit = useCallback(
    async (data: SectionFormData) => {
      const payload: CreateSectionDto = {
        courseId: data.courseId,
        schoolId,
        academicYearId: data.academicYearId,
        termId: data.termId || undefined,
        sectionNumber: data.sectionNumber,
        sectionName: data.sectionName || undefined,
        primaryTeacherId: data.primaryTeacherId,
        coTeacherIds: data.coTeacherIds?.length ? data.coTeacherIds : undefined,
        roomId: undefined,
        locationId: data.locationId || undefined,
        classPeriodId: data.classPeriodId || undefined,
        courseOfferingId: data.courseOfferingId || undefined,
        maxEnrollment: data.maxEnrollment,
      }
      const result = await createMutation.mutateAsync(payload)
      // Navigate to the newly created section detail page
      const newSectionId = (result as any)?.sectionId
      if (newSectionId) {
        navigate({ to: `/classrooms/${newSectionId}` })
      } else {
        navigate({ to: '/classrooms', search: { tab: undefined } })
      }
    },
    [schoolId, createMutation, navigate]
  )

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      navigate({ to: '/classrooms', search: { tab: undefined } })
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
              aria-label="Back to classrooms"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary">
                Create Class Section
              </h1>
              <p className="text-sm text-text-secondary mt-0.5">
                Set up a new class section with course, teacher, and schedule details.
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
            <SectionForm isEdit={false} />

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-secondary">
              <button
                type="button"
                onClick={handleCancel}
                disabled={createMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-primary border border-border-primary rounded-lg hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Section'
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
        onConfirm={() => navigate({ to: '/classrooms', search: { tab: undefined } })}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to leave? Your changes will be lost."
        confirmText="Discard"
        cancelText="Keep Editing"
        variant="destructive"
      />
    </div>
  )
}
