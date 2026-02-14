/**
 * Hooks barrel export
 */

export { useDebounce } from './useDebounce'
export {
  useStudents,
  useStudent,
  useStudentProfile,
  useCreateStudent,
  useCreateEnrollment,
  useUpdateStudent,
  useDeleteStudent,
  flattenStudentPages,
  getTotalFromPages,
  studentKeys,
} from './useStudents'
export {
  useCourses,
  useCourse,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  flattenCoursePages,
  getCourseTotalFromPages,
  courseKeys,
} from './useCourses'
export { useWizardForm } from './useWizardForm'
export {
  useSections,
  useSection,
  useSectionRoster,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useEnrollStudent,
  useRemoveStudent,
  useBulkSectionRosters,
  flattenSectionPages,
  getSectionTotalFromPages,
  sectionKeys,
} from './useSections'
export {
  useSchoolStaff,
  useStaffSearch,
  flattenStaffData,
  getStaffDisplayName,
  staffKeys,
} from './useStaff'
export {
  useAcademicYears,
  useCurrentAcademicYear,
  useGradingPeriods,
  schoolKeys,
} from './useSchool'
export {
  useAttendanceSummary,
  useStudentAttendance,
  useStudentAttendanceSummary,
  useRecordAttendance,
  useRecordBulkAttendance,
  useUpdateAttendance,
  useCalendarDate,
  useAttendanceTrend,
  useAttendanceAlerts,
  attendanceKeys,
} from './useAttendance'
export { useOfflineAttendance } from './useOfflineAttendance'
export type { SaveStatus } from './useOfflineAttendance'
export {
  useGradingPolicies,
  useGradingPolicy,
  useCreateGradingPolicy,
  useUpdateGradingPolicy,
  useSectionGrades,
  useStudentGrades,
  useRecordGrade,
  useRecordBulkGrades,
  useFinalizeGrade,
  gradeKeys,
} from './useGrades'
export {
  useEnrollments,
  flattenEnrollmentPages,
  useEnrollmentSummary,
  useWithdrawStudent,
  useTransferStudent,
  enrollmentKeys,
} from './useEnrollments'
