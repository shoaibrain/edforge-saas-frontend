/**
 * Student Portal Module Layout
 * 
 * A dedicated portal for students to:
 * - View their grades and academic progress
 * - Check attendance records
 * - View class schedule
 * - Access assignments and homework
 * - Communicate with teachers
 * 
 * This provides students with a unified, student-centric view of their
 * academic information without administrative distractions.
 */

import { createFileRoute, Outlet, useMatches, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  GraduationCap,
  ClipboardCheck,
  Calendar,
  FileText,
  BookOpen,
  Trophy,
  Target,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuthStore } from '@/stores/auth.store'

export const Route = createFileRoute('/_protected/student-portal')({
  component: StudentPortalLayout,
})

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

function StudentPortalLayout() {
  const matches = useMatches()
  const isExactRoute = matches[matches.length - 1]?.routeId === '/_protected/student-portal'
  
  if (isExactRoute) {
    return <StudentPortalPage />
  }
  
  return <Outlet />
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_STUDENT_DATA = {
  gpa: 3.8,
  attendanceRate: 96.5,
  upcomingAssignments: 3,
  currentTerm: 'Fall 2024',
  grade: '10th Grade',
  section: 'A',
}

const MOCK_RECENT_GRADES = [
  { id: 1, subject: 'Biology 101', assignment: 'Midterm Exam', score: 88, maxScore: 100, date: '2024-03-15' },
  { id: 2, subject: 'Mathematics', assignment: 'Quiz 3', score: 45, maxScore: 50, date: '2024-03-14' },
  { id: 3, subject: 'English', assignment: 'Essay', score: 92, maxScore: 100, date: '2024-03-12' },
]

const MOCK_UPCOMING_ASSIGNMENTS = [
  { id: 1, subject: 'Biology 101', title: 'Lab Report: Photosynthesis', dueDate: '2024-03-20', type: 'Lab Report' },
  { id: 2, subject: 'Mathematics', title: 'Problem Set 5', dueDate: '2024-03-18', type: 'Homework' },
  { id: 3, subject: 'History', title: 'Research Paper Outline', dueDate: '2024-03-22', type: 'Project' },
]

const MOCK_TODAY_SCHEDULE = [
  { id: 1, time: '8:00 AM', subject: 'Mathematics', room: 'Room 201', teacher: 'Mr. Johnson' },
  { id: 2, time: '9:30 AM', subject: 'Biology 101', room: 'Science Lab A', teacher: 'Dr. Mitchell' },
  { id: 3, time: '11:00 AM', subject: 'English', room: 'Room 105', teacher: 'Ms. Davis' },
  { id: 4, time: '1:00 PM', subject: 'History', room: 'Room 302', teacher: 'Mr. Wilson' },
]

// ============================================================================
// QUICK STAT CARD
// ============================================================================

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  iconBg, 
  iconColor,
}: { 
  icon: typeof GraduationCap
  label: string
  value: string | number
  iconBg: string
  iconColor: string
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">{value}</p>
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{label}</p>
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function StudentPortalPage() {
  const user = useAuthStore((s) => s.user)
  const studentName = user?.name ?? 'Student'

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
          Welcome back, {studentName.split(' ')[0]}
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">
          {MOCK_STUDENT_DATA.grade} • Section {MOCK_STUDENT_DATA.section} • {MOCK_STUDENT_DATA.currentTerm}
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          icon={Trophy}
          label="Current GPA"
          value={MOCK_STUDENT_DATA.gpa.toFixed(1)}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Attendance Rate"
          value={`${MOCK_STUDENT_DATA.attendanceRate}%`}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          icon={Target}
          label="Assignments Due"
          value={MOCK_STUDENT_DATA.upcomingAssignments}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-600 dark:text-violet-400"
        />
        <StatCard
          icon={BookOpen}
          label="Current Term"
          value={MOCK_STUDENT_DATA.currentTerm}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-golden-500" />
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Recent Grades
                  </h2>
                </div>
                <Link to="/student-portal/grades">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {MOCK_RECENT_GRADES.map((grade) => (
                <div key={grade.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[rgb(var(--text-primary))]">{grade.subject}</p>
                    <p className="text-sm text-[rgb(var(--text-tertiary))]">{grade.assignment}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[rgb(var(--text-primary))]">
                      {grade.score}/{grade.maxScore}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Assignments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-500" />
                  <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                    Upcoming Assignments
                  </h2>
                </div>
                <Link to="/student-portal/assignments">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {MOCK_UPCOMING_ASSIGNMENTS.map((assignment) => (
                <div key={assignment.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{assignment.title}</p>
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">{assignment.subject}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
                      {assignment.type}
                    </span>
                  </div>
                  <p className="text-xs text-rust-500 mt-2">
                    Due: {new Date(assignment.dueDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Today's Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500 dark:text-cyan-400" />
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Today's Schedule
                </h2>
              </div>
              <Link to="/student-portal/schedule">
                <Button variant="ghost" size="sm">Full Schedule</Button>
              </Link>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_TODAY_SCHEDULE.map((item) => (
              <div 
                key={item.id} 
                className="p-4 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-secondary))]"
              >
                <p className="text-xs text-teal-600 dark:text-cyan-400 font-semibold mb-1">{item.time}</p>
                <p className="font-medium text-[rgb(var(--text-primary))]">{item.subject}</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">{item.room}</p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">{item.teacher}</p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

