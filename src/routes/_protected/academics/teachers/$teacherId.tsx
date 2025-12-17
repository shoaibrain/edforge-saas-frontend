/**
 * Teacher Detail Page
 * 
 * Displays comprehensive teacher profile including:
 * - Personal information
 * - Teaching assignments
 * - Certifications
 * - Schedule overview
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
  Award,
  Briefcase,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Clock,
  Users,
  Building2,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/academics/teachers/$teacherId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'teachers', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: TeacherDetailPage,
})

// Mock teacher data
const MOCK_TEACHER = {
  id: 'teacher-001',
  firstName: 'Dr. Sarah',
  lastName: 'Mitchell',
  email: 'sarah.mitchell@school.edu',
  phone: '(555) 234-5678',
  dateOfBirth: '1985-03-22',
  gender: 'Female',
  employeeId: 'TCH-2024-001',
  hireDate: '2018-08-15',
  department: 'Science',
  status: 'active' as const,
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

function TeacherDetailPage() {
  const { teacherId: _teacherId } = Route.useParams()
  // TODO: Fetch teacher data using _teacherId
  const teacher = MOCK_TEACHER

  const statusColors = {
    active: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    inactive: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
    on_leave: 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/academics/teachers"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teachers
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
            name={`${teacher.firstName} ${teacher.lastName}`} 
            size="xl" 
            shape="rounded" 
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {teacher.firstName} {teacher.lastName}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[teacher.status]}`}>
                {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
              </span>
            </div>
            <p className="text-[rgb(var(--text-secondary))]">
              {teacher.department} Department
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Employee ID: {teacher.employeeId}
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
          label="Total Students"
          value={teacher.stats.totalStudents}
          icon={Users}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Classes/Week"
          value={teacher.stats.classesPerWeek}
          icon={BookOpen}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Years Experience"
          value={teacher.stats.yearsExperience}
          icon={Briefcase}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Avg Rating"
          value={teacher.stats.avgRating}
          suffix="/5"
          icon={Award}
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
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div className="space-y-1">
                <InfoRow icon={Mail} label="Email" value={teacher.email} />
                <InfoRow icon={Phone} label="Phone" value={teacher.phone} />
                <InfoRow icon={Calendar} label="Date of Birth" value={new Date(teacher.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={User} label="Gender" value={teacher.gender} />
              </div>
              <div className="space-y-1">
                <InfoRow icon={MapPin} label="Address" value={`${teacher.address.street}, ${teacher.address.city}, ${teacher.address.state} ${teacher.address.zipCode}`} />
                <InfoRow icon={Clock} label="Hire Date" value={new Date(teacher.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={Building2} label="Department" value={teacher.department} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Certifications
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {teacher.certifications.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-golden-400/20 flex-shrink-0">
                    <Award className="w-4 h-4 text-golden-600 dark:text-golden-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{cert.name}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{cert.issuer} • {cert.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Current Classes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Current Classes
              </h2>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {teacher.currentClasses.map((cls, idx) => (
                <div key={idx} className="p-5 flex items-center justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-teal-500/15 dark:bg-cyan-500/20">
                      <GraduationCap className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{cls.name}</p>
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">{cls.grade}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{cls.students} students</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{cls.schedule}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

