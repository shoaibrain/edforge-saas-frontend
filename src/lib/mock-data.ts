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

