/**
 * Classroom Colors
 *
 * Deterministic color palette for classroom cards.
 * Maps courseId to a consistent color via simple hash.
 */

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

export function getColorForCourse(courseId: string): ClassroomColor {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash += courseId.charCodeAt(i)
  }
  return CLASSROOM_COLORS[hash % CLASSROOM_COLORS.length]
}
