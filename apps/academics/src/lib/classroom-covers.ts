/**
 * Classroom Cover Images
 *
 * Deterministic cover image assignment for classroom detail pages.
 * Maps courseId to a consistent cover image via simple hash (same pattern as classroom-colors.ts).
 *
 * To add more covers:
 * 1. Add the image to src/assets/classroom-covers/
 * 2. Import it below and add an entry to CLASSROOM_COVERS
 * 3. The hash function distributes courses evenly across all covers
 *
 * Future: sections could store a `coverImageId` field in DynamoDB for explicit assignment.
 */

import sciencedept1 from '../assets/classroom-covers/sciencedept1.png'

export interface ClassroomCover {
  /** Stable identifier for this cover (for future DB storage) */
  id: string
  /** Resolved image URL (bundled by RSBuild) */
  src: string
  /** Alt text for accessibility */
  alt: string
}

export const CLASSROOM_COVERS: ClassroomCover[] = [
  {
    id: 'sciencedept1',
    src: sciencedept1,
    alt: 'Science-themed banner with atoms, rockets, and beakers',
  },
  // Add more covers here as they become available:
  // import mathdept1 from '../assets/classroom-covers/mathdept1.png'
  // { id: 'mathdept1', src: mathdept1, alt: 'Math-themed banner' },
]

/**
 * Get a deterministic cover image for a course.
 * Uses the same hash technique as getColorForCourse().
 */
export function getCoverForCourse(courseId: string): ClassroomCover {
  let hash = 0
  for (let i = 0; i < courseId.length; i++) {
    hash += courseId.charCodeAt(i)
  }
  return CLASSROOM_COVERS[hash % CLASSROOM_COVERS.length]
}

/** Default cover when no courseId is available */
export const DEFAULT_COVER = CLASSROOM_COVERS[0]
