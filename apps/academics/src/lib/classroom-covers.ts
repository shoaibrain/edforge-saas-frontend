/**
 * Classroom Cover Images
 *
 * Subject-area-based banner assignment for classroom cards and detail pages.
 * Each of the 11 subject areas maps to a distinct themed SVG banner.
 * Banners are auto-assigned based on the course's subjectArea field.
 */

import type { CourseSubjectArea } from '@aibrains/shared-types'

// Static imports for all 11 subject area banners
import mathematicsImg from '../assets/classroom-covers/mathematics.svg'
import englishLanguageArtsImg from '../assets/classroom-covers/english_language_arts.svg'
import scienceImg from '../assets/classroom-covers/science.svg'
import socialStudiesImg from '../assets/classroom-covers/social_studies.svg'
import worldLanguagesImg from '../assets/classroom-covers/world_languages.svg'
import artsImg from '../assets/classroom-covers/arts.svg'
import physicalEducationImg from '../assets/classroom-covers/physical_education.svg'
import technologyImg from '../assets/classroom-covers/technology.svg'
import businessImg from '../assets/classroom-covers/business.svg'
import vocationalImg from '../assets/classroom-covers/vocational.svg'
import otherImg from '../assets/classroom-covers/other.svg'

export interface ClassroomCover {
  /** Stable identifier matching the subject area key */
  id: string
  /** Resolved image URL (bundled by RSBuild) */
  src: string
  /** Alt text for accessibility */
  alt: string
}

const SUBJECT_AREA_COVERS: Record<CourseSubjectArea, ClassroomCover> = {
  mathematics: {
    id: 'mathematics',
    src: mathematicsImg,
    alt: 'Mathematics banner with geometric shapes and equations',
  },
  english_language_arts: {
    id: 'english_language_arts',
    src: englishLanguageArtsImg,
    alt: 'Language arts banner with books and quill pen',
  },
  science: {
    id: 'science',
    src: scienceImg,
    alt: 'Science banner with atoms, DNA helix, and beakers',
  },
  social_studies: {
    id: 'social_studies',
    src: socialStudiesImg,
    alt: 'Social studies banner with globe and compass',
  },
  world_languages: {
    id: 'world_languages',
    src: worldLanguagesImg,
    alt: 'World languages banner with multilingual greetings',
  },
  arts: {
    id: 'arts',
    src: artsImg,
    alt: 'Arts banner with palette, musical notes, and theater masks',
  },
  physical_education: {
    id: 'physical_education',
    src: physicalEducationImg,
    alt: 'Physical education banner with sports equipment',
  },
  technology: {
    id: 'technology',
    src: technologyImg,
    alt: 'Technology banner with circuit board and code brackets',
  },
  business: {
    id: 'business',
    src: businessImg,
    alt: 'Business banner with charts and briefcase',
  },
  vocational: {
    id: 'vocational',
    src: vocationalImg,
    alt: 'Vocational banner with tools and gears',
  },
  other: {
    id: 'other',
    src: otherImg,
    alt: 'General classroom banner',
  },
}

/** Default cover when subjectArea is unavailable */
export const DEFAULT_COVER = SUBJECT_AREA_COVERS.other

/**
 * Get the banner image for a subject area.
 * Falls back to 'other' if subjectArea is undefined or unrecognized.
 */
export function getCoverForSubjectArea(subjectArea?: string): ClassroomCover {
  if (subjectArea && subjectArea in SUBJECT_AREA_COVERS) {
    return SUBJECT_AREA_COVERS[subjectArea as CourseSubjectArea]
  }
  return DEFAULT_COVER
}
