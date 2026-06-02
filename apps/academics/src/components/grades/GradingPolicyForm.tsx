/**
 * GradingPolicyForm Component
 *
 * Create/edit grading policy with scale, category weights, rounding, and passing grade.
 */

import { useState, useMemo } from 'react'
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useCreateGradingPolicy,
  useUpdateGradingPolicy,
} from '../../hooks/useGrades'
import type {
  GradingPolicyResponse,
  CategoryWeight,
} from '../../services/academics.service'
import type { LetterGradeEntryDto, GpaScale } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface GradingPolicyFormProps {
  policy?: GradingPolicyResponse
  onClose: () => void
}

// Sprint 1 / Ticket 1.7 — shape matches `LetterGradeEntryDto` from
// @aibrains/shared-types (D.1.1 rename from `gradingScale`). `isPassing` is
// required by the schema; we initialize per US-default convention
// (>=60% passes) and let the user adjust.
const defaultLetterGrades: LetterGradeEntryDto[] = [
  { letter: 'A', minPercentage: 90, maxPercentage: 100, gpaPoints: 4.0, isPassing: true },
  { letter: 'B', minPercentage: 80, maxPercentage: 89, gpaPoints: 3.0, isPassing: true },
  { letter: 'C', minPercentage: 70, maxPercentage: 79, gpaPoints: 2.0, isPassing: true },
  { letter: 'D', minPercentage: 60, maxPercentage: 69, gpaPoints: 1.0, isPassing: true },
  { letter: 'F', minPercentage: 0, maxPercentage: 59, gpaPoints: 0.0, isPassing: false },
]

const defaultCategories: CategoryWeight[] = [
  { categoryId: 'tests', categoryName: 'Tests', weight: 30 },
  { categoryId: 'quizzes', categoryName: 'Quizzes', weight: 20 },
  { categoryId: 'homework', categoryName: 'Homework', weight: 20 },
  { categoryId: 'participation', categoryName: 'Participation', weight: 10 },
  { categoryId: 'projects', categoryName: 'Projects', weight: 20 },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function GradingPolicyForm({ policy, onClose }: GradingPolicyFormProps) {
  const schoolId = useActiveSchoolId() || ''
  const isEdit = !!policy
  const createMutation = useCreateGradingPolicy()
  const updateMutation = useUpdateGradingPolicy()

  const [policyName, setPolicyName] = useState(policy?.policyName ?? '')
  const [description, setDescription] = useState(policy?.description ?? '')
  const [roundingRule, setRoundingRule] = useState<'up' | 'down' | 'nearest'>(
    policy?.roundingRule ?? 'nearest'
  )
  const [minimumPassingGrade, setMinimumPassingGrade] = useState(
    policy?.minimumPassingGrade ?? 60
  )
  const [isDefault, setIsDefault] = useState(policy?.isDefault ?? false)
  const [gpaScale, setGpaScale] = useState<GpaScale>(policy?.gpaScale ?? '4.0')
  const [letterGrades, setLetterGrades] = useState<LetterGradeEntryDto[]>(
    policy?.letterGrades ?? defaultLetterGrades
  )
  const [categories, setCategories] = useState<CategoryWeight[]>(
    policy?.categoryWeights ?? defaultCategories
  )

  const totalWeight = useMemo(
    () => categories.reduce((sum, c) => sum + c.weight, 0),
    [categories]
  )
  const isWeightValid = totalWeight === 100

  const handleLetterGradeChange = (
    index: number,
    field: keyof LetterGradeEntryDto,
    value: string | number | boolean,
  ) => {
    setLetterGrades((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    )
  }

  const handleCategoryChange = (index: number, field: keyof CategoryWeight, value: string | number) => {
    setCategories((prev) =>
      prev.map((cat, i) =>
        i === index ? { ...cat, [field]: value } : cat
      )
    )
  }

  const addCategory = () => {
    setCategories((prev) => [
      ...prev,
      { categoryId: `custom_${Date.now()}`, categoryName: '', weight: 0 },
    ])
  }

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!policyName.trim() || !isWeightValid) return

    // Sprint 1 / Ticket 1.7 — recompute `isPassing` from the current passing
    // threshold on submit. Keeps the per-row flag in sync with what the
    // operator just edited, so an updated `minimumPassingGrade` doesn't
    // leave stale `isPassing` values on the saved rows.
    //
    // Use the entry's *lower* bound so a letter is passing only when EVERY
    // score in its range clears the threshold. Using `maxPercentage` would
    // wrongly tag straddle ranges (e.g. D = 60-69 with passing=65) as
    // passing — students scoring 60-64 in that range would be tagged
    // "passing" despite scoring below the threshold.
    const normalizedLetterGrades: LetterGradeEntryDto[] = letterGrades.map((entry) => ({
      ...entry,
      isPassing: entry.minPercentage >= minimumPassingGrade,
    }))

    const payload = {
      schoolId,
      policyName: policyName.trim(),
      description: description.trim() || undefined,
      gpaScale,
      letterGrades: normalizedLetterGrades,
      categoryWeights: categories,
      roundingRule,
      minimumPassingGrade,
      isDefault,
    }

    if (isEdit && policy) {
      await updateMutation.mutateAsync({
        policyId: policy.policyId,
        schoolId,
        data: {
          policyName: payload.policyName,
          description: payload.description,
          gpaScale: payload.gpaScale,
          letterGrades: payload.letterGrades,
          categoryWeights: payload.categoryWeights,
          roundingRule: payload.roundingRule,
          minimumPassingGrade: payload.minimumPassingGrade,
          isDefault: payload.isDefault,
        },
      })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-primary rounded-xl border border-border-secondary shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
          <h3 className="text-lg font-semibold text-text-primary">
            {isEdit ? 'Edit Grading Policy' : 'Create Grading Policy'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Policy Name */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Policy Name *
            </label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              placeholder="e.g., Standard A-F Scale"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this policy"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Options Row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Rounding Rule
              </label>
              <select
                value={roundingRule}
                onChange={(e) => setRoundingRule(e.target.value as 'up' | 'down' | 'nearest')}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="nearest">Round to Nearest</option>
                <option value="up">Round Up</option>
                <option value="down">Round Down</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Passing Grade
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={minimumPassingGrade}
                  onChange={(e) => setMinimumPassingGrade(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-20 px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <span className="text-sm text-text-tertiary">%</span>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-border-secondary text-teal-500 focus:ring-teal-500/20"
              />
              <span className="text-sm text-text-primary">Set as default</span>
            </label>
          </div>

          {/* Grade Scale */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">Letter Grades</h4>
              <label className="flex items-center gap-2 text-xs text-text-tertiary">
                GPA scale
                <select
                  value={gpaScale}
                  onChange={(e) => setGpaScale(e.target.value as GpaScale)}
                  className="px-2 py-1 bg-surface-secondary border border-border-secondary rounded text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="4.0">4.0</option>
                  <option value="5.0">5.0</option>
                </select>
              </label>
            </div>
            <div className="space-y-2">
              {letterGrades.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={entry.letter}
                    onChange={(e) => handleLetterGradeChange(i, 'letter', e.target.value)}
                    className="w-16 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="A"
                  />
                  <input
                    type="number"
                    value={entry.minPercentage}
                    onChange={(e) => handleLetterGradeChange(i, 'minPercentage', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    min={0}
                    max={100}
                  />
                  <span className="text-text-tertiary text-sm">to</span>
                  <input
                    type="number"
                    value={entry.maxPercentage}
                    onChange={(e) => handleLetterGradeChange(i, 'maxPercentage', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    min={0}
                    max={100}
                  />
                  <span className="text-text-tertiary text-sm">%</span>
                  <input
                    type="number"
                    value={entry.gpaPoints}
                    onChange={(e) => handleLetterGradeChange(i, 'gpaPoints', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    step={0.1}
                    min={0}
                    max={parseFloat(gpaScale)}
                    placeholder="GPA"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category Weights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-text-primary">
                Category Weights
              </h4>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isWeightValid
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  Total: {totalWeight}%
                </span>
                {!isWeightValid && (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
            </div>

            {/* Weight Bar Visualization */}
            <div className="h-3 bg-surface-secondary rounded-full overflow-hidden flex mb-3">
              {categories.map((cat, i) => (
                <div
                  key={cat.categoryId}
                  className="h-full transition-all"
                  style={{
                    width: `${cat.weight}%`,
                    backgroundColor: `hsl(${(i * 60) % 360}, 60%, 50%)`,
                  }}
                  title={`${cat.categoryName}: ${cat.weight}%`}
                />
              ))}
            </div>

            <div className="space-y-2">
              {categories.map((cat, i) => (
                <div key={cat.categoryId} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={cat.categoryName}
                    onChange={(e) => handleCategoryChange(i, 'categoryName', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Category name"
                  />
                  <input
                    type="number"
                    value={cat.weight}
                    onChange={(e) => handleCategoryChange(i, 'weight', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    min={0}
                    max={100}
                  />
                  <span className="text-text-tertiary text-sm">%</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cat.dropLowest ?? 0}
                      onChange={(e) => handleCategoryChange(i, 'dropLowest', Number(e.target.value))}
                      className="w-14 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      min={0}
                      max={5}
                      title="Drop lowest N scores"
                    />
                    <span className="text-text-tertiary text-[10px] whitespace-nowrap">drop</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCategory(i)}
                    disabled={categories.length <= 1}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addCategory}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-secondary">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-surface-secondary hover:bg-surface-hover rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !policyName.trim() || !isWeightValid}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-teal-500 hover:bg-teal-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Update Policy' : 'Create Policy'}
          </button>
        </div>
      </div>
    </div>
  )
}
