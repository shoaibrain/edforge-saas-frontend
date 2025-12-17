/**
 * Student Detail Page
 * 
 * Displays comprehensive student profile including:
 * - Personal information
 * - Academic history
 * - Enrollment records
 * - Attendance summary
 * - Guardian information
 */

import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { useState } from 'react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Users,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  FileText,
  TrendingUp,
  Clock,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/academics/students/$studentId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'students', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: StudentDetailPage,
})

// Mock student data - will be replaced with API call
const MOCK_STUDENT = {
  id: 'student-001',
  firstName: 'Emma',
  lastName: 'Thompson',
  email: 'emma.thompson@student.edu',
  phone: '(555) 123-4567',
  dateOfBirth: '2010-05-15',
  gender: 'Female',
  grade: '8th Grade',
  section: 'A',
  enrollmentDate: '2022-08-15',
  studentId: 'STU-2024-001',
  status: 'active' as const,
  address: {
    street: '123 Oak Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
  },
  guardian: {
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
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  iconBg, 
  iconColor,
  suffix,
}: { 
  label: string
  value: string | number
  icon: typeof User
  iconBg: string
  iconColor: string
  suffix?: string
}) {
  const [hovered, setHovered] = useState(false)
  
  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -2 : 0,
    config: config.gentle,
  })

  return (
    <animated.div
      style={{
        transform: springProps.scale.to(s => `scale(${s}) translateY(${springProps.y.get()}px)`),
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg}`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {value}{suffix}
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">{label}</p>
          </div>
        </div>
      </Card>
    </animated.div>
  )
}

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))] mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[rgb(var(--text-tertiary))] mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{value}</p>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function StudentDetailPage() {
  const { studentId: _studentId } = Route.useParams()
  // TODO: Fetch student data using _studentId
  const student = MOCK_STUDENT

  const statusColors = {
    active: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    inactive: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
    graduated: 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
    suspended: 'bg-rust-400/20 text-rust-600 dark:text-rust-400',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/academics/students"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Students
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <Avatar 
            name={`${student.firstName} ${student.lastName}`} 
            size="xl" 
            shape="rounded" 
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {student.firstName} {student.lastName}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[student.status]}`}>
                {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
              </span>
            </div>
            <p className="text-[rgb(var(--text-secondary))]">
              {student.grade} • Section {student.section}
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Student ID: {student.studentId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="GPA"
          value={student.academicStats.gpa.toFixed(1)}
          icon={TrendingUp}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Attendance"
          value={student.academicStats.attendanceRate}
          suffix="%"
          icon={ClipboardCheck}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Credits Earned"
          value={student.academicStats.currentCredits}
          icon={BookOpen}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Total Credits"
          value={student.academicStats.totalCredits}
          icon={GraduationCap}
          iconBg="bg-vanilla-400/30 dark:bg-vanilla-400/20"
          iconColor="text-vanilla-700 dark:text-vanilla-500"
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Personal Information
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 divide-y sm:divide-y-0 divide-[rgb(var(--border-secondary))]">
              <div className="space-y-1">
                <InfoRow icon={Mail} label="Email" value={student.email} />
                <InfoRow icon={Phone} label="Phone" value={student.phone} />
                <InfoRow icon={Calendar} label="Date of Birth" value={new Date(student.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={User} label="Gender" value={student.gender} />
              </div>
              <div className="space-y-1 pt-3 sm:pt-0">
                <InfoRow icon={MapPin} label="Address" value={`${student.address.street}, ${student.address.city}, ${student.address.state} ${student.address.zipCode}`} />
                <InfoRow icon={Clock} label="Enrolled" value={new Date(student.enrollmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={GraduationCap} label="Grade Level" value={student.grade} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Guardian Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Guardian
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={student.guardian.name} size="md" />
                <div>
                  <p className="font-medium text-[rgb(var(--text-primary))]">{student.guardian.name}</p>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">{student.guardian.relationship}</p>
                </div>
              </div>
              <div className="space-y-1 border-t border-[rgb(var(--border-secondary))] pt-4">
                <InfoRow icon={Phone} label="Phone" value={student.guardian.phone} />
                <InfoRow icon={Mail} label="Email" value={student.guardian.email} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent Activity / Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Quick Actions
              </h2>
            </div>
            <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button variant="outline" className="flex-col h-auto py-4">
                <FileText className="w-5 h-5 mb-2 text-teal-600 dark:text-cyan-400" />
                <span className="text-sm">View Transcript</span>
              </Button>
              <Button variant="outline" className="flex-col h-auto py-4">
                <ClipboardCheck className="w-5 h-5 mb-2 text-aqua-700 dark:text-aqua-400" />
                <span className="text-sm">Attendance Log</span>
              </Button>
              <Button variant="outline" className="flex-col h-auto py-4">
                <BookOpen className="w-5 h-5 mb-2 text-golden-600 dark:text-golden-400" />
                <span className="text-sm">Course Schedule</span>
              </Button>
              <Button variant="outline" className="flex-col h-auto py-4">
                <Users className="w-5 h-5 mb-2 text-caramel-600 dark:text-caramel-400" />
                <span className="text-sm">Contact Guardian</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

