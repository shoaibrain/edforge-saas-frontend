/**
 * Academics Utilities
 *
 * Shared formatters and helpers for academics data display.
 */

// ============================================================================
// ATTENDANCE COLOR CODING
// ============================================================================

/**
 * Get the semantic color hex for an attendance rate.
 *
 * - < 60%: danger (red)
 * - 60–80%: warning (amber)
 * - >= 80%: good (teal/green)
 */
export function getAttendanceColor(rate: number): string {
  if (rate < 60) return '#E24B4A'
  if (rate < 80) return '#EF9F27'
  return '#1D9E75'
}

/**
 * Get the severity classification for an attendance rate.
 */
export function getAttendanceSeverity(
  rate: number
): 'critical' | 'warning' | 'good' {
  if (rate < 60) return 'critical'
  if (rate < 80) return 'warning'
  return 'good'
}

// ============================================================================
// GRADE LEVEL UTILITIES
// ============================================================================

const GRADE_ORDER: Record<string, number> = {
  'pre-k': -2, prek: -2, pk: -2,
  k: -1, kindergarten: -1, kg: -1,
  '1': 1, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  '11': 11, '12': 12,
}

/**
 * Sort grade levels in natural order: PK, K, 1, 2, ... 12.
 */
export function gradeSort(a: string, b: string): number {
  const aOrder = GRADE_ORDER[a.toLowerCase()] ?? 99
  const bOrder = GRADE_ORDER[b.toLowerCase()] ?? 99
  if (aOrder !== bOrder) return aOrder - bOrder
  return a.localeCompare(b)
}

/**
 * Format a grade level key for display.
 *
 * Examples:
 *   formatGradeLabel('pk')  → "Pre-K"
 *   formatGradeLabel('k')   → "Kinder."
 *   formatGradeLabel('1')   → "Grade 1"
 *   formatGradeLabel('12')  → "Grade 12"
 */
export function formatGradeLabel(grade: string): string {
  const lower = grade.toLowerCase()
  if (lower === 'pre-k' || lower === 'prek' || lower === 'pk') return 'Pre-K'
  if (lower === 'k' || lower === 'kindergarten' || lower === 'kg')
    return 'Kinder.'
  const num = parseInt(grade, 10)
  if (!isNaN(num)) return `Grade ${num}`
  return grade
}
