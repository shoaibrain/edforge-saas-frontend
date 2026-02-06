# Academics Service - Data Models

Complete TypeScript interfaces for all request/response types in the Academics API.

---

## Student

### CreateStudentDto

```typescript
interface CreateStudentDto {
  // Required fields
  firstName: string;              // 2-50 chars
  lastName: string;               // 2-50 chars
  dateOfBirth: string;            // YYYY-MM-DD format
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  schoolId: string;               // UUID - must exist in Identity service
  currentGradeLevel: string;      // e.g., "9", "10", "K", "PreK"

  // Optional identity fields
  middleName?: string;            // max 50 chars
  preferredName?: string;         // max 50 chars
  suffix?: string;                // max 10 chars
  studentNumber?: string;         // max 20 chars, auto-generated if omitted
  stateStudentId?: string;        // max 30 chars

  // Contact information
  contactInfo?: {
    email?: string;               // Valid email format
    phone?: string;               // 10-20 chars
    phoneType?: 'mobile' | 'home' | 'work';
    address?: Address;
    mailingAddress?: Address;
    useMailingAddress?: boolean;
  };

  // Family
  guardians?: Guardian[];         // 1-10 guardians
  emergencyContacts?: EmergencyContact[];  // max 5

  // Medical & accommodations
  medicalInfo?: MedicalInfo;
  specialPrograms?: string[];     // e.g., ["ESL", "Gifted", "Title I"]
  accommodations?: string[];      // e.g., ["Extended time", "Preferential seating"]

  // Demographics
  ethnicity?: string;             // max 50 chars
  primaryLanguage?: string;       // max 50 chars
  homeLanguage?: string;          // max 50 chars
  countryOfBirth?: string;        // max 100 chars

  // Enrollment
  enrollmentDate?: string;        // YYYY-MM-DD, defaults to today
  previousSchool?: string;        // max 200 chars

  // Notes
  notes?: string;                 // max 2000 chars
}
```

### StudentResponseDto

```typescript
interface StudentResponseDto {
  studentId: string;              // UUID
  schoolId: string;               // UUID
  tenantId: string;

  // Identity
  firstName: string;
  lastName: string;
  middleName?: string;
  preferredName?: string;
  suffix?: string;
  fullName: string;               // Auto-computed: "FirstName LastName"
  dateOfBirth: string;            // YYYY-MM-DD
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';

  // Identifiers
  studentNumber?: string;
  stateStudentId?: string;

  // School status
  currentGradeLevel: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred' | 'withdrawn' | 'suspended';

  // Contact, family, medical (same structure as create)
  contactInfo?: StudentContactInfo;
  guardians?: Guardian[];
  emergencyContacts?: EmergencyContact[];
  medicalInfo?: MedicalInfo;

  // Programs
  specialPrograms?: string[];
  accommodations?: string[];

  // Demographics
  ethnicity?: string;
  primaryLanguage?: string;
  homeLanguage?: string;
  countryOfBirth?: string;

  // Enrollment info
  enrollmentDate?: string;
  previousSchool?: string;

  // Notes
  notes?: string;

  // Metadata
  createdAt: string;              // ISO 8601
  updatedAt: string;              // ISO 8601
  createdBy?: string;
  updatedBy?: string;
}
```

### StudentProfileResponseDto

Extended version with aggregated data:

```typescript
interface StudentProfileResponseDto extends StudentResponseDto {
  // Current enrollment (if any)
  currentEnrollment?: {
    enrollmentId: string;
    academicYearId: string;
    academicYearName?: string;
    gradeLevel: string;
    enrollmentDate: string;
    status: string;
    homeroomId?: string;
    homeroomName?: string;
  };

  // Enrollment history
  enrollmentHistory?: {
    enrollmentId: string;
    academicYearId: string;
    academicYearName?: string;
    gradeLevel: string;
    schoolId: string;
    schoolName?: string;
    enrollmentDate: string;
    withdrawalDate?: string;
    status: string;
  }[];

  // Attendance summary (current year)
  attendanceSummary?: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;       // 0-100 percentage
  };

  // Academic summary (optional)
  academicSummary?: {
    gpa?: number;                 // 0-5.0
    currentCourses?: number;
    completedCredits?: number;
  };
}
```

### Supporting Types

```typescript
interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface Guardian {
  guardianId?: string;            // UUID, auto-generated
  relationship: 'mother' | 'father' | 'guardian' | 'grandparent' | 'sibling' | 'aunt' | 'uncle' | 'other';
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  phoneType?: 'mobile' | 'home' | 'work';
  alternatePhone?: string;
  isPrimary: boolean;             // First guardian is primary by default
  hasPortalAccess: boolean;       // Can log into parent portal
  canPickup: boolean;             // Authorized for student pickup
  address?: Address;
  employer?: string;
  occupation?: string;
}

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
  priority: number;               // 1-5, lower is higher priority
}

interface MedicalInfo {
  allergies?: string[];
  medications?: string[];
  conditions?: string[];
  dietaryRestrictions?: string[];
  bloodType?: string;
  notes?: string;
  physicianName?: string;
  physicianPhone?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  hasIEP?: boolean;               // Individualized Education Program
  has504Plan?: boolean;           // Section 504 accommodations
}
```

---

## Enrollment

### CreateEnrollmentDto

```typescript
interface CreateEnrollmentDto {
  studentId: string;              // UUID
  schoolId: string;               // UUID
  academicYearId: string;         // UUID
  gradeLevel: string;
  enrollmentDate: string;         // YYYY-MM-DD
  homeroomId?: string;            // UUID
  enrollmentType?: 'new' | 'returning' | 'transfer';
  previousSchoolId?: string;      // For transfers
  notes?: string;
}
```

### EnrollmentResponseDto

```typescript
interface EnrollmentResponseDto {
  enrollmentId: string;
  studentId: string;
  schoolId: string;
  schoolName?: string;
  academicYearId: string;
  academicYearName?: string;
  gradeLevel: string;
  enrollmentDate: string;
  withdrawalDate?: string;
  status: 'enrolled' | 'pending' | 'withdrawn' | 'graduated' | 'transferred' | 'suspended' | 'expelled';
  homeroomId?: string;
  homeroomName?: string;
  enrollmentType?: string;
  withdrawalReason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### WithdrawStudentDto

```typescript
interface WithdrawStudentDto {
  withdrawalDate: string;         // YYYY-MM-DD
  reason: 'moved' | 'transferred' | 'homeschool' | 'expulsion' | 'personal' | 'other';
  notes?: string;
  destinationSchool?: string;     // Name of school transferring to
}
```

### TransferStudentDto

```typescript
interface TransferStudentDto {
  transferDate: string;           // YYYY-MM-DD
  destinationSchoolId: string;    // UUID
  reason?: string;
  notes?: string;
}
```

---

## Course

### CreateCourseDto

```typescript
interface CreateCourseDto {
  // Required
  courseCode: string;             // 2-20 chars, alphanumeric + hyphens/underscores
  courseName: string;             // 2-200 chars
  schoolId: string;               // UUID
  subjectArea: CourseSubjectArea;
  courseType: 'required' | 'elective' | 'enrichment' | 'remedial';
  credits: number;                // 0-12
  gradeLevels: string[];          // At least 1, e.g., ["9", "10"]

  // Optional
  creditType?: 'academic' | 'elective' | 'honors' | 'ap' | 'ib';
  departmentId?: string;          // UUID
  departmentName?: string;
  description?: string;           // max 2000 chars
  objectives?: string[];          // max 20 items
  prerequisites?: string[];       // Course UUIDs
  corequisites?: string[];        // Course UUIDs
  typicalDuration?: 'semester' | 'year' | 'quarter' | 'trimester';
  periodsPerWeek?: number;        // 1-20
  academicYearId?: string;
  standards?: CourseStandard[];   // Learning standards
  textbooks?: CourseMaterial[];
}

type CourseSubjectArea =
  | 'mathematics'
  | 'english_language_arts'
  | 'science'
  | 'social_studies'
  | 'world_languages'
  | 'arts'
  | 'physical_education'
  | 'technology'
  | 'business'
  | 'vocational'
  | 'other';

interface CourseStandard {
  standardId: string;
  standardCode: string;
  standardName: string;
  framework: string;              // e.g., "Common Core", "NGSS"
}

interface CourseMaterial {
  materialId?: string;
  type: 'textbook' | 'workbook' | 'digital' | 'other';
  title: string;
  author?: string;
  publisher?: string;
  isbn?: string;
  edition?: string;
  isRequired: boolean;
}
```

### CourseResponseDto

```typescript
interface CourseResponseDto {
  courseId: string;
  schoolId: string;
  tenantId: string;
  courseCode: string;
  courseName: string;
  subjectArea: CourseSubjectArea;
  courseType: string;
  credits: number;
  creditType?: string;
  gradeLevels: string[];
  departmentId?: string;
  departmentName?: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string[];
  corequisites?: string[];
  typicalDuration?: string;
  periodsPerWeek?: number;
  isActive: boolean;
  academicYearId?: string;
  standards?: CourseStandard[];
  textbooks?: CourseMaterial[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

---

## Section

### CreateSectionDto

```typescript
interface CreateSectionDto {
  courseId: string;               // UUID - course must exist
  schoolId: string;               // UUID
  academicYearId: string;         // UUID
  termId?: string;                // UUID
  sectionNumber: string;          // 1-20 chars, unique per course
  sectionName?: string;           // Optional display name
  primaryTeacherId: string;       // UUID - staff must exist
  coTeacherIds?: string[];        // max 5
  roomId?: string;                // UUID
  maxEnrollment: number;          // 1-500
}
```

### SectionResponseDto

```typescript
interface SectionResponseDto {
  sectionId: string;
  tenantId: string;
  courseId: string;
  courseCode?: string;            // Denormalized
  courseName?: string;            // Denormalized
  schoolId: string;
  academicYearId: string;
  termId?: string;
  sectionNumber: string;
  sectionName?: string;
  primaryTeacherId: string;
  primaryTeacherName?: string;    // Denormalized
  coTeacherIds?: string[];
  roomId?: string;
  roomNumber?: string;            // Denormalized
  maxEnrollment: number;
  currentEnrollment: number;      // Auto-tracked count
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}
```

### SectionRosterResponseDto

```typescript
interface SectionRosterResponseDto {
  sectionId: string;
  courseName?: string;
  sectionNumber?: string;
  students: {
    studentId: string;
    studentName?: string;
    sectionId: string;
    enrolledAt: string;
    enrolledBy?: string;
  }[];
  totalCount: number;
}
```

---

## Grading Policy

### CreateGradingPolicyDto

```typescript
interface CreateGradingPolicyDto {
  schoolId: string;               // UUID
  policyName: string;
  description?: string;

  // Grading scale - must not have overlapping ranges
  gradingScale: {
    letter: string;               // e.g., "A", "B+", "B"
    minPercentage: number;        // 0-100
    maxPercentage: number;        // 0-100
    gpaPoints: number;            // e.g., 4.0, 3.7
  }[];

  // Category weights - MUST sum to exactly 100
  categoryWeights: {
    categoryId: string;           // e.g., "homework", "tests"
    categoryName: string;
    weight: number;               // Percentage (0-100)
  }[];

  // Optional: Drop lowest scores per category
  dropLowestScores?: {
    categoryId: string;
    count: number;
  }[];

  roundingRule: 'up' | 'down' | 'nearest';
  minimumPassingGrade: number;    // e.g., 60
  isDefault?: boolean;            // One default per school
}
```

### GradingPolicyResponseDto

```typescript
interface GradingPolicyResponseDto {
  policyId: string;
  schoolId: string;
  tenantId: string;
  policyName: string;
  description?: string;
  gradingScale: GradingScaleEntry[];
  categoryWeights: CategoryWeight[];
  dropLowestScores?: { categoryId: string; count: number }[];
  roundingRule: string;
  minimumPassingGrade: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}
```

---

## Grade

### RecordAssignmentGradeDto

```typescript
interface RecordAssignmentGradeDto {
  studentId: string;              // UUID
  schoolId: string;               // UUID
  courseId: string;               // UUID
  sectionId?: string;             // UUID
  termId: string;                 // UUID or term identifier
  academicYearId: string;         // UUID
  teacherId: string;              // UUID - REQUIRED

  assignment: {
    assignmentId?: string;        // UUID, auto-generated if omitted
    assignmentName: string;
    assignmentType: AssignmentType;
    categoryId?: string;          // Must match policy category
    dueDate?: string;             // ISO date
    earnedPoints?: number;        // Student's score
    possiblePoints: number;       // Maximum possible score
    isExtraCredit?: boolean;      // If true, earnedPoints can exceed possiblePoints
    isMissing?: boolean;          // Student didn't submit
    isExcused?: boolean;          // Excused from assignment
    comment?: string;
  };
}

type AssignmentType =
  | 'homework'
  | 'quiz'
  | 'test'
  | 'project'
  | 'essay'
  | 'lab'
  | 'participation'
  | 'final_exam'
  | 'midterm'
  | 'other';
```

### BulkRecordGradeDto

```typescript
interface BulkRecordGradeDto {
  schoolId: string;
  sectionId: string;
  courseId: string;
  termId: string;
  academicYearId: string;
  teacherId: string;

  assignment: {
    assignmentId?: string;
    assignmentName: string;
    assignmentType: AssignmentType;
    categoryId?: string;
    dueDate?: string;
    possiblePoints: number;
    isExtraCredit?: boolean;
  };

  grades: {
    studentId: string;
    earnedPoints?: number;
    isMissing?: boolean;
    isExcused?: boolean;
    comment?: string;
  }[];
}

// Response
interface BulkRecordGradeResponse {
  recorded: number;               // Number successfully recorded
  errors: {
    studentId: string;
    error: string;
  }[];
}
```

### GradeResponseDto

```typescript
interface GradeResponseDto {
  gradeId: string;
  studentId: string;
  schoolId: string;
  courseId: string;
  sectionId?: string;
  teacherId: string;
  academicYearId: string;
  termId: string;

  // Calculated values (auto-computed from assignments)
  numericGrade?: number;          // Overall percentage
  letterGrade?: string;           // From grading policy
  gpaPoints?: number;             // GPA points
  credits?: number;

  // Category breakdown
  categoryGrades?: {
    categoryId: string;
    categoryName: string;
    weight: number;
    earnedPoints: number;
    possiblePoints: number;
    percentage: number;
    letterGrade?: string;
  }[];

  // All assignments in this grade
  assignments?: {
    assignmentId: string;
    assignmentName: string;
    assignmentType: string;
    categoryId?: string;
    dueDate?: string;
    earnedPoints?: number;
    possiblePoints: number;
    percentage?: number;
    letterGrade?: string;
    isExtraCredit?: boolean;
    isDropped?: boolean;          // Dropped by "drop lowest" rule
    isMissing?: boolean;
    isExcused?: boolean;
    comment?: string;
    gradedAt?: string;
  }[];

  isFinal: boolean;               // If true, cannot modify
  isPassFail?: boolean;
  isPassing?: boolean;
  teacherComment?: string;
  lastCalculatedAt?: string;
  publishedAt?: string;           // Set when finalized
  createdAt: string;
  updatedAt: string;
}
```

### GpaResult

```typescript
interface GpaResult {
  cumulativeGpa: number | null;   // Unweighted GPA (0-4.0 scale)
  weightedGpa: number | null;     // Weighted GPA (honors +0.5, AP +1.0)
  totalCredits: number;
  termGpas: {
    termId: string;
    gpa: number;
    credits: number;
  }[];
}
```

---

## Attendance

### CreateAttendanceDto

```typescript
interface CreateAttendanceDto {
  studentId: string;
  schoolId: string;
  date: string;                   // YYYY-MM-DD
  academicYearId: string;
  status: AttendanceStatus;
  periodId?: string;              // Specific period/class
  sectionId?: string;             // If period-based
  notes?: string;
  recordedBy: string;             // Staff UUID
}

type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'late'
  | 'tardy'                       // Alias for late
  | 'excused'
  | 'half_day'
  | 'early_departure'
  | 'remote';
```

### BulkAttendanceDto

```typescript
interface BulkAttendanceDto {
  schoolId: string;
  date: string;
  academicYearId: string;
  periodId?: string;
  sectionId?: string;
  recordedBy: string;

  records: {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
  }[];
}

// Response
interface BulkAttendanceResponse {
  recorded: number;
  errors: { studentId: string; error: string }[];
}
```

### AttendanceResponseDto

```typescript
interface AttendanceResponseDto {
  attendanceId: string;
  studentId: string;
  studentName?: string;
  schoolId: string;
  date: string;
  academicYearId: string;
  status: AttendanceStatus;
  periodId?: string;
  sectionId?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
  updatedAt: string;
}
```

### DailyAttendanceSummaryDto

```typescript
interface DailyAttendanceSummaryDto {
  date: string;
  schoolId: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  halfDay: number;
  remote: number;
  attendanceRate: number;         // 0-100 percentage
}
```

### StudentAttendanceSummaryDto

```typescript
interface StudentAttendanceSummaryDto {
  studentId: string;
  schoolId: string;
  academicYearId: string;
  startDate?: string;
  endDate?: string;
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendanceRate: number;         // 0-100 percentage
}
```

---

## Pagination

All list endpoints use this response format:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  lastEvaluatedKey?: string;      // Base64-encoded cursor for next page
  hasMore: boolean;
}

// Query parameters for pagination
interface PaginationParams {
  limit?: number;                 // Default 50, max 100
  cursor?: string;                // lastEvaluatedKey from previous response
}
```

---

## Error Response

```typescript
interface ApiErrorResponse {
  statusCode: number;             // HTTP status code
  errorCode: 'BAD_REQUEST' | 'NOT_FOUND' | 'CONFLICT' | 'FORBIDDEN' | 'UNAUTHORIZED' | 'INTERNAL_ERROR';
  message: string;                // Human-readable error message
  timestamp: string;              // ISO 8601
  requestId: string;              // For support/debugging
  path: string;                   // API path that was called
}
```
