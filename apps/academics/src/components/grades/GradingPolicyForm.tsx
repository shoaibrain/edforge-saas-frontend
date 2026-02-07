/**
 * GradingPolicyForm Component
 *
 * Create/edit grading policy with scale, category weights, and rounding.
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
  GradingScaleEntry,
  CategoryWeight,
} from '../../services/academics.service'

// ============================================================================
// TYPES
// ============================================================================

interface GradingPolicyFormProps {
  policy?: GradingPolicyResponse
  onClose: () => void
}

const defaultScale: GradingScaleEntry[] = [
  { letter: 'A', minPercentage: 90, maxPercentage: 100, gpaValue: 4.0 },
  { letter: 'B', minPercentage: 80, maxPercentage: 89, gpaValue: 3.0 },
  { letter: 'C', minPercentage: 70, maxPercentage: 79, gpaValue: 2.0 },
  { letter: 'D', minPercentage: 60, maxPercentage: 69, gpaValue: 1.0 },
  { letter: 'F', minPercentage: 0, maxPercentage: 59, gpaValue: 0.0 },
]

const defaultCategories: CategoryWeight[] = [
  { categoryId: 'tests', name: 'Tests', weight: 30 },
  { categoryId: 'quizzes', name: 'Quizzes', weight: 20 },
  { categoryId: 'homework', name: 'Homework', weight: 20 },
  { categoryId: 'participation', name: 'Participation', weight: 10 },
  { categoryId: 'projects', name: 'Projects', weight: 20 },
]

// ============================================================================
// COMPONENT
// ============================================================================

export function GradingPolicyForm({ policy, onClose }: GradingPolicyFormProps) {
  const schoolId = useActiveSchoolId() || ''
  const isEdit = !!policy
  const createMutation = useCreateGradingPolicy()
  const updateMutation = useUpdateGradingPolicy()

  const [name, setName] = useState(policy?.name ?? '')
  const [roundingRule, setRoundingRule] = useState<'standard' | 'up' | 'down'>(
    policy?.roundingRule ?? 'standard'
  )
  const [isDefault, setIsDefault] = useState(policy?.isDefault ?? false)
  const [scale, setScale] = useState<GradingScaleEntry[]>(
    policy?.gradingScale ?? defaultScale
  )
  const [categories, setCategories] = useState<CategoryWeight[]>(
    policy?.categoryWeights ?? defaultCategories
  )

  const totalWeight = useMemo(
    () => categories.reduce((sum, c) => sum + c.weight, 0),
    [categories]
  )
  const isWeightValid = totalWeight === 100

  const handleScaleChange = (index: number, field: keyof GradingScaleEntry, value: string | number) => {
    setScale((prev) =>
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
      { categoryId: `custom_${Date.now()}`, name: '', weight: 0 },
    ])
  }

  const removeCategory = (index: number) => {
    setCategories((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!name.trim() || !isWeightValid) return

    const payload = {
      schoolId,
      name: name.trim(),
      gradingScale: scale,
      categoryWeights: categories,
      roundingRule,
      isDefault,
    }

    if (isEdit && policy) {
      await updateMutation.mutateAsync({
        policyId: policy.policyId,
        schoolId,
        data: {
          name: payload.name,
          gradingScale: payload.gradingScale,
          categoryWeights: payload.categoryWeights,
          roundingRule: payload.roundingRule,
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Standard A-F Scale"
              className="w-full px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          {/* Options Row */}
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Rounding Rule
              </label>
              <select
                value={roundingRule}
                onChange={(e) => setRoundingRule(e.target.value as 'standard' | 'up' | 'down')}
                className="px-3 py-2 bg-surface-secondary border border-border-secondary rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              >
                <option value="standard">Standard</option>
                <option value="up">Round Up</option>
                <option value="down">Round Down</option>
              </select>
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
            <h4 className="text-sm font-semibold text-text-primary mb-3">Grade Scale</h4>
            <div className="space-y-2">
              {scale.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={entry.letter}
                    onChange={(e) => handleScaleChange(i, 'letter', e.target.value)}
                    className="w-16 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-center text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="A"
                  />
                  <input
                    type="number"
                    value={entry.minPercentage}
                    onChange={(e) => handleScaleChange(i, 'minPercentage', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    min={0}
                    max={100}
                  />
                  <span className="text-text-tertiary text-sm">to</span>
                  <input
                    type="number"
                    value={entry.maxPercentage}
                    onChange={(e) => handleScaleChange(i, 'maxPercentage', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    min={0}
                    max={100}
                  />
                  <span className="text-text-tertiary text-sm">%</span>
                  <input
                    type="number"
                    value={entry.gpaValue ?? 0}
                    onChange={(e) => handleScaleChange(i, 'gpaValue', Number(e.target.value))}
                    className="w-20 px-2 py-1.5 bg-surface-secondary border border-border-secondary rounded text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    step={0.1}
                    min={0}
                    max={5}
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
                  title={`${cat.name}: ${cat.weight}%`}
                />
              ))}
            </div>

            <div className="space-y-2">
              {categories.map((cat, i) => (
                <div key={cat.categoryId} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={cat.name}
                    onChange={(e) => handleCategoryChange(i, 'name', e.target.value)}
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
            disabled={isSaving || !name.trim() || !isWeightValid}
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
