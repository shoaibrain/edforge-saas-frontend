/**
 * Step 1 — Family & members.
 *
 * Title + payer contact + a multi-student picker. Members drive the terms
 * allocation/lines in step 2; the ≤30-students invariant is enforced here
 * (adding beyond the cap is blocked) and re-checked in validation.
 */

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X, Plus } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { useSearchStudents } from '@edforge/finance-services'
import type { StudentSearchResult } from '@edforge/finance-services'
import { UuidBadge } from '@edforge/archetype'
import {
  MAX_AGREEMENT_STUDENTS,
  MAX_TITLE_LENGTH,
  MAX_PAYER_NAME_LENGTH,
  MAX_PAYER_PHONE_LENGTH,
  type WizardMember,
} from './wizard-types'

interface Step1Props {
  schoolId: string
  title: string
  familyId: string
  payerName: string
  payerPhone: string
  payerEmail: string
  members: WizardMember[]
  onChange: (
    patch: Partial<{
      title: string
      familyId: string
      payerName: string
      payerPhone: string
      payerEmail: string
      members: WizardMember[]
    }>,
  ) => void
}

const inputClass =
  'w-full rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] px-3 py-2 text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]'

const labelClass =
  'mb-1 block text-sm font-medium text-[rgb(var(--text-secondary))]'

export function Step1FamilyMembers({
  schoolId,
  title,
  familyId,
  payerName,
  payerPhone,
  payerEmail,
  members,
  onChange,
}: Step1Props) {
  const { t } = useTranslation('payments')

  const addMember = (student: StudentSearchResult) => {
    if (members.some((m) => m.studentId === student.studentId)) return
    if (members.length >= MAX_AGREEMENT_STUDENTS) return
    onChange({
      members: [
        ...members,
        {
          studentId: student.studentId,
          studentName:
            student.fullName ||
            `${student.firstName} ${student.lastName}`.trim(),
        },
      ],
    })
  }

  const removeMember = (studentId: string) => {
    onChange({ members: members.filter((m) => m.studentId !== studentId) })
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Left — title + payer */}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t('agreement.wizard.family.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t('agreement.wizard.family.titlePlaceholder')}
            maxLength={MAX_TITLE_LENGTH}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.family.payerName')}
          </label>
          <input
            type="text"
            value={payerName}
            onChange={(e) => onChange({ payerName: e.target.value })}
            placeholder={t('agreement.wizard.family.payerNamePlaceholder')}
            maxLength={MAX_PAYER_NAME_LENGTH}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>
              {t('agreement.wizard.family.payerPhone')}
            </label>
            <input
              type="tel"
              value={payerPhone}
              onChange={(e) => onChange({ payerPhone: e.target.value })}
              maxLength={MAX_PAYER_PHONE_LENGTH}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t('agreement.wizard.family.payerEmail')}
            </label>
            <input
              type="email"
              value={payerEmail}
              onChange={(e) => onChange({ payerEmail: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>
            {t('agreement.wizard.family.familyId')}
          </label>
          <input
            type="text"
            value={familyId}
            onChange={(e) => onChange({ familyId: e.target.value })}
            placeholder={t('agreement.wizard.family.familyIdPlaceholder')}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[rgb(var(--text-tertiary))]">
            {t('agreement.wizard.family.familyIdHelp')}
          </p>
        </div>
      </div>

      {/* Right — members picker */}
      <div className="space-y-3">
        <label className={labelClass}>
          {t('agreement.wizard.family.members')}
        </label>
        <MemberSearch
          schoolId={schoolId}
          existingIds={members.map((m) => m.studentId)}
          disabled={members.length >= MAX_AGREEMENT_STUDENTS}
          onAdd={addMember}
        />
        {members.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[rgb(var(--border-primary))] px-3 py-6 text-center text-xs text-[rgb(var(--text-tertiary))]">
            {t('agreement.wizard.family.noMembers')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li
                key={m.studentId}
                className="flex items-center justify-between rounded-lg bg-[rgb(var(--background-secondary))] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[rgb(var(--text-primary))]">
                    {m.studentName}
                  </div>
                  <div className="text-2xs text-[rgb(var(--text-tertiary))]">
                    <UuidBadge value={m.studentId} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeMember(m.studentId)}
                  className="rounded p-1 text-[rgb(var(--text-tertiary))] hover:bg-[rgb(var(--background-tertiary))]"
                  aria-label={t('agreement.wizard.family.remove')}
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MemberSearch — typeahead that stays open across multiple adds.
// ---------------------------------------------------------------------------

function MemberSearch({
  schoolId,
  existingIds,
  disabled,
  onAdd,
}: {
  schoolId: string
  existingIds: string[]
  disabled: boolean
  onAdd: (student: StudentSearchResult) => void
}) {
  const { t } = useTranslation('payments')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: students = [], isLoading } = useSearchStudents(
    schoolId,
    debounced,
  )
  const existing = new Set(existingIds)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-tertiary))]" />
        <input
          type="text"
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={() => search.length >= 2 && setOpen(true)}
          placeholder={t('agreement.wizard.family.addStudent')}
          className={`${inputClass} pl-9 disabled:opacity-60`}
        />
      </div>

      {open && debounced.length >= 2 && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] shadow-popover">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-[rgb(var(--action-secondary-fg))]" />
              <span className="ml-2 text-xs text-[rgb(var(--text-tertiary))]">
                {t('studentSearch.searching')}
              </span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-4 text-center text-xs text-[rgb(var(--text-tertiary))]">
              {t('studentSearch.noStudents')}
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-primary))]">
              {students.map((student) => {
                const already = existing.has(student.studentId)
                return (
                  <button
                    key={student.studentId}
                    type="button"
                    disabled={already}
                    onClick={() => onAdd(student)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[rgb(var(--background-secondary))] disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                        {student.fullName ||
                          `${student.firstName} ${student.lastName}`}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-tertiary))]">
                        {student.studentNumber && `#${student.studentNumber}`}
                        {student.currentGradeLevel &&
                          ` · ${t('studentSearch.grade', {
                            grade: student.currentGradeLevel,
                          })}`}
                      </div>
                    </div>
                    {!already && (
                      <Plus className="h-4 w-4 flex-none text-[rgb(var(--text-tertiary))]" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
