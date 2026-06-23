/**
 * HomeroomAssignDrawer
 *
 * Assign enrolled students to a homeroom. The backend enforces the
 * one-homeroom rule (a move is drop-then-assign) and exposes no bulk
 * endpoint, so selected students are assigned one POST at a time with an
 * aggregate progress bar (FE-S4).
 */

import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, UserCheck, UserMinus, X } from 'lucide-react'
import { Drawer, DrawerFooter, Button, Input, Checkbox } from '@edforge/ui'
import { useEnrollments, flattenEnrollmentPages, enrollmentKeys } from '../../hooks/useEnrollments'
import { useAssignToHomeroom, useRemoveFromHomeroom, homeroomKeys } from '../../hooks/useHomeroom'
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
  const queryClient = useQueryClient()
  // Key off the homeroom's OWN school/year, not the ambient active-school
  // context — a stale/switched active school would otherwise send the wrong
  // section key and 404 ("Section not found"). The props are a fallback only.
  const effSchoolId = homeroom.schoolId || schoolId
  const effYearId = homeroom.academicYearId || academicYearId
  // The homeroom's grade is authoritative (gradeLevel); fall back to the
  // sectionNumber prefix ("12-A" → "12") only for legacy homerooms created
  // before gradeLevel shipped.
  const homeroomGrade = (homeroom.gradeLevel || (homeroom.sectionNumber || '').split('-')[0]).trim()

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useEnrollments({
    schoolId: effSchoolId,
    yearId: effYearId,
    // Enrollment rows are stored as status:'enrolled' (not 'active'); the list
    // endpoint has no isActive flag, so an unfiltered query would also return
    // withdrawn/transferred students — filter to enrolled.
    filters: { status: 'enrolled' },
    enabled: open && !!effSchoolId && !!effYearId,
  })
  const allEnrolled = useMemo(() => flattenEnrollmentPages(data), [data])
  // Students already in THIS homeroom (enrollment.sectionId is the homeroom
  // pointer) — shown as the current roster, each removable.
  const members = useMemo(
    () => allEnrolled.filter((e) => e.sectionId === homeroom.sectionId),
    [allEnrolled, homeroom.sectionId],
  )
  // Candidates to ADD: UNASSIGNED (no homeroom pointer) and in this homeroom's
  // grade. Excluding already-assigned students is what stops the re-assign 409s
  // — a student in another homeroom must be removed there first (a move).
  const available = useMemo(
    () =>
      allEnrolled.filter(
        (e) => !e.sectionId && (homeroomGrade ? (e.gradeLevel || '') === homeroomGrade : true),
      ),
    [allEnrolled, homeroomGrade],
  )
  const enrollments = available
  const assign = useAssignToHomeroom()
  const removeStudent = useRemoveFromHomeroom()
  const [removingId, setRemovingId] = useState<string | null>(null)

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
    let sectionGone = false
    for (let i = 0; i < ids.length; i++) {
      try {
        await assign.mutateAsync({ sectionId: homeroom.sectionId, schoolId: effSchoolId, studentId: ids[i] })
      } catch (error) {
        failures++
        const parsed = parseApiError(error) // mutation onError already toasts the first failure
        // The homeroom itself is gone (stale list row) — every student will fail
        // the same way; stop and self-heal by refetching the list.
        if (/not found/i.test(parsed.message)) {
          sectionGone = true
          break
        }
      }
      setProgress({ done: i + 1, total: ids.length })
    }
    setProgress(null)
    // Refresh candidate + member lists so assigned students drop out of
    // "available" and appear under the current roster without reopening.
    queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
    if (sectionGone) {
      queryClient.invalidateQueries({ queryKey: homeroomKeys.all })
      toast.error('This homeroom is no longer available — the list has been refreshed.')
      onClose()
      return
    }
    const ok = ids.length - failures
    if (failures === 0) {
      toast.success(`Assigned ${ok} student${ok === 1 ? '' : 's'} to ${homeroomLabel}`)
      setSelected(new Set())
    } else {
      toast.warning(`Assigned ${ok} of ${ids.length} — ${failures} failed`)
      setSelected(new Set())
    }
  }

  const handleRemove = async (studentId: string) => {
    setRemovingId(studentId)
    try {
      await removeStudent.mutateAsync({
        sectionId: homeroom.sectionId,
        schoolId: effSchoolId,
        studentId,
      })
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.lists() })
    } finally {
      setRemovingId(null)
    }
  }

  const homeroomLabel = homeroom.sectionName || `Homeroom ${homeroom.sectionNumber}`
  const allSelected = filtered.length > 0 && selected.size === filtered.length

  return (
    <Drawer
      open={open}
      onClose={isAssigning ? () => {} : onClose}
      title={`Assign students — ${homeroomLabel}`}
      description={
        homeroomGrade
          ? `Only unassigned Grade ${homeroomGrade} students are shown below. To move a student already in another homeroom, remove them there first.`
          : 'Only unassigned students are shown below. To move a student already in another homeroom, remove them there first.'
      }
      size="lg"
      showCloseButton={!isAssigning}
    >
      <div className="space-y-3">
        {/* Current roster — remove frees a student (and is how you move one). */}
        {members.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Current members ({members.length}
              {homeroom.maxEnrollment ? ` / ${homeroom.maxEnrollment}` : ''})
            </h4>
            <div className="rounded-xl border border-border-secondary overflow-hidden divide-y divide-border-secondary max-h-[28vh] overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.studentId}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-surface-secondary transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text-primary truncate">
                      {m.studentName || m.studentId}
                    </p>
                    <p className="text-2xs text-text-tertiary">Grade {m.gradeLevel}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(m.studentId)}
                    disabled={removingId !== null || isAssigning}
                    aria-label={`Remove ${m.studentName || m.studentId} from this homeroom`}
                  >
                    {removingId === m.studentId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="w-3.5 h-3.5" />
                    )}
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide pt-1">
          Add students
        </h4>
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
                ? homeroomGrade
                  ? `No unassigned Grade ${homeroomGrade} students — everyone in this grade already has a homeroom.`
                  : 'No unassigned students for this year.'
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
