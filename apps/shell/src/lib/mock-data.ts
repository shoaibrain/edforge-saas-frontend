// ============================================================================
// EDFORGE MOCK DATA
// Comprehensive test data for the EMIS platform
// ============================================================================

export type PersonType = 'student' | 'guardian' | 'teacher' | 'staff' | 'admin'
export type PersonStatus = 'active' | 'inactive' | 'on_leave' | 'graduated' | 'suspended'

export interface Person {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  type: PersonType
  status: PersonStatus
  department?: string
  role?: string
  grade?: string
  enrollmentDate?: string
  hireDate?: string
  avatar?: string
  guardianId?: string // For students
  studentIds?: string[] // For guardians
}

// Generate a unique ID
const generateId = (prefix: string, index: number) => 
  `${prefix}-${String(index).padStart(4, '0')}`

// ============================================================================
// STUDENTS
// ============================================================================
export const MOCK_STUDENTS: Person[] = [
  {
    id: generateId('STU', 1),
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma.thompson@student.lincoln.edu',
    phone: '(555) 123-4501',
    type: 'student',
    status: 'active',
    grade: '10th',
    department: 'Science Stream',
    enrollmentDate: '2022-08-15',
    guardianId: 'GRD-0001',
  },
  {
    id: generateId('STU', 2),
    firstName: 'Liam',
    lastName: 'Anderson',
    email: 'liam.anderson@student.lincoln.edu',
    phone: '(555) 123-4502',
    type: 'student',
    status: 'active',
    grade: '11th',
    department: 'Arts Stream',
    enrollmentDate: '2021-08-20',
    guardianId: 'GRD-0002',
  },
  {
    id: generateId('STU', 3),
    firstName: 'Sophia',
    lastName: 'Martinez',
    email: 'sophia.martinez@student.lincoln.edu',
    phone: '(555) 123-4503',
    type: 'student',
    status: 'active',
    grade: '9th',
    department: 'Commerce Stream',
    enrollmentDate: '2023-08-10',
    guardianId: 'GRD-0003',
  },
  {
    id: generateId('STU', 4),
    firstName: 'Noah',
    lastName: 'Williams',
    email: 'noah.williams@student.lincoln.edu',
    phone: '(555) 123-4504',
    type: 'student',
    status: 'active',
    grade: '12th',
    department: 'Science Stream',
    enrollmentDate: '2020-08-18',
    guardianId: 'GRD-0004',
  },
  {
    id: generateId('STU', 5),
    firstName: 'Olivia',
    lastName: 'Brown',
    email: 'olivia.brown@student.lincoln.edu',
    phone: '(555) 123-4505',
    type: 'student',
    status: 'on_leave',
    grade: '10th',
    department: 'Science Stream',
    enrollmentDate: '2022-08-15',
    guardianId: 'GRD-0005',
  },
  {
    id: generateId('STU', 6),
    firstName: 'James',
    lastName: 'Davis',
    email: 'james.davis@student.lincoln.edu',
    phone: '(555) 123-4506',
    type: 'student',
    status: 'active',
    grade: '11th',
    department: 'Commerce Stream',
    enrollmentDate: '2021-08-20',
    guardianId: 'GRD-0006',
  },
  {
    id: generateId('STU', 7),
    firstName: 'Ava',
    lastName: 'Garcia',
    email: 'ava.garcia@student.lincoln.edu',
    phone: '(555) 123-4507',
    type: 'student',
    status: 'active',
    grade: '9th',
    department: 'Arts Stream',
    enrollmentDate: '2023-08-10',
    guardianId: 'GRD-0007',
  },
  {
    id: generateId('STU', 8),
    firstName: 'William',
    lastName: 'Rodriguez',
    email: 'william.rodriguez@student.lincoln.edu',
    phone: '(555) 123-4508',
    type: 'student',
    status: 'graduated',
    grade: '12th',
    department: 'Science Stream',
    enrollmentDate: '2019-08-18',
    guardianId: 'GRD-0008',
  },
]

// ============================================================================
// GUARDIANS
// ============================================================================
export const MOCK_GUARDIANS: Person[] = [
  {
    id: 'GRD-0001',
    firstName: 'Michael',
    lastName: 'Thompson',
    email: 'michael.thompson@email.com',
    phone: '(555) 234-5601',
    type: 'guardian',
    status: 'active',
    studentIds: ['STU-0001'],
  },
  {
    id: 'GRD-0002',
    firstName: 'Jennifer',
    lastName: 'Anderson',
    email: 'jennifer.anderson@email.com',
    phone: '(555) 234-5602',
    type: 'guardian',
    status: 'active',
    studentIds: ['STU-0002'],
  },
  {
    id: 'GRD-0003',
    firstName: 'Carlos',
    lastName: 'Martinez',
    email: 'carlos.martinez@email.com',
    phone: '(555) 234-5603',
    type: 'guardian',
    status: 'active',
    studentIds: ['STU-0003'],
  },
  {
    id: 'GRD-0004',
    firstName: 'Patricia',
    lastName: 'Williams',
    email: 'patricia.williams@email.com',
    phone: '(555) 234-5604',
    type: 'guardian',
    status: 'active',
    studentIds: ['STU-0004'],
  },
  {
    id: 'GRD-0005',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@email.com',
    phone: '(555) 234-5605',
    type: 'guardian',
    status: 'active',
    studentIds: ['STU-0005'],
  },
]

// ============================================================================
// TEACHERS
// ============================================================================
export const MOCK_TEACHERS: Person[] = [
  {
    id: 'TCH-0001',
    firstName: 'Amanda',
    lastName: 'Foster',
    email: 'amanda.foster@lincoln.edu',
    phone: '(555) 345-6701',
    type: 'teacher',
    status: 'active',
    role: 'Principal',
    department: 'Administration',
    hireDate: '2015-03-15',
  },
  {
    id: 'TCH-0002',
    firstName: 'Robert',
    lastName: 'Martinez',
    email: 'robert.martinez@lincoln.edu',
    phone: '(555) 345-6702',
    type: 'teacher',
    status: 'active',
    role: 'Vice Principal',
    department: 'Administration',
    hireDate: '2017-07-20',
  },
  {
    id: 'TCH-0003',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@lincoln.edu',
    phone: '(555) 345-6703',
    type: 'teacher',
    status: 'active',
    role: 'Math Teacher',
    department: 'Mathematics',
    hireDate: '2018-08-01',
  },
  {
    id: 'TCH-0004',
    firstName: 'Michael',
    lastName: 'Chen',
    email: 'michael.chen@lincoln.edu',
    phone: '(555) 345-6704',
    type: 'teacher',
    status: 'active',
    role: 'Science Teacher',
    department: 'Sciences',
    hireDate: '2019-01-15',
  },
  {
    id: 'TCH-0005',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@lincoln.edu',
    phone: '(555) 345-6705',
    type: 'teacher',
    status: 'on_leave',
    role: 'English Teacher',
    department: 'Languages',
    hireDate: '2020-06-01',
  },
  {
    id: 'TCH-0006',
    firstName: 'James',
    lastName: 'Wilson',
    email: 'james.wilson@lincoln.edu',
    phone: '(555) 345-6706',
    type: 'teacher',
    status: 'active',
    role: 'PE Teacher',
    department: 'Physical Education',
    hireDate: '2016-09-01',
  },
  {
    id: 'TCH-0007',
    firstName: 'Lisa',
    lastName: 'Brown',
    email: 'lisa.brown@lincoln.edu',
    phone: '(555) 345-6707',
    type: 'teacher',
    status: 'active',
    role: 'Art Teacher',
    department: 'Arts',
    hireDate: '2021-08-15',
  },
  {
    id: 'TCH-0008',
    firstName: 'David',
    lastName: 'Lee',
    email: 'david.lee@lincoln.edu',
    phone: '(555) 345-6708',
    type: 'teacher',
    status: 'active',
    role: 'Music Teacher',
    department: 'Arts',
    hireDate: '2019-03-01',
  },
]

// ============================================================================
// ADMINISTRATIVE STAFF
// ============================================================================
export const MOCK_STAFF: Person[] = [
  {
    id: 'STF-0001',
    firstName: 'Nancy',
    lastName: 'Parker',
    email: 'nancy.parker@lincoln.edu',
    phone: '(555) 456-7801',
    type: 'staff',
    status: 'active',
    role: 'Office Manager',
    department: 'Administration',
    hireDate: '2014-05-01',
  },
  {
    id: 'STF-0002',
    firstName: 'Thomas',
    lastName: 'Wright',
    email: 'thomas.wright@lincoln.edu',
    phone: '(555) 456-7802',
    type: 'staff',
    status: 'active',
    role: 'IT Administrator',
    department: 'Technology',
    hireDate: '2018-02-15',
  },
  {
    id: 'STF-0003',
    firstName: 'Karen',
    lastName: 'Hall',
    email: 'karen.hall@lincoln.edu',
    phone: '(555) 456-7803',
    type: 'staff',
    status: 'active',
    role: 'Librarian',
    department: 'Library',
    hireDate: '2016-08-01',
  },
  {
    id: 'STF-0004',
    firstName: 'Steven',
    lastName: 'King',
    email: 'steven.king@lincoln.edu',
    phone: '(555) 456-7804',
    type: 'staff',
    status: 'active',
    role: 'Accountant',
    department: 'Finance',
    hireDate: '2017-11-01',
  },
  {
    id: 'STF-0005',
    firstName: 'Michelle',
    lastName: 'Adams',
    email: 'michelle.adams@lincoln.edu',
    phone: '(555) 456-7805',
    type: 'staff',
    status: 'active',
    role: 'HR Coordinator',
    department: 'Human Resources',
    hireDate: '2019-04-15',
  },
  {
    id: 'STF-0006',
    firstName: 'Richard',
    lastName: 'Baker',
    email: 'richard.baker@lincoln.edu',
    phone: '(555) 456-7806',
    type: 'staff',
    status: 'inactive',
    role: 'Security Guard',
    department: 'Security',
    hireDate: '2015-09-01',
  },
]

// ============================================================================
// ALL PEOPLE - Combined for easy access
// ============================================================================
export const ALL_PEOPLE: Person[] = [
  ...MOCK_STUDENTS,
  ...MOCK_GUARDIANS,
  ...MOCK_TEACHERS,
  ...MOCK_STAFF,
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getPersonFullName(person: Person): string {
  return `${person.firstName} ${person.lastName}`
}

export function getPersonTypeLabel(type: PersonType): string {
  const labels: Record<PersonType, string> = {
    student: 'Student',
    guardian: 'Guardian',
    teacher: 'Teacher',
    staff: 'Staff',
    admin: 'Admin',
  }
  return labels[type]
}

export function getPersonStatusColor(status: PersonStatus): { bg: string; text: string } {
  const colors: Record<PersonStatus, { bg: string; text: string }> = {
    active: { bg: 'bg-aqua-400/20', text: 'text-aqua-700 dark:text-aqua-400' },
    inactive: { bg: 'bg-vanilla-400/30', text: 'text-vanilla-700 dark:text-vanilla-400' },
    on_leave: { bg: 'bg-golden-400/20', text: 'text-golden-700 dark:text-golden-400' },
    graduated: { bg: 'bg-teal-500/20', text: 'text-teal-700 dark:text-cyan-400' },
    suspended: { bg: 'bg-rust-100 dark:bg-rust-900/30', text: 'text-rust-600 dark:text-rust-400' },
  }
  return colors[status]
}

export function getPersonTypeColor(type: PersonType): { bg: string; text: string; icon: string } {
  const colors: Record<PersonType, { bg: string; text: string; icon: string }> = {
    student: { bg: 'bg-golden-400/20', text: 'text-golden-700 dark:text-golden-400', icon: 'text-golden-500' },
    guardian: { bg: 'bg-vanilla-400/30', text: 'text-vanilla-700 dark:text-vanilla-400', icon: 'text-vanilla-600' },
    teacher: { bg: 'bg-teal-500/20', text: 'text-teal-700 dark:text-cyan-400', icon: 'text-teal-500 dark:text-cyan-400' },
    staff: { bg: 'bg-aqua-400/20', text: 'text-aqua-700 dark:text-aqua-400', icon: 'text-aqua-600 dark:text-aqua-400' },
    admin: { bg: 'bg-caramel-400/20', text: 'text-caramel-700 dark:text-caramel-400', icon: 'text-caramel-500' },
  }
  return colors[type]
}

// ============================================================================
// STATS HELPERS
// ============================================================================

export function getPeopleStats() {
  const totalStudents = MOCK_STUDENTS.length
  const totalTeachers = MOCK_TEACHERS.length
  const totalStaff = MOCK_STAFF.length
  const totalGuardians = MOCK_GUARDIANS.length
  
  const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'active').length
  const activeTeachers = MOCK_TEACHERS.filter(t => t.status === 'active').length
  const activeStaff = MOCK_STAFF.filter(s => s.status === 'active').length
  
  const onLeave = [...MOCK_TEACHERS, ...MOCK_STAFF].filter(p => p.status === 'on_leave').length
  
  return {
    totalStudents,
    totalTeachers,
    totalStaff,
    totalGuardians,
    activeStudents,
    activeTeachers,
    activeStaff,
    onLeave,
    totalPeople: totalStudents + totalTeachers + totalStaff + totalGuardians,
  }
}

// ============================================================================
// EXTENDED STUDENT DATA
// ============================================================================

export interface StudentRecord {
  id: string
  studentId: string // STU-XXXX
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  grade: string
  section: string
  enrollmentDate: string
  status: PersonStatus
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  guardian: {
    id: string
    name: string
    relationship: string
    phone: string
    email: string
  }
  academicStats: {
    gpa: number
    attendanceRate: number
    currentCredits: number
    totalCredits: number
  }
  enrollmentHistory: {
    year: string
    grade: string
    status: string
  }[]
}

export const MOCK_STUDENT_RECORDS: StudentRecord[] = [
  {
    id: 'student-001',
    studentId: 'STU-2024-001',
    firstName: 'Emma',
    lastName: 'Thompson',
    email: 'emma.thompson@student.edu',
    phone: '(555) 123-4567',
    dateOfBirth: '2010-05-15',
    gender: 'Female',
    grade: '8th Grade',
    section: 'A',
    enrollmentDate: '2022-08-15',
    status: 'active',
    address: {
      street: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
    guardian: {
      id: 'parent-001',
      name: 'Robert Thompson',
      relationship: 'Father',
      phone: '(555) 987-6543',
      email: 'robert.thompson@email.com',
    },
    academicStats: {
      gpa: 3.8,
      attendanceRate: 96.5,
      currentCredits: 24,
      totalCredits: 30,
    },
    enrollmentHistory: [
      { year: '2022-2023', grade: '6th Grade', status: 'Completed' },
      { year: '2023-2024', grade: '7th Grade', status: 'Completed' },
      { year: '2024-2025', grade: '8th Grade', status: 'In Progress' },
    ],
  },
  {
    id: 'student-002',
    studentId: 'STU-2024-002',
    firstName: 'Lucas',
    lastName: 'Thompson',
    email: 'lucas.thompson@student.edu',
    phone: '(555) 123-4568',
    dateOfBirth: '2013-09-22',
    gender: 'Male',
    grade: '5th Grade',
    section: 'B',
    enrollmentDate: '2023-08-20',
    status: 'active',
    address: {
      street: '123 Oak Street',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
    },
    guardian: {
      id: 'parent-001',
      name: 'Robert Thompson',
      relationship: 'Father',
      phone: '(555) 987-6543',
      email: 'robert.thompson@email.com',
    },
    academicStats: {
      gpa: 3.5,
      attendanceRate: 94.2,
      currentCredits: 18,
      totalCredits: 24,
    },
    enrollmentHistory: [
      { year: '2023-2024', grade: '4th Grade', status: 'Completed' },
      { year: '2024-2025', grade: '5th Grade', status: 'In Progress' },
    ],
  },
  {
    id: 'student-003',
    studentId: 'STU-2024-003',
    firstName: 'Sophia',
    lastName: 'Martinez',
    email: 'sophia.martinez@student.edu',
    phone: '(555) 123-4569',
    dateOfBirth: '2011-02-10',
    gender: 'Female',
    grade: '7th Grade',
    section: 'A',
    enrollmentDate: '2021-08-15',
    status: 'active',
    address: {
      street: '456 Maple Avenue',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
    },
    guardian: {
      id: 'parent-002',
      name: 'Maria Martinez',
      relationship: 'Mother',
      phone: '(555) 876-5432',
      email: 'maria.martinez@email.com',
    },
    academicStats: {
      gpa: 3.9,
      attendanceRate: 98.1,
      currentCredits: 21,
      totalCredits: 24,
    },
    enrollmentHistory: [
      { year: '2021-2022', grade: '5th Grade', status: 'Completed' },
      { year: '2022-2023', grade: '6th Grade', status: 'Completed' },
      { year: '2023-2024', grade: '7th Grade', status: 'In Progress' },
    ],
  },
]

// ============================================================================
// TEACHER RECORDS WITH CERTIFICATIONS
// ============================================================================

export interface TeacherRecord {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: 'Male' | 'Female' | 'Other'
  department: string
  hireDate: string
  status: PersonStatus
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  stats: {
    totalStudents: number
    classesPerWeek: number
    yearsExperience: number
    avgRating: number
  }
  certifications: {
    name: string
    issuer: string
    year: number
  }[]
  currentClasses: {
    name: string
    grade: string
    students: number
    schedule: string
  }[]
}

export const MOCK_TEACHER_RECORDS: TeacherRecord[] = [
  {
    id: 'teacher-001',
    employeeId: 'TCH-2024-001',
    firstName: 'Dr. Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@school.edu',
    phone: '(555) 234-5678',
    dateOfBirth: '1985-03-22',
    gender: 'Female',
    department: 'Science',
    hireDate: '2018-08-15',
    status: 'active',
    address: {
      street: '456 Elm Avenue',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62702',
    },
    stats: {
      totalStudents: 145,
      classesPerWeek: 25,
      yearsExperience: 12,
      avgRating: 4.8,
    },
    certifications: [
      { name: 'State Teaching License', issuer: 'IL Board of Education', year: 2012 },
      { name: 'Advanced Science Pedagogy', issuer: 'National Science Foundation', year: 2019 },
      { name: 'STEM Education Certificate', issuer: 'MIT OpenCourseWare', year: 2021 },
    ],
    currentClasses: [
      { name: 'Biology 101', grade: '9th Grade', students: 28, schedule: 'Mon, Wed, Fri 9:00 AM' },
      { name: 'Chemistry AP', grade: '11th Grade', students: 22, schedule: 'Tue, Thu 10:30 AM' },
      { name: 'Environmental Science', grade: '10th Grade', students: 25, schedule: 'Mon, Wed 2:00 PM' },
    ],
  },
  {
    id: 'teacher-002',
    employeeId: 'TCH-2024-002',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@school.edu',
    phone: '(555) 234-5679',
    dateOfBirth: '1982-07-14',
    gender: 'Male',
    department: 'Mathematics',
    hireDate: '2015-08-20',
    status: 'active',
    address: {
      street: '789 Pine Road',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62703',
    },
    stats: {
      totalStudents: 168,
      classesPerWeek: 28,
      yearsExperience: 15,
      avgRating: 4.6,
    },
    certifications: [
      { name: 'State Teaching License', issuer: 'IL Board of Education', year: 2009 },
      { name: 'Advanced Mathematics Pedagogy', issuer: 'MAA', year: 2017 },
      { name: 'AP Calculus Certified', issuer: 'College Board', year: 2016 },
    ],
    currentClasses: [
      { name: 'Algebra II', grade: '10th Grade', students: 30, schedule: 'Mon, Wed, Fri 8:00 AM' },
      { name: 'Calculus AP', grade: '12th Grade', students: 18, schedule: 'Tue, Thu 9:30 AM' },
      { name: 'Geometry', grade: '9th Grade', students: 32, schedule: 'Mon, Wed, Fri 1:00 PM' },
    ],
  },
]

// ============================================================================
// FINANCIAL RECORDS
// ============================================================================

export type TransactionType = 'income' | 'expense'
export type TransactionCategory = 
  | 'tuition' 
  | 'fees' 
  | 'transport' 
  | 'library' 
  | 'salary' 
  | 'utilities' 
  | 'supplies' 
  | 'maintenance' 
  | 'other'

export interface FinancialTransaction {
  id: string
  date: string
  type: TransactionType
  category: TransactionCategory
  description: string
  amount: number
  studentId?: string
  staffId?: string
  status: 'completed' | 'pending' | 'failed'
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'check'
  reference?: string
}

export const MOCK_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [
  {
    id: 'txn-001',
    date: '2024-03-15',
    type: 'income',
    category: 'tuition',
    description: 'Tuition Fee - Spring Semester 2024',
    amount: 5500,
    studentId: 'student-001',
    status: 'completed',
    paymentMethod: 'bank_transfer',
    reference: 'TUI-2024-0315-001',
  },
  {
    id: 'txn-002',
    date: '2024-03-15',
    type: 'income',
    category: 'tuition',
    description: 'Tuition Fee - Spring Semester 2024',
    amount: 5500,
    studentId: 'student-002',
    status: 'completed',
    paymentMethod: 'card',
    reference: 'TUI-2024-0315-002',
  },
  {
    id: 'txn-003',
    date: '2024-03-14',
    type: 'income',
    category: 'fees',
    description: 'Lab Fee - Science Department',
    amount: 150,
    studentId: 'student-001',
    status: 'completed',
    paymentMethod: 'cash',
    reference: 'FEE-2024-0314-001',
  },
  {
    id: 'txn-004',
    date: '2024-03-14',
    type: 'income',
    category: 'transport',
    description: 'Transportation Fee - March 2024',
    amount: 250,
    studentId: 'student-003',
    status: 'pending',
    reference: 'TRP-2024-0314-001',
  },
  {
    id: 'txn-005',
    date: '2024-03-10',
    type: 'expense',
    category: 'salary',
    description: 'Staff Payroll - March 2024',
    amount: 45000,
    status: 'completed',
    paymentMethod: 'bank_transfer',
    reference: 'PAY-2024-0310-001',
  },
  {
    id: 'txn-006',
    date: '2024-03-08',
    type: 'expense',
    category: 'utilities',
    description: 'Electricity Bill - February 2024',
    amount: 2800,
    status: 'completed',
    paymentMethod: 'bank_transfer',
    reference: 'UTL-2024-0308-001',
  },
  {
    id: 'txn-007',
    date: '2024-03-05',
    type: 'expense',
    category: 'supplies',
    description: 'Office Supplies - Q1 2024',
    amount: 1200,
    status: 'completed',
    paymentMethod: 'card',
    reference: 'SUP-2024-0305-001',
  },
  {
    id: 'txn-008',
    date: '2024-03-01',
    type: 'expense',
    category: 'maintenance',
    description: 'HVAC System Maintenance',
    amount: 3500,
    status: 'completed',
    paymentMethod: 'check',
    reference: 'MNT-2024-0301-001',
  },
]

export interface FeeStructure {
  id: string
  name: string
  amount: number
  frequency: 'one-time' | 'monthly' | 'semester' | 'annual'
  category: TransactionCategory
  gradeLevel?: string
  mandatory: boolean
}

export const MOCK_FEE_STRUCTURES: FeeStructure[] = [
  { id: 'fee-001', name: 'Tuition Fee', amount: 5500, frequency: 'semester', category: 'tuition', mandatory: true },
  { id: 'fee-002', name: 'Registration Fee', amount: 200, frequency: 'one-time', category: 'fees', mandatory: true },
  { id: 'fee-003', name: 'Lab Fee', amount: 150, frequency: 'semester', category: 'fees', gradeLevel: '9th-12th', mandatory: false },
  { id: 'fee-004', name: 'Library Fee', amount: 50, frequency: 'annual', category: 'library', mandatory: true },
  { id: 'fee-005', name: 'Transportation Fee', amount: 250, frequency: 'monthly', category: 'transport', mandatory: false },
  { id: 'fee-006', name: 'Activity Fee', amount: 100, frequency: 'semester', category: 'fees', mandatory: false },
  { id: 'fee-007', name: 'Technology Fee', amount: 75, frequency: 'semester', category: 'fees', mandatory: true },
]

// ============================================================================
// ATTENDANCE RECORDS
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRecord {
  id: string
  date: string
  studentId: string
  classId: string
  status: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  markedBy: string
}

export const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: 'att-001', date: '2024-03-15', studentId: 'student-001', classId: 'class-001', status: 'present', checkInTime: '08:45', markedBy: 'teacher-001' },
  { id: 'att-002', date: '2024-03-15', studentId: 'student-002', classId: 'class-001', status: 'present', checkInTime: '08:50', markedBy: 'teacher-001' },
  { id: 'att-003', date: '2024-03-15', studentId: 'student-003', classId: 'class-001', status: 'late', checkInTime: '09:15', notes: 'Traffic delay', markedBy: 'teacher-001' },
  { id: 'att-004', date: '2024-03-14', studentId: 'student-001', classId: 'class-001', status: 'present', checkInTime: '08:40', markedBy: 'teacher-001' },
  { id: 'att-005', date: '2024-03-14', studentId: 'student-002', classId: 'class-001', status: 'absent', notes: 'Sick - called in', markedBy: 'teacher-001' },
  { id: 'att-006', date: '2024-03-14', studentId: 'student-003', classId: 'class-001', status: 'excused', notes: 'Medical appointment', markedBy: 'teacher-001' },
  { id: 'att-007', date: '2024-03-13', studentId: 'student-001', classId: 'class-001', status: 'present', checkInTime: '08:42', markedBy: 'teacher-001' },
  { id: 'att-008', date: '2024-03-13', studentId: 'student-002', classId: 'class-001', status: 'present', checkInTime: '08:48', markedBy: 'teacher-001' },
]

// ============================================================================
// GRADE RECORDS
// ============================================================================

export type GradeLevel = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'D-' | 'F'

export interface GradeRecord {
  id: string
  studentId: string
  classId: string
  subject: string
  term: string
  year: string
  assignments: {
    id: string
    name: string
    type: 'homework' | 'quiz' | 'test' | 'project' | 'final'
    score: number
    maxScore: number
    weight: number
    date: string
  }[]
  finalGrade: GradeLevel
  percentageScore: number
  comments?: string
  teacherId: string
}

export const MOCK_GRADE_RECORDS: GradeRecord[] = [
  {
    id: 'grade-001',
    studentId: 'student-001',
    classId: 'class-001',
    subject: 'Biology 101',
    term: 'Fall',
    year: '2024',
    assignments: [
      { id: 'asgn-001', name: 'Cell Structure Quiz', type: 'quiz', score: 45, maxScore: 50, weight: 10, date: '2024-09-15' },
      { id: 'asgn-002', name: 'Lab Report: Microscopy', type: 'homework', score: 92, maxScore: 100, weight: 15, date: '2024-09-28' },
      { id: 'asgn-003', name: 'Midterm Exam', type: 'test', score: 88, maxScore: 100, weight: 25, date: '2024-10-15' },
      { id: 'asgn-004', name: 'Genetics Project', type: 'project', score: 95, maxScore: 100, weight: 20, date: '2024-11-10' },
    ],
    finalGrade: 'A-',
    percentageScore: 91.2,
    comments: 'Excellent work on the genetics project. Shows strong analytical skills.',
    teacherId: 'teacher-001',
  },
  {
    id: 'grade-002',
    studentId: 'student-001',
    classId: 'class-002',
    subject: 'Mathematics',
    term: 'Fall',
    year: '2024',
    assignments: [
      { id: 'asgn-005', name: 'Algebra Quiz 1', type: 'quiz', score: 42, maxScore: 50, weight: 10, date: '2024-09-12' },
      { id: 'asgn-006', name: 'Problem Set 1', type: 'homework', score: 85, maxScore: 100, weight: 10, date: '2024-09-25' },
      { id: 'asgn-007', name: 'Midterm Exam', type: 'test', score: 78, maxScore: 100, weight: 30, date: '2024-10-18' },
    ],
    finalGrade: 'B+',
    percentageScore: 84.5,
    comments: 'Good progress this semester. Would benefit from more practice problems.',
    teacherId: 'teacher-002',
  },
  {
    id: 'grade-003',
    studentId: 'student-002',
    classId: 'class-001',
    subject: 'Biology 101',
    term: 'Fall',
    year: '2024',
    assignments: [
      { id: 'asgn-008', name: 'Cell Structure Quiz', type: 'quiz', score: 38, maxScore: 50, weight: 10, date: '2024-09-15' },
      { id: 'asgn-009', name: 'Lab Report: Microscopy', type: 'homework', score: 82, maxScore: 100, weight: 15, date: '2024-09-28' },
      { id: 'asgn-010', name: 'Midterm Exam', type: 'test', score: 75, maxScore: 100, weight: 25, date: '2024-10-15' },
    ],
    finalGrade: 'B',
    percentageScore: 80.2,
    comments: 'Solid understanding of concepts. Lab work could be more detailed.',
    teacherId: 'teacher-001',
  },
]

// ============================================================================
// CLASSROOM/CLASS DATA
// ============================================================================

export interface Classroom {
  id: string
  name: string
  building: string
  floor: string
  capacity: number
  currentOccupancy: number
  type: 'Standard' | 'Lab' | 'Computer Lab' | 'Art Studio' | 'Music Room' | 'Gymnasium'
  status: 'active' | 'maintenance' | 'inactive'
  equipment: { name: string; status: 'operational' | 'needs_repair' }[]
}

export const MOCK_CLASSROOMS: Classroom[] = [
  {
    id: 'room-001',
    name: 'Room 101',
    building: 'Main Building',
    floor: '1st Floor',
    capacity: 35,
    currentOccupancy: 28,
    type: 'Standard',
    status: 'active',
    equipment: [
      { name: 'Smart Board', status: 'operational' },
      { name: 'Projector', status: 'operational' },
      { name: 'Computer Station', status: 'operational' },
    ],
  },
  {
    id: 'room-002',
    name: 'Science Lab A',
    building: 'Science Wing',
    floor: '2nd Floor',
    capacity: 24,
    currentOccupancy: 22,
    type: 'Lab',
    status: 'active',
    equipment: [
      { name: 'Fume Hood', status: 'operational' },
      { name: 'Lab Benches', status: 'operational' },
      { name: 'Emergency Shower', status: 'operational' },
      { name: 'Microscopes (24)', status: 'needs_repair' },
    ],
  },
  {
    id: 'room-003',
    name: 'Computer Lab 1',
    building: 'Main Building',
    floor: '2nd Floor',
    capacity: 30,
    currentOccupancy: 30,
    type: 'Computer Lab',
    status: 'active',
    equipment: [
      { name: 'Desktop Computers (30)', status: 'operational' },
      { name: 'Projector', status: 'operational' },
      { name: 'Printer', status: 'needs_repair' },
    ],
  },
]

// ============================================================================
// ACADEMIC CALENDAR
// ============================================================================

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  type: 'holiday' | 'exam' | 'event' | 'deadline' | 'meeting' | 'break'
  allDay: boolean
  schoolId?: string
}

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  { id: 'evt-001', title: 'Spring Break', startDate: '2024-03-25', endDate: '2024-03-29', type: 'break', allDay: true },
  { id: 'evt-002', title: 'Midterm Exams', startDate: '2024-03-11', endDate: '2024-03-15', type: 'exam', allDay: true },
  { id: 'evt-003', title: 'Parent-Teacher Conference', description: 'Spring semester conferences', startDate: '2024-04-05', endDate: '2024-04-05', type: 'event', allDay: false },
  { id: 'evt-004', title: 'Memorial Day', startDate: '2024-05-27', endDate: '2024-05-27', type: 'holiday', allDay: true },
  { id: 'evt-005', title: 'Final Exams', startDate: '2024-06-03', endDate: '2024-06-07', type: 'exam', allDay: true },
  { id: 'evt-006', title: 'Last Day of School', startDate: '2024-06-14', endDate: '2024-06-14', type: 'event', allDay: true },
  { id: 'evt-007', title: 'Graduation Ceremony', description: 'Class of 2024 graduation', startDate: '2024-06-15', endDate: '2024-06-15', type: 'event', allDay: false },
  { id: 'evt-008', title: 'Staff Professional Development', startDate: '2024-04-15', endDate: '2024-04-15', type: 'meeting', allDay: true },
]

// ============================================================================
// FINANCIAL STATS HELPER
// ============================================================================

export function getFinancialStats() {
  const income = MOCK_FINANCIAL_TRANSACTIONS
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = MOCK_FINANCIAL_TRANSACTIONS
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const pendingIncome = MOCK_FINANCIAL_TRANSACTIONS
    .filter(t => t.type === 'income' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0)
  
  return {
    totalIncome: income,
    totalExpenses: expenses,
    netIncome: income - expenses,
    pendingIncome,
    transactionCount: MOCK_FINANCIAL_TRANSACTIONS.length,
  }
}

// ============================================================================
// ACADEMIC STATS HELPER
// ============================================================================

export function getAcademicStats() {
  const allGrades = MOCK_GRADE_RECORDS.map(r => r.percentageScore)
  const avgGPA = allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length / 25 // Convert to 4.0 scale roughly
  
  const presentCount = MOCK_ATTENDANCE_RECORDS.filter(a => a.status === 'present').length
  const totalAttendance = MOCK_ATTENDANCE_RECORDS.length
  const attendanceRate = (presentCount / totalAttendance) * 100
  
  return {
    averageGPA: Math.min(avgGPA, 4.0),
    attendanceRate,
    totalStudents: MOCK_STUDENT_RECORDS.length,
    totalTeachers: MOCK_TEACHER_RECORDS.length,
    totalClasses: MOCK_TEACHER_RECORDS.reduce((sum, t) => sum + t.currentClasses.length, 0),
  }
}

