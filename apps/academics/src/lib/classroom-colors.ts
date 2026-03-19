/**
 * Classroom Colors
 *
 * Subject-area-based color palette for classroom cards.
 * Colors are coordinated with the subject-area banner images
 * for visual harmony.
 */

import type { CourseSubjectArea } from '@aibrains/shared-types'

export const CLASSROOM_COLORS = [
  { gradient: 'from-blue-500 to-blue-600', accent: 'bg-blue-500', text: 'text-white', bg: 'bg-blue-500/10' },
  { gradient: 'from-emerald-500 to-emerald-600', accent: 'bg-emerald-500', text: 'text-white', bg: 'bg-emerald-500/10' },
  { gradient: 'from-purple-500 to-purple-600', accent: 'bg-purple-500', text: 'text-white', bg: 'bg-purple-500/10' },
  { gradient: 'from-amber-500 to-amber-600', accent: 'bg-amber-500', text: 'text-white', bg: 'bg-amber-500/10' },
  { gradient: 'from-rose-500 to-rose-600', accent: 'bg-rose-500', text: 'text-white', bg: 'bg-rose-500/10' },
  { gradient: 'from-cyan-500 to-cyan-600', accent: 'bg-cyan-500', text: 'text-white', bg: 'bg-cyan-500/10' },
  { gradient: 'from-indigo-500 to-indigo-600', accent: 'bg-indigo-500', text: 'text-white', bg: 'bg-indigo-500/10' },
  { gradient: 'from-teal-500 to-teal-600', accent: 'bg-teal-500', text: 'text-white', bg: 'bg-teal-500/10' },
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
