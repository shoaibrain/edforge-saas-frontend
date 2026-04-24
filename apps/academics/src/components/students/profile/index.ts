/**
 * Student Profile Components
 *
 * Sprint 2 - Tabbed profile interface.
 *
 * Components:
 * - ProfileHeader: Student avatar, name, status, quick actions
 * - OverviewTab: Academic dashboard (attendance, classes, grades)
 * - ProfileTab: Personal details with sensitive field masking
 * - EnrollmentTab: Enrollment history
 * - FamilyTab: Guardians & emergency contacts
 * - ScheduleTab: (deprecated) Class schedule & attendance summary
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
  ProfileTab,
  ProfileTabSkeleton,
  type ProfileTabProps,
} from './ProfileTab'

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

export {
  DemographicsTab,
  type DemographicsTabProps,
} from './DemographicsTab'
