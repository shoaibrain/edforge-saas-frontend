/**
 * Classroom Colors
 *
 * Subject-area-based color palette for classroom cards.
 * Colors are coordinated with the subject-area banner images
 * for visual harmony.
 */

import type { CourseSubjectArea } from '@aibrains/shared-types'

export const CLASSROOM_COLORS = [
  { gradient: 'from-[rgb(var(--state-info-fg))] to-[rgb(var(--action-primary-bg-hover))]', accent: 'bg-[rgb(var(--state-info-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10' },
  { gradient: 'from-[rgb(var(--state-success-fg))] to-[rgb(var(--state-success-fg))]', accent: 'bg-[rgb(var(--state-success-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-success-bg)/0.18)]0/10' },
  { gradient: 'from-[rgb(var(--state-info-fg))] to-[rgb(var(--state-info-fg))]', accent: 'bg-[rgb(var(--state-info-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10' },
  { gradient: 'from-amber-500 to-amber-600', accent: 'bg-amber-500', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-amber-500/10' },
  { gradient: 'from-[rgb(var(--state-danger-fg))] to-[rgb(var(--state-danger-fg))]', accent: 'bg-[rgb(var(--state-danger-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-danger-bg)/0.18)]0/10' },
  { gradient: 'from-[rgb(var(--state-info-fg))] to-[rgb(var(--state-info-fg))]', accent: 'bg-[rgb(var(--state-info-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10' },
  { gradient: 'from-[rgb(var(--state-info-fg))] to-[rgb(var(--state-info-fg))]', accent: 'bg-[rgb(var(--state-info-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10' },
  { gradient: 'from-[rgb(var(--action-primary-bg))] to-[rgb(var(--action-primary-bg-hover))]', accent: 'bg-[rgb(var(--state-info-bg)/0.18)]0', text: 'text-[rgb(var(--action-primary-fg))]', bg: 'bg-[rgb(var(--state-info-bg)/0.18)]0/10' },
] as const

export type ClassroomColor = (typeof CLASSROOM_COLORS)[number]

/**
 * Subject-area to color mapping.
 * Each subject area gets a color that complements its banner image.
 */
const SUBJECT_AREA_COLORS: Record<CourseSubjectArea, ClassroomColor> = {
  mathematics: CLASSROOM_COLORS[0],       // blue — matches blue-toned math banner
  english_language_arts: CLASSROOM_COLORS[3], // amber — matches warm amber ELA banner
  science: CLASSROOM_COLORS[1],           // emerald — matches green-teal science banner
  social_studies: CLASSROOM_COLORS[7],    // teal — complements earth-toned social studies banner
  world_languages: CLASSROOM_COLORS[2],   // purple — matches purple languages banner
  arts: CLASSROOM_COLORS[4],              // rose — matches rose arts banner
  physical_education: CLASSROOM_COLORS[3], // amber — complements orange PE banner
  technology: CLASSROOM_COLORS[5],        // cyan — matches cyan tech banner
  business: CLASSROOM_COLORS[6],          // indigo — matches indigo business banner
  vocational: CLASSROOM_COLORS[3],        // amber — complements orange vocational banner
  other: CLASSROOM_COLORS[7],             // teal — neutral for generic banner
}

/**
 * Get the color for a subject area.
 * Falls back to teal (neutral) if subjectArea is undefined or unrecognized.
 */
export function getColorForSubjectArea(subjectArea?: string): ClassroomColor {
  if (subjectArea && subjectArea in SUBJECT_AREA_COLORS) {
    return SUBJECT_AREA_COLORS[subjectArea as CourseSubjectArea]
  }
  return CLASSROOM_COLORS[7] // teal fallback
}

/**
 * @deprecated Use getColorForSubjectArea() instead.
 */
export function getColorForCourse(courseId: string): ClassroomColor {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash += courseId.charCodeAt(i)
  }
  return CLASSROOM_COLORS[hash % CLASSROOM_COLORS.length]
}
