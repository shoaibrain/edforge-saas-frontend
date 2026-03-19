/**
 * Deterministic gradient and initials utilities for student avatars.
 *
 * getStudentGradient hashes the student name to one of 10 fixed
 * CSS gradients so the same name always produces the same color.
 */

const GRADIENTS = [
  'linear-gradient(135deg, #1D9E75 0%, #0D7A5F 100%)',
  'linear-gradient(135deg, #378ADD 0%, #2563EB 100%)',
  'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
  'linear-gradient(135deg, #EC4899 0%, #BE185D 100%)',
  'linear-gradient(135deg, #EF9F27 0%, #D97706 100%)',
  'linear-gradient(135deg, #E24B4A 0%, #B91C1C 100%)',
  'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
  'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
] as const

export function getStudentGradient(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function getStudentInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}
