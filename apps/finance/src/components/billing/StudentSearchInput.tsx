/**
 * StudentSearchInput
 *
 * Typeahead combobox for searching and selecting a student.
 * Debounces input and queries the academics endpoint.
 * On selection, returns both studentId and studentName.
 */

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, X } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { useSearchStudents } from '@edforge/finance-services'
import type { StudentSearchResult } from '@edforge/finance-services'
import { UuidBadge } from '@edforge/archetype'

interface StudentSearchInputProps {
  schoolId: string
  value: { studentId: string; studentName: string } | null
  onChange: (value: { studentId: string; studentName: string } | null) => void
  placeholder?: string
}

export function StudentSearchInput({
  schoolId,
  value,
  onChange,
  placeholder,
}: StudentSearchInputProps) {
  const { t } = useTranslation('payments')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const { data: students = [], isLoading } = useSearchStudents(schoolId, debouncedSearch)

  const handleSelect = (student: StudentSearchResult) => {
    onChange({
      studentId: student.studentId,
      studentName: student.fullName || `${student.firstName} ${student.lastName}`.trim(),
    })
    setSearch('')
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null)
    setSearch('')
  }

  // Selected state — show the chosen student
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))]">
        <div className="flex-1 min-w-0">
          <span className="text-[rgb(var(--text-primary))] font-medium">{value.studentName}</span>
          <span className="text-[rgb(var(--text-tertiary))] ms-2 text-xs">
            <UuidBadge value={value.studentId} />
          </span>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="p-0.5 rounded hover:bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-tertiary))]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // Search state — show the search input + dropdown
  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => search.length >= 2 && setIsOpen(true)}
          placeholder={placeholder ?? t('studentSearch.placeholder')}
          className="w-full ps-9 pe-3 py-2 text-sm border border-[rgb(var(--border-primary))] rounded-lg bg-[rgb(var(--background-primary))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.35)]"
        />
      </div>

      {isOpen && debouncedSearch.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-lg shadow-popover max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] animate-spin" />
              <span className="ms-2 text-xs text-[rgb(var(--text-tertiary))]">{t('studentSearch.searching')}</span>
            </div>
          ) : students.length === 0 ? (
            <div className="py-4 text-center text-xs text-[rgb(var(--text-tertiary))]">
              {t('studentSearch.noStudents')}
            </div>
          ) : (
            <div className="divide-y divide-[rgb(var(--border-primary))]">
              {students.map((student) => (
                <button
                  key={student.studentId}
                  type="button"
                  onClick={() => handleSelect(student)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-start hover:bg-[rgb(var(--background-secondary))] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {student.fullName || `${student.firstName} ${student.lastName}`}
                    </div>
                    <div className="text-xs text-[rgb(var(--text-tertiary))]">
                      {student.studentNumber && `#${student.studentNumber}`}
                      {student.currentGradeLevel && ` · ${t('studentSearch.grade', { grade: student.currentGradeLevel })}`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
