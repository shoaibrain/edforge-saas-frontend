/**
 * Staff Member Detail Page
 * 
 * Displays staff profile including:
 * - Personal information
 * - Department and role
 * - Employment details
 * - Attendance summary
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
  Briefcase,
  Building2,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Clock,
  Award,
  DollarSign,
  ClipboardCheck,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/people/staff/$staffId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: StaffDetailPage,
})

// Mock staff data
const MOCK_STAFF = {
  id: 'staff-001',
  firstName: 'Jennifer',
  lastName: 'Adams',
  email: 'jennifer.adams@school.edu',
  phone: '(555) 345-6789',
  dateOfBirth: '1988-07-12',
  gender: 'Female',
  employeeId: 'STF-2024-001',
  hireDate: '2020-03-15',
  department: 'Administration',
  position: 'Office Manager',
  status: 'active' as const,
  address: {
    street: '789 Pine Road',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62703',
  },
  stats: {
    yearsAtSchool: 4,
    attendanceRate: 98.5,
    daysOff: 3,
    overtimeHours: 12,
  },
  emergencyContact: {
    name: 'Michael Adams',
    relationship: 'Spouse',
    phone: '(555) 876-5432',
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

function StaffDetailPage() {
  const { staffId: _staffId } = Route.useParams()
  // TODO: Fetch staff data using _staffId
  const staff = MOCK_STAFF

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
          to="/people/staff"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff
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
            name={`${staff.firstName} ${staff.lastName}`} 
            size="xl" 
            shape="rounded" 
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {staff.firstName} {staff.lastName}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[staff.status]}`}>
                {staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}
              </span>
            </div>
            <p className="text-[rgb(var(--text-secondary))]">
              {staff.position}
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Employee ID: {staff.employeeId}
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
          label="Years at School"
          value={staff.stats.yearsAtSchool}
          icon={Award}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Attendance Rate"
          value={staff.stats.attendanceRate}
          suffix="%"
          icon={ClipboardCheck}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Days Off (YTD)"
          value={staff.stats.daysOff}
          icon={Calendar}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Overtime (hrs)"
          value={staff.stats.overtimeHours}
          icon={Clock}
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
                <InfoRow icon={Mail} label="Email" value={staff.email} />
                <InfoRow icon={Phone} label="Phone" value={staff.phone} />
                <InfoRow icon={Calendar} label="Date of Birth" value={new Date(staff.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={User} label="Gender" value={staff.gender} />
              </div>
              <div className="space-y-1">
                <InfoRow icon={MapPin} label="Address" value={`${staff.address.street}, ${staff.address.city}, ${staff.address.state} ${staff.address.zipCode}`} />
                <InfoRow icon={Clock} label="Hire Date" value={new Date(staff.hireDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                <InfoRow icon={Building2} label="Department" value={staff.department} />
                <InfoRow icon={Briefcase} label="Position" value={staff.position} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Emergency Contact
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={staff.emergencyContact.name} size="md" />
                <div>
                  <p className="font-medium text-[rgb(var(--text-primary))]">{staff.emergencyContact.name}</p>
                  <p className="text-sm text-[rgb(var(--text-tertiary))]">{staff.emergencyContact.relationship}</p>
                </div>
              </div>
              <div className="border-t border-[rgb(var(--border-secondary))] pt-4">
                <InfoRow icon={Phone} label="Phone" value={staff.emergencyContact.phone} />
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-4">
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ClipboardCheck className="w-4 h-4 mr-3" />
                View Attendance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-3" />
                Payroll Info
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-3" />
                Leave Requests
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

