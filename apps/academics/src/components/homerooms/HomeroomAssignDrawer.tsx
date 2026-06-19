/**
 * HomeroomAssignDrawer
 *
 * Assign enrolled students to a homeroom. The backend enforces the
 * one-homeroom rule (a move is drop-then-assign) and exposes no bulk
 * endpoint, so selected students are assigned one POST at a time with an
 * aggregate progress bar (FE-S4).
 */

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search, UserCheck, X } from 'lucide-react'
import { Drawer, DrawerFooter, Button, Input, Checkbox } from '@edforge/ui'
import { useEnrollments, flattenEnrollmentPages } from '../../hooks/useEnrollments'
import { useAssignToHomeroom } from '../../hooks/useHomeroom'
import { parseApiError, type SectionResponseDto } from '../../services/academics.service'
import { toast } from 'sonner'

export interface HomeroomAssignDrawerProps {
  open: boolean
  onClose: () => void
  schoolId: string
  academicYearId: string
  homeroom: SectionResponseDto
}

export function HomeroomAssignDrawer({
  open,
  onClose,
  schoolId,
  academicYearId,
  homeroom,
}: HomeroomAssignDrawerProps) {
  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useEnrollments({
    schoolId,
    yearId: academicYearId,
    // Enrollment rows are stored as status:'enrolled' (not 'active'); the list
    // endpoint has no isActive flag, so an unfiltered query would also return
    // withdrawn/transferred students — filter to enrolled.
    filters: { status: 'enrolled' },
    enabled: open && !!schoolId && !!academicYearId,
  })
  const enrollments = useMemo(() => flattenEnrollmentPages(data), [data])
  const assign = useAssignToHomeroom()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    if (open) {
      setSelected(new Set())
      setSearch('')
      setProgress(null)
    }
  }, [open])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return enrollments
    return enrollments.filter(
      (e) =>
        (e.studentName || '').toLowerCase().includes(q) ||
        e.studentId.toLowerCase().includes(q) ||
        (e.gradeLevel || '').toLowerCase().includes(q),
    )
  }, [enrollments, search])

  const toggle = (studentId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set()
      return new Set(filtered.map((e) => e.studentId))
    })
  }

  const isAssigning = progress !== null && progress.done < progress.total

  const handleAssign = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    setProgress({ done: 0, total: ids.length })
    let failures = 0
    for (let i = 0; i < ids.length; i++) {
      try {
        await assign.mutateAsync({ sectionId: homeroom.sectionId, schoolId, studentId: ids[i] })
      } catch (error) {
        failures++
        parseApiError(error) // mutation onError already toasts the first failure
      }
      setProgress({ done: i + 1, total: ids.length })
    }
    setProgress(null)
    const ok = ids.length - failures
    if (failures === 0) {
      toast.success(`Assigned ${ok} student${ok === 1 ? '' : 's'} to ${homeroomLabel}`)
      onClose()
    } else {
      toast.warning(`Assigned ${ok} of ${ids.length} — ${failures} failed`)
      setSelected(new Set())
    }
  }

  const homeroomLabel = homeroom.sectionName || `Homeroom ${homeroom.sectionNumber}`
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <Drawer
      open={open}
      onClose={isAssigning ? () => {} : onClose}
      title={`Assign students — ${homeroomLabel}`}
      description="Select enrolled students to assign to this homeroom. Moving a student from another homeroom is handled automatically."
      size="lg"
      showCloseButton={!isAssigning}
    >
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, or grade..."
              aria-label="Search students"
              prefix={<Search className="w-4 h-4" />}
              suffix={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>
          <button
            type="button"
            onClick={toggleAll}
            disabled={isAssigning || filtered.length === 0}
            className="text-xs font-medium text-[rgb(var(--accent-academics-text))] hover:opacity-80 transition-opacity disabled:opacity-40 whitespace-nowrap"
          >
            {allSelected ? 'Clear all' : 'Select all'}
          </button>
        </div>

        <div className="text-xs text-text-tertiary">
          {selected.size} selected · {filtered.length} student{filtered.length === 1 ? '' : 's'}
        </div>

        <div className="rounded-xl border border-border-secondary overflow-hidden divide-y divide-border-secondary max-h-[55vh] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-12 bg-surface-secondary animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-tertiary">
              {enrollments.length === 0
                ? 'No active enrollments for this academic year.'
                : 'No students match your search.'}
            </div>
          ) : (
            filtered.map((e) => (
              <label
                key={e.studentId}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-surface-secondary transition-colors"
              >
                <Checkbox
                  checked={selected.has(e.studentId)}
                  onChange={() => toggle(e.studentId)}
                  disabled={isAssigning}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text-primary truncate">
                    {e.studentName || e.studentId}
                  </p>
                  <p className="text-2xs text-text-tertiary">Grade {e.gradeLevel}</p>
                </div>
              </label>
            ))
          )}
        </div>

        {hasNextPage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || isAssigning}
            className="w-full"
          >
            {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more students'}
          </Button>
        )}

        {progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Assigning…
              </span>
              <span>
                {progress.done} / {progress.total}
              </span>
            </div>
            <div className="w-full h-2 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-[rgb(var(--accent-academics))] rounded-full transition-all duration-200"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <DrawerFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isAssigning}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleAssign}
          disabled={isAssigning || selected.size === 0}
          className="min-w-36"
        >
          {isAssigning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Assigning…
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Assign {selected.size > 0 ? selected.size : ''}
            </>
          )}
        </Button>
      </DrawerFooter>
    </Drawer>
  )
}
