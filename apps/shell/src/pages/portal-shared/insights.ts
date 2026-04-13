/**
 * insights.ts — Derived insight helpers for portal pages.
 *
 * These functions take raw data hooks output and produce humanized,
 * contextual strings for greetings, stat subtitles, empty states, and
 * billing callouts. The goal is to make the portal feel personal and
 * intelligent rather than dumping numbers.
 *
 * All helpers gracefully degrade when data is missing or partial.
 */

// ============================================================================
// TIME OF DAY
// ============================================================================

export function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 5) return 'Late evening'
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  if (hour < 21) return 'Good evening'
  return 'Late evening'
}

export function isWeekend(): boolean {
  const dow = new Date().getDay()
  return dow === 0 || dow === 6
}

// ============================================================================
// GPA INSIGHTS
// ============================================================================

export interface GpaInsight {
  /** Display value: numeric GPA, "pending", or "—" */
  display: string
  /** Subtitle line below the value */
  subtitle: string
  /** Whether this is a "pending" / awaiting state */
  isPending: boolean
}

export function deriveGpaInsight(
  gpa?: number | null,
  gradedItemCount: number = 0,
  courseCount: number = 0
): GpaInsight {
  // No courses enrolled at all
  if (courseCount === 0) {
    return {
      display: '—',
      subtitle: 'No courses enrolled',
      isPending: false,
    }
  }

  // Courses enrolled but nothing graded yet
  if (gpa == null || gradedItemCount === 0) {
    return {
      display: 'pending',
      subtitle: 'Grades post at mid-term',
      isPending: true,
    }
  }

  // Has GPA — show with contextual subtitle
  const gpaStr = gpa.toFixed(2)
  let subtitle: string
  if (gpa >= 3.7) subtitle = 'Strong term so far'
  else if (gpa >= 3.0) subtitle = 'Solid progress'
  else if (gpa >= 2.0) subtitle = 'Room to grow'
  else subtitle = 'Worth a closer look'

  return { display: gpaStr, subtitle, isPending: false }
}

// ============================================================================
// ATTENDANCE INSIGHTS
// ============================================================================

export interface AttendanceInsight {
  display: string
  subtitle: string
}

export function deriveAttendanceInsight(
  rate?: number | null,
  absentDays: number = 0,
  totalDays: number = 0
): AttendanceInsight {
  if (rate == null || totalDays === 0) {
    return {
      display: '—',
      subtitle: 'No records yet',
    }
  }

  const display = `${Math.round(rate)}%`
  let subtitle: string
  if (rate >= 95) {
    subtitle = absentDays === 0 ? 'Perfect attendance' : `${absentDays} absence${absentDays > 1 ? 's' : ''} this term`
  } else if (rate >= 90) {
    subtitle = `${absentDays} absence${absentDays > 1 ? 's' : ''} this term`
  } else if (rate >= 80) {
    subtitle = `${absentDays} absences — keeping an eye`
  } else {
    subtitle = `${absentDays} absences — needs attention`
  }
  return { display, subtitle }
}

// ============================================================================
// ASSIGNMENTS DUE INSIGHT
// ============================================================================

export interface AssignmentsInsight {
  display: string
  subtitle: string
}

/** Find the next assignment due this week and produce a contextual subtitle */
export function deriveAssignmentsInsight(
  classwork?: Array<{ title?: string; dueDate?: string; courseName?: string }>
): AssignmentsInsight {
  if (!classwork || classwork.length === 0) {
    return { display: '0', subtitle: 'No assignments due' }
  }

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  const thisWeek = classwork
    .filter((c) => {
      if (!c.dueDate) return false
      const due = new Date(c.dueDate)
      return due >= startOfWeek && due < endOfWeek
    })
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

  if (thisWeek.length === 0) {
    return { display: '0', subtitle: 'Quiet week ahead' }
  }

  const next = thisWeek[0]
  const nextDate = new Date(next.dueDate!)
  const dayName = nextDate.toLocaleDateString(undefined, { weekday: 'long' })
  const titleSnippet = next.title?.split(' ').slice(0, 3).join(' ') ?? 'Next item'

  return {
    display: String(thisWeek.length),
    subtitle: `${titleSnippet}, ${dayName}`,
  }
}

// ============================================================================
// BALANCE / BILLING INSIGHTS
// ============================================================================

export interface BalanceInsight {
  display: string
  subtitle: string
  state: 'current' | 'due' | 'overdue'
}

export function deriveBalanceInsight(
  invoices: Array<{
    status?: string
    amountDue?: number
    totalAmount?: number
    grandTotal?: number
    amountPaid?: number
    dueDate?: string
  }> = [],
  formatCurrency: (n: number) => string = (n) => `$${n.toFixed(0)}`
): BalanceInsight {
  if (invoices.length === 0) {
    return { display: '$0', subtitle: 'No invoices issued', state: 'current' }
  }

  const now = new Date()
  let due = 0
  let hasOverdue = false
  let nextDueDate: Date | null = null

  for (const inv of invoices) {
    if (inv.status === 'issued' || inv.status === 'partially_paid') {
      const amount = inv.amountDue ?? inv.grandTotal ?? inv.totalAmount ?? 0
      due += amount
      if (inv.dueDate) {
        const d = new Date(inv.dueDate)
        if (d < now) hasOverdue = true
        if (!nextDueDate || d < nextDueDate) nextDueDate = d
      }
    }
  }

  if (due === 0) {
    return { display: formatCurrency(0), subtitle: 'All fees current', state: 'current' }
  }

  if (hasOverdue) {
    return { display: formatCurrency(due), subtitle: 'Past due — please review', state: 'overdue' }
  }

  if (nextDueDate) {
    const dateLabel = nextDueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return { display: formatCurrency(due), subtitle: `Due by ${dateLabel}`, state: 'due' }
  }

  return { display: formatCurrency(due), subtitle: 'Outstanding balance', state: 'due' }
}

// ============================================================================
// COURSES INSIGHT
// ============================================================================

export function deriveCoursesInsight(courseCount: number, gradedCount: number = 0): { display: string; subtitle: string } {
  if (courseCount === 0) {
    return { display: '0', subtitle: 'Not enrolled yet' }
  }
  if (gradedCount === 0) {
    return { display: String(courseCount), subtitle: `${courseCount === 1 ? 'Course' : 'Courses'} this term` }
  }
  return {
    display: String(courseCount),
    subtitle: `${gradedCount} of ${courseCount} graded`,
  }
}

// ============================================================================
// HERO NARRATIVE — context line for HeroGreeting
// ============================================================================

export interface HeroNarrativeArgs {
  childName?: string
  attendanceRate?: number | null
  absentDays?: number
  courseCount?: number
  hasAssignmentsDue?: boolean
  isWeekendDay?: boolean
}

export function deriveHeroNarrative(args: HeroNarrativeArgs): string {
  const { childName, attendanceRate, absentDays = 0, courseCount = 0, hasAssignmentsDue, isWeekendDay } = args

  // Weekend tone
  if (isWeekendDay) {
    if (childName) return `${childName} is off school today — here's the week at a glance.`
    return `School is off today — here's the week at a glance.`
  }

  // No data yet
  if (courseCount === 0) {
    return childName
      ? `${childName} is just getting started this term.`
      : `Just getting started this term.`
  }

  // Strong attendance, no concerns
  if (attendanceRate != null && attendanceRate >= 95 && absentDays === 0) {
    return childName
      ? `${childName} has had a steady, focused term so far.`
      : `A steady, focused term so far.`
  }

  // Decent attendance, occasional absences
  if (attendanceRate != null && attendanceRate >= 90) {
    if (hasAssignmentsDue) {
      return childName
        ? `${childName} is on track. A few items due this week.`
        : `On track. A few items due this week.`
    }
    return childName
      ? `${childName} is having a steady week.`
      : `A steady week.`
  }

  // Some attendance concern
  if (attendanceRate != null && attendanceRate >= 80) {
    return childName
      ? `Keeping an eye on ${childName}'s attendance this term.`
      : `Keeping an eye on attendance this term.`
  }

  // Lower attendance
  if (attendanceRate != null) {
    return childName
      ? `${childName}'s attendance needs some attention.`
      : `Attendance needs some attention.`
  }

  // Generic fallback
  return childName ? `Here's how ${childName} is doing.` : `Here's how things look.`
}

// ============================================================================
// EMPTY STATE MESSAGES (humanized, contextual)
// ============================================================================

export function todayEmptyMessage(childName?: string): { line1: string; line2?: string } {
  const isWeekendDay = isWeekend()
  if (isWeekendDay) {
    return {
      line1: childName ? `It's the weekend — no classes for ${childName} today.` : `It's the weekend — no classes today.`,
      line2: 'Enjoy the break.',
    }
  }
  const hour = new Date().getHours()
  if (hour >= 17) {
    return {
      line1: childName ? `${childName}'s school day is wrapped up.` : `School day is wrapped up.`,
      line2: 'Tomorrow\'s schedule will appear here in the morning.',
    }
  }
  return {
    line1: 'No classes scheduled for today.',
    line2: 'This usually means a school holiday or in-service day.',
  }
}

export function assignmentsEmptyMessage(): { line1: string; line2?: string } {
  return {
    line1: 'A quiet week — nothing due.',
    line2: 'New assignments will appear here as teachers post them.',
  }
}
