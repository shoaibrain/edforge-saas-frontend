/**
 * GradingScaleEditor Component
 * 
 * Editable table for configuring grading scales.
 * Supports letter grades, percentages, points, and custom scales.
 */

import { Plus, Trash2, GripVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface GradeLevelConfig {
  letter: string
  minScore: number
  maxScore: number
  gpa?: number
}

interface GradingScaleEditorProps {
  scaleType: 'letter' | 'percentage' | 'points' | 'custom'
  scale: GradeLevelConfig[]
  passingGrade: number
  onChange: (scale: GradeLevelConfig[], passingGrade: number) => void
  onScaleTypeChange?: (type: 'letter' | 'percentage' | 'points' | 'custom') => void
  disabled?: boolean
}

const DEFAULT_LETTER_SCALE: GradeLevelConfig[] = [
  { letter: 'A', minScore: 90, maxScore: 100, gpa: 4.0 },
  { letter: 'B', minScore: 80, maxScore: 89, gpa: 3.0 },
  { letter: 'C', minScore: 70, maxScore: 79, gpa: 2.0 },
  { letter: 'D', minScore: 60, maxScore: 69, gpa: 1.0 },
  { letter: 'F', minScore: 0, maxScore: 59, gpa: 0.0 },
]

const SCALE_TYPE_OPTIONS = [
  { value: 'letter', label: 'Letter Grades (A-F)' },
  { value: 'percentage', label: 'Percentage (0-100%)' },
  { value: 'points', label: 'Points-based' },
  { value: 'custom', label: 'Custom Scale' },
]

export function GradingScaleEditor({
  scaleType,
  scale,
  passingGrade,
  onChange,
  onScaleTypeChange,
  disabled,
}: GradingScaleEditorProps) {

  const handleGradeChange = (index: number, field: keyof GradeLevelConfig, value: string | number) => {
    const newScale = [...scale]
    newScale[index] = {
      ...newScale[index],
      [field]: field === 'letter' ? value : Number(value),
    }
    onChange(newScale, passingGrade)
  }

  const handleAddGrade = () => {
    const lastGrade = scale[scale.length - 1]
    const newGrade: GradeLevelConfig = {
      letter: '',
      minScore: 0,
      maxScore: lastGrade ? lastGrade.minScore - 1 : 0,
      gpa: 0,
    }
    onChange([...scale, newGrade], passingGrade)
  }

  const handleRemoveGrade = (index: number) => {
    const newScale = scale.filter((_, i) => i !== index)
    onChange(newScale, passingGrade)
  }

  const handleResetToDefault = () => {
    onChange(DEFAULT_LETTER_SCALE, 60)
  }

  return (
    <div className="space-y-4">
      {/* Scale Type Selector */}
      {onScaleTypeChange && (
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
            Grading Scale Type
          </label>
          <select
            value={scaleType}
            onChange={(e) => onScaleTypeChange(e.target.value as typeof scaleType)}
            disabled={disabled}
            className="w-full px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:border-[rgb(var(--border-focus))] transition-all disabled:opacity-50"
          >
            {SCALE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Grade Scale Table */}
      <div className="rounded-xl border border-[rgb(var(--border-primary))] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[rgb(var(--surface-secondary))]">
            <tr>
              <th className="w-8" />
              <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                Grade
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                Min Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                Max Score
              </th>
              {scaleType === 'letter' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
                  GPA
                </th>
              )}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border-tertiary))]">
            <AnimatePresence>
              {scale.map((grade, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="group"
                >
                  <td className="px-2">
                    <GripVertical className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-50 cursor-grab" />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={grade.letter}
                      onChange={(e) => handleGradeChange(index, 'letter', e.target.value)}
                      disabled={disabled}
                      maxLength={3}
                      className="w-16 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] font-medium text-center focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={grade.minScore}
                      onChange={(e) => handleGradeChange(index, 'minScore', e.target.value)}
                      disabled={disabled}
                      min={0}
                      max={100}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={grade.maxScore}
                      onChange={(e) => handleGradeChange(index, 'maxScore', e.target.value)}
                      disabled={disabled}
                      min={0}
                      max={100}
                      className="w-20 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] disabled:opacity-50"
                    />
                  </td>
                  {scaleType === 'letter' && (
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={grade.gpa || 0}
                        onChange={(e) => handleGradeChange(index, 'gpa', e.target.value)}
                        disabled={disabled}
                        min={0}
                        max={5}
                        step={0.1}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] disabled:opacity-50"
                      />
                    </td>
                  )}
                  <td className="px-2">
                    {scale.length > 1 && !disabled && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGrade(index)}
                        className="p-1.5 rounded-lg text-[rgb(var(--text-tertiary))] hover:text-rust-500 hover:bg-rust-500/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!disabled && (
            <button
              type="button"
              onClick={handleAddGrade}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[rgb(var(--action-secondary-fg))]  hover:bg-[rgb(var(--action-primary-bg))]/10 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Grade Level
            </button>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] transition-colors"
            >
              Reset to default
            </button>
          )}
        </div>

        {/* Passing Grade */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-[rgb(var(--text-secondary))]">
            Passing grade:
          </label>
          <input
            type="number"
            value={passingGrade}
            onChange={(e) => onChange(scale, Number(e.target.value))}
            disabled={disabled}
            min={0}
            max={100}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  )
}
