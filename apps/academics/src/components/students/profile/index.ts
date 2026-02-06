/**
 * Student Profile Components
 *
 * Sprint 2 - Tabbed profile interface.
 *
 * Components:
 * - ProfileHeader: Student avatar, name, status, quick actions
 * - OverviewTab: Demographics, contact, academic info, medical
 * - EnrollmentTab: Enrollment history
 * - FamilyTab: Guardians & emergency contacts
 * - ScheduleTab: Class schedule & attendance summary
 */

export {
  ProfileHeader,
  ProfileHeaderSkeleton,
  type ProfileHeaderProps,
} from './ProfileHeader'

export {
  OverviewTab,
  OverviewTabSkeleton,
  type OverviewTabProps,
} from './OverviewTab'

export {
  EnrollmentTab,
  EnrollmentTabSkeleton,
  type EnrollmentTabProps,
} from './EnrollmentTab'

export {
  FamilyTab,
  FamilyTabSkeleton,
  type FamilyTabProps,
} from './FamilyTab'

export {
  ScheduleTab,
  ScheduleTabSkeleton,
  type ScheduleTabProps,
} from './ScheduleTab'
