/**
 * GradingPolicyList Component
 *
 * Displays school grading policies with default indicator and CRUD actions.
 */

import { useState } from 'react'
import {
  Settings,
  Plus,
  Star,
  Edit3,
  Scale,
} from 'lucide-react'
import { useResourcePermissions } from '@edforge/abac'
import type { LetterGradeEntryDto } from '@aibrains/shared-types'
import { useGradingPolicies } from '../../hooks/useGrades'
import { useCurrentAcademicYear } from '../../hooks/useSchool'
import { useActiveSchoolId } from '../../stores/app.store'
import type { GradingPolicyResponse } from '../../services/academics.service'
import { NoCurrentAcademicYearEmptyState } from '../common'
import { GradingPolicyForm } from './GradingPolicyForm'

// ============================================================================
// POLICY CARD
// ============================================================================

function PolicyCard({
  policy,
  onEdit,
}: {
  policy: GradingPolicyResponse
  onEdit?: (policy: GradingPolicyResponse) => void
}) {
  const totalWeight = policy.categoryWeights.reduce((sum, c) => sum + c.weight, 0)

  return (
    <div className="bg-surface-secondary rounded-xl border border-border-secondary p-5 hover:border-[rgb(var(--border-focus)/0.35)] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-text-primary">{policy.policyName}</h4>
          {policy.isDefault && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-[rgb(var(--state-warning-fg))]/10 dark:text-amber-400 rounded-full">
              <Star className="w-3 h-3" />
              Default
            </span>
          )}
        </div>
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(policy)}
            className="p-1.5 rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Edit policy"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grade Scale Preview */}
      {/*
        Sprint 1 / Ticket 1.6: shared-types renamed `gradingScale` →
        `letterGrades` in D.1.1 (2026-05-22). PolicyCard read the old name
        and crashed every Grading Policies tab render. Explicit
        `LetterGradeEntryDto` typing here will surface future renames at
        compile time.
      */}
      <div className="mb-3">
        <p className="text-xs text-text-tertiary mb-1.5">Grade Scale</p>
        <div className="flex flex-wrap gap-1">
          {policy.letterGrades.map((entry: LetterGradeEntryDto, idx: number) => (
            <span
              key={`${entry.letter}-${idx}`}
              className="px-2 py-0.5 text-xs font-medium bg-surface-hover rounded text-text-secondary"
            >
              {entry.letter}: {entry.minPercentage}-{entry.maxPercentage}%
            </span>
          ))}
        </div>
      </div>

      {/* Category Weights */}
      <div>
        <p className="text-xs text-text-tertiary mb-1.5">
          Category Weights ({totalWeight}%)
        </p>
        <div className="space-y-1.5">
          {policy.categoryWeights.map((cat) => (
            <div key={cat.categoryId} className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-[rgb(var(--state-info-bg)/0.18)]0 rounded-full"
                  style={{ width: `${cat.weight}%` }}
                />
              </div>
              <span className="text-xs text-text-secondary w-24 text-right">
                {cat.categoryName} ({cat.weight}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-border-secondary flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          Rounding: {policy.roundingRule}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// GRADING POLICY LIST
// ============================================================================

export function GradingPolicyList() {
  const schoolId = useActiveSchoolId() || ''
  const gradePerms = useResourcePermissions('grades')
  // Grading Policies are scoped to a school but the page-level UX requires
  // a current academic year (the policies are applied per-AY at grade-record
  // time). When no current AY exists the tab cannot meaningfully operate;
  // render the same empty state Gradebook / Attendance use so the operator
  // sees a consistent recovery prompt.
  const { data: currentYear, isLoading: yearLoading } = useCurrentAcademicYear(schoolId)
  const { data: policies, isLoading: policiesLoading } = useGradingPolicies(schoolId)
  const [editingPolicy, setEditingPolicy] = useState<GradingPolicyResponse | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  if (yearLoading || policiesLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 bg-surface-secondary rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!currentYear?.yearId) {
    return <NoCurrentAcademicYearEmptyState />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-text-tertiary" />
          <h3 className="text-sm font-semibold text-text-primary">Grading Policies</h3>
          <span className="text-xs text-text-tertiary">({policies?.length ?? 0})</span>
        </div>
        {gradePerms.create && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] bg-[rgb(var(--state-info-bg)/0.18)] hover:bg-[rgb(var(--state-info-bg)/0.26)] dark:bg-[rgb(var(--state-info-bg)/0.18)] dark:hover:bg-[rgb(var(--state-info-bg)/0.18)]0/20  rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Policy
          </button>
        )}
      </div>

      {(!policies || policies.length === 0) ? (
        <div className="py-12 text-center">
          <Scale className="w-10 h-10 mx-auto text-text-tertiary mb-3" />
          <h4 className="text-sm font-medium text-text-primary mb-1">
            No grading policies configured
          </h4>
          <p className="text-xs text-text-tertiary max-w-sm mx-auto mb-4">
            Create a grading policy to define grade scales, category weights, and rounding rules.
          </p>
          {gradePerms.create && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[rgb(var(--action-primary-fg))] bg-[rgb(var(--action-primary-bg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Policy
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.policyId}
              policy={policy}
              onEdit={gradePerms.edit ? setEditingPolicy : undefined}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Form */}
      {(showCreate || editingPolicy) && (
        <GradingPolicyForm
          policy={editingPolicy ?? undefined}
          onClose={() => {
            setShowCreate(false)
            setEditingPolicy(null)
          }}
        />
      )}
    </div>
  )
}
