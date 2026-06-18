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
  useUpdateStudentDescriptors,
  useDeleteStudent,
  useGrantPortalAccess,
  useCreateStudentAccount,
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
  useSchoolProfile,
  useSchoolGradeRange,
  useAcademicYears,
  useCurrentAcademicYear,
  useGradingPeriods,
  useSetCurrentAcademicYear,
  useUpdateAcademicYearStatus,
  schoolKeys,
} from './useSchool'
export { useSchoolEnabledGradeOptions } from './useGradeOptions'
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
export {
  useSectionAttendanceRecords,
  useRecordSectionAttendance,
  useRecordBulkSectionAttendance,
  useUpdateSectionAttendance,
  useStudentSectionAttendance,
  sectionAttendanceKeys,
} from './useSectionAttendance'
export {
  useAttendancePolicy,
  useHomerooms,
  useDesignateHomeroom,
  useAssignToHomeroom,
  useRecordDailyAttendance,
  homeroomKeys,
} from './useHomeroom'
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
  useMarkNoShow,
  useCloseAcademicYear,
  enrollmentKeys,
} from './useEnrollments'
export { useStudentProfileActions } from './useStudentProfileActions'
