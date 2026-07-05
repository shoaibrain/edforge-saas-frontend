/**
 * Ed-Fi Compliance Step
 *
 * Step 4: All Ed-Fi specific fields — categories, descriptors, grade levels,
 * identification codes, institution telephones, classification, and ratings.
 * All fields are optional — the step itself is skippable.
 */

import { useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Check } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import { Select } from '@edforge/ui'
import { AnimatedInput, AnimatedSelect } from './BasicInfoStep'
import {
  SCHOOL_CATEGORY_DESCRIPTORS,
  SCHOOL_TYPE_DESCRIPTORS,
  SCHOOL_GRADE_LEVEL_DESCRIPTORS,
  CHARTER_STATUS_DESCRIPTORS,
  ADMINISTRATIVE_FUNDING_CONTROL_DESCRIPTORS,
  EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS,
  INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS,
} from '@aibrains/shared-types'
import {
  computeGradeLevels,
  getSuggestedCategory,
  getSuggestedDescriptor,
} from '../school-wizard.utils'

// ============================================================================
// DYNAMIC ARRAY HELPERS (lightweight — no FormProvider needed)
// ============================================================================

interface IdCode {
  educationOrganizationIdentificationSystemDescriptor: string
  identificationCode: string
}

interface InstitutionPhone {
  institutionTelephoneNumberTypeDescriptor: string
  telephoneNumber: string
}

interface AccountabilityRating {
  schoolYear: number
  title: string
  rating: string
  ratingOrganization: string
}

// ============================================================================
// STEP COMPONENT
// ============================================================================

export function EdFiComplianceStep({ data, updateData, clearError }: WizardStepProps) {
  const schoolType = (data.schoolType as string) || ''
  const gradeStart = (data['gradeRange.start'] as string) || ''
  const gradeEnd = (data['gradeRange.end'] as string) || ''

  // Computed grade levels from grade range
  const computedGrades = useMemo(
    () => computeGradeLevels(gradeStart, gradeEnd),
    [gradeStart, gradeEnd],
  )

  // Additional (non-contiguous) grade levels — persisted in wizard data
  const additionalGrades = ((data._additionalGrades as string[]) || [])
  const setAdditionalGrades = (grades: string[]) => {
    updateData({ _additionalGrades: grades })
  }

  // Sync grade levels to wizard data
  useEffect(() => {
    const all = [...new Set([...computedGrades, ...additionalGrades])]
    updateData({ gradeLevels: all.length > 0 ? all : undefined })
  }, [computedGrades, additionalGrades]) // eslint-disable-line react-hooks/exhaustive-deps

  // Track previous school type to detect changes
  const prevSchoolTypeRef = useRef(schoolType)

  // Auto-suggest category when schoolType changes or on first visit
  useEffect(() => {
    if (!schoolType) return
    const isFirstVisit = !prevSchoolTypeRef.current
    const typeChanged = schoolType !== prevSchoolTypeRef.current
    prevSchoolTypeRef.current = schoolType

    const categories = (data.schoolCategories as string[]) || []
    if (typeChanged || (isFirstVisit && categories.length === 0)) {
      const suggested = getSuggestedCategory(schoolType)
      if (suggested) updateData({ schoolCategories: [suggested] })
    }
  }, [schoolType]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-suggest Ed-Fi school type descriptor when schoolType changes or on first visit
  const prevDescriptorTypeRef = useRef(schoolType)
  useEffect(() => {
    if (!schoolType) return
    const typeChanged = schoolType !== prevDescriptorTypeRef.current
    prevDescriptorTypeRef.current = schoolType

    if (typeChanged || !data.schoolTypeDescriptor) {
      const suggested = getSuggestedDescriptor(schoolType)
      if (suggested) updateData({ schoolTypeDescriptor: suggested })
    }
  }, [schoolType]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Categories ---
  const selectedCategories = ((data.schoolCategories as string[]) || [])
  const toggleCategory = (cat: string) => {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat]
    updateData({ schoolCategories: next.length > 0 ? next : undefined })
  }

  // --- Identification Codes ---
  const idCodes = ((data.identificationCodes as IdCode[]) || [])
  const addIdCode = () =>
    updateData({
      identificationCodes: [
        ...idCodes,
        { educationOrganizationIdentificationSystemDescriptor: 'SEA', identificationCode: '' },
      ],
    })
  const removeIdCode = (index: number) =>
    updateData({ identificationCodes: idCodes.filter((_, i) => i !== index) })
  const updateIdCode = (index: number, field: keyof IdCode, value: string) => {
    const updated = idCodes.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    updateData({ identificationCodes: updated })
  }

  // --- Institution Phones ---
  const phones = ((data.institutionTelephones as InstitutionPhone[]) || [])
  const addPhone = () =>
    updateData({
      institutionTelephones: [
        ...phones,
        { institutionTelephoneNumberTypeDescriptor: 'Main', telephoneNumber: '' },
      ],
    })
  const removePhone = (index: number) =>
    updateData({ institutionTelephones: phones.filter((_, i) => i !== index) })
  const updatePhone = (index: number, field: keyof InstitutionPhone, value: string) => {
    const updated = phones.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    updateData({ institutionTelephones: updated })
  }

  // --- Accountability Ratings ---
  const ratings = ((data.accountabilityRatings as AccountabilityRating[]) || [])
  const addRating = () =>
    updateData({
      accountabilityRatings: [
        ...ratings,
        { schoolYear: new Date().getFullYear(), title: '', rating: '', ratingOrganization: '' },
      ],
    })
  const removeRating = (index: number) =>
    updateData({ accountabilityRatings: ratings.filter((_, i) => i !== index) })
  const updateRating = (index: number, field: keyof AccountabilityRating, value: string | number) => {
    const updated = ratings.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    updateData({ accountabilityRatings: updated })
  }

  // --- Additional grade toggle ---
  const toggleAdditionalGrade = (grade: string) => {
    const next = additionalGrades.includes(grade)
      ? additionalGrades.filter((g) => g !== grade)
      : [...additionalGrades, grade]
    setAdditionalGrades(next)
  }

  const handleFieldChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    updateData({ [field]: e.target.value })
    clearError(field)
  }

  // Descriptor options for selects
  const schoolTypeDescriptorOptions = [
    { value: '', label: 'Not specified' },
    ...SCHOOL_TYPE_DESCRIPTORS.map((d) => ({ value: d.value, label: d.label })),
  ]
  const charterStatusOptions = [
    { value: '', label: 'Not specified' },
    ...CHARTER_STATUS_DESCRIPTORS.map((d) => ({ value: d.value, label: d.label })),
  ]
  const adminFundingOptions = [
    { value: '', label: 'Not specified' },
    ...ADMINISTRATIVE_FUNDING_CONTROL_DESCRIPTORS.map((d) => ({ value: d.value, label: d.label })),
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

          {/* ── School Categories ── */}
          <div>
            <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-1">
              School Categories
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mb-3">
              Select one or more Ed-Fi school category descriptors
            </p>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_CATEGORY_DESCRIPTORS.map((cat) => {
                const isSelected = selectedCategories.includes(cat.value)
                const isSuggested = getSuggestedCategory(schoolType) === cat.value
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-[rgb(var(--action-primary-bg))]/15 border-[rgb(var(--border-focus)/0.40)] text-[rgb(var(--state-info-fg))] '
                        : 'bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-focus)/0.35)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {cat.label}
                    {isSuggested && !isSelected && (
                      <span className="text-xs text-[rgb(var(--action-secondary-fg))] ms-1">(suggested)</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Ed-Fi School Type Descriptor ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <AnimatedSelect
              label="Ed-Fi School Type"
              value={(data.schoolTypeDescriptor as string) || ''}
              onChange={handleFieldChange('schoolTypeDescriptor')}
              options={schoolTypeDescriptorOptions}
            />
            <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
              Distinct from the internal school type — this is the Ed-Fi classification
            </p>
          </div>

          {/* ── Grade Levels ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-1">
              Ed-Fi Grade Levels
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mb-3">
              Auto-computed from your grade range. Add non-contiguous grade levels below.
            </p>

            {computedGrades.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1.5">From grade range:</p>
                <div className="flex flex-wrap gap-1.5">
                  {computedGrades.map((g) => {
                    const descriptor = SCHOOL_GRADE_LEVEL_DESCRIPTORS.find((d) => d.value === g)
                    return (
                      <span
                        key={g}
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--state-info-fg))]  border border-[rgb(var(--border-focus)/0.35)]"
                      >
                        {descriptor?.label || g}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1.5">Additional grade levels:</p>
              <div className="flex flex-wrap gap-1.5">
                {SCHOOL_GRADE_LEVEL_DESCRIPTORS
                  .filter((d) => !computedGrades.includes(d.value))
                  .map((d) => {
                    const isSelected = additionalGrades.includes(d.value)
                    return (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => toggleAdditionalGrade(d.value)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-[rgb(var(--state-info-bg)/0.18)] border-[rgb(var(--state-info-border)/0.40)] text-[rgb(var(--state-info-fg))] '
                            : 'bg-[rgb(var(--background-tertiary))] border-[rgb(var(--border-primary))] text-[rgb(var(--text-tertiary))] hover:border-[rgb(var(--state-info-border)/0.35)] hover:text-[rgb(var(--text-secondary))]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 me-1" />}
                        {d.label}
                      </button>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* ── Identification Codes ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
                  Identification Codes
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  NCES, SEA, DUNS, or Federal identification numbers
                </p>
              </div>
              <button
                type="button"
                onClick={addIdCode}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:bg-[rgb(var(--action-primary-bg))]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Code
              </button>
            </div>
            {idCodes.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-tertiary))] italic">
                No identification codes added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {idCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
                  >
                    <Select
                      aria-label="Identification system"
                      className="w-48 shrink-0"
                      value={code.educationOrganizationIdentificationSystemDescriptor}
                      onChange={(v) =>
                        updateIdCode(index, 'educationOrganizationIdentificationSystemDescriptor', v ?? '')
                      }
                      options={EDUCATION_ORGANIZATION_IDENTIFICATION_SYSTEM_DESCRIPTORS}
                    />
                    <input
                      type="text"
                      value={code.identificationCode}
                      onChange={(e) => updateIdCode(index, 'identificationCode', e.target.value)}
                      placeholder="e.g., 123456789"
                      className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeIdCode(index)}
                      className="mt-0.5 p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Institution Phone Numbers ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
                  Institution Phone Numbers
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  Ed-Fi typed phone numbers (Main, Administrative, Fax, Attendance)
                </p>
              </div>
              <button
                type="button"
                onClick={addPhone}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:bg-[rgb(var(--action-primary-bg))]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Phone
              </button>
            </div>
            {phones.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-tertiary))] italic">
                No institution phone numbers added yet.
              </p>
            ) : (
              <div className="space-y-3">
                {phones.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]"
                  >
                    <Select
                      aria-label="Phone number type"
                      className="w-40 shrink-0"
                      value={phone.institutionTelephoneNumberTypeDescriptor}
                      onChange={(v) =>
                        updatePhone(index, 'institutionTelephoneNumberTypeDescriptor', v ?? '')
                      }
                      options={INSTITUTION_TELEPHONE_NUMBER_TYPE_DESCRIPTORS}
                    />
                    <input
                      type="tel"
                      value={phone.telephoneNumber}
                      onChange={(e) => updatePhone(index, 'telephoneNumber', e.target.value)}
                      placeholder="(555) 123-4567"
                      className="flex-1 px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removePhone(index)}
                      className="mt-0.5 p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Federal & State Classification ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium mb-3">
              Federal & State Classification
            </p>
            <div className="space-y-4">
              <div>
                <AnimatedSelect
                  label={
                    schoolType === 'charter'
                      ? 'Charter Status (Charter school detected)'
                      : 'Charter Status'
                  }
                  value={(data.charterStatusDescriptor as string) || ''}
                  onChange={handleFieldChange('charterStatusDescriptor')}
                  options={charterStatusOptions}
                />
              </div>
              <AnimatedSelect
                label="Administrative Funding Control"
                value={(data.administrativeFundingControlDescriptor as string) || ''}
                onChange={handleFieldChange('administrativeFundingControlDescriptor')}
                options={adminFundingOptions}
              />
              <AnimatedInput
                label="Title I Part A School Designation"
                placeholder="e.g., Not designated as a Title I Part A school"
                value={(data.titleIPartASchoolDesignationDescriptor as string) || ''}
                onChange={handleFieldChange('titleIPartASchoolDesignationDescriptor')}
                helpText="Ed-Fi descriptor for Title I designation"
              />
            </div>
          </div>

          {/* ── Accountability Ratings ── */}
          <div className="pt-4 border-t border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[rgb(var(--text-tertiary))] uppercase tracking-wider font-medium">
                  Accountability Ratings
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                  State or federal accountability ratings for this school
                </p>
              </div>
              <button
                type="button"
                onClick={addRating}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[rgb(var(--action-secondary-fg))]  hover:bg-[rgb(var(--action-primary-bg))]/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rating
              </button>
            </div>
            {ratings.length === 0 ? (
              <p className="text-sm text-[rgb(var(--text-tertiary))] italic">
                No accountability ratings added yet.
              </p>
            ) : (
              <div className="space-y-4">
                {ratings.map((rating, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))]/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider">
                        Rating #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRating(index)}
                        className="p-1.5 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={rating.title}
                          onChange={(e) => updateRating(index, 'title', e.target.value)}
                          placeholder="e.g., State Accountability"
                          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                          Rating
                        </label>
                        <input
                          type="text"
                          value={rating.rating}
                          onChange={(e) => updateRating(index, 'rating', e.target.value)}
                          placeholder="e.g., A, Met Standard"
                          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                          Rating Organization
                        </label>
                        <input
                          type="text"
                          value={rating.ratingOrganization}
                          onChange={(e) => updateRating(index, 'ratingOrganization', e.target.value)}
                          placeholder="e.g., Texas Education Agency"
                          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[rgb(var(--text-secondary))] mb-1">
                          School Year
                        </label>
                        <input
                          type="number"
                          value={rating.schoolYear}
                          onChange={(e) => updateRating(index, 'schoolYear', parseInt(e.target.value, 10) || 0)}
                          placeholder="2025"
                          min={1900}
                          max={2100}
                          className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)] focus:border-[rgb(var(--border-focus))] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
    </motion.div>
  )
}
