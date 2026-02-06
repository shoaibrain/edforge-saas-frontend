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
