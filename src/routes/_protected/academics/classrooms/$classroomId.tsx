/**
 * Classroom Detail Page
 * 
 * Displays classroom information including:
 * - Room details and capacity
 * - Assigned classes/schedule
 * - Equipment and resources
 */

import { createFileRoute, redirect, Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { useState } from 'react'
import {
  MapPin,
  Users,
  Monitor,
  Wifi,
  Projector,
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Clock,
  BookOpen,
  Building2,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export const Route = createFileRoute('/_protected/academics/classrooms/$classroomId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'classrooms', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ClassroomDetailPage,
})

// Mock classroom data
const MOCK_CLASSROOM = {
  id: 'room-001',
  name: 'Room 101',
  building: 'Main Building',
  floor: '1st Floor',
  capacity: 35,
  currentOccupancy: 28,
  type: 'Standard Classroom',
  status: 'active' as const,
  equipment: [
    { name: 'Smart Board', status: 'operational' },
    { name: 'Projector', status: 'operational' },
    { name: 'Computer Station', status: 'operational' },
    { name: 'Wi-Fi Access Point', status: 'operational' },
  ],
  schedule: [
    { time: '8:00 AM - 9:00 AM', class: 'Mathematics 101', teacher: 'Mr. Johnson', days: 'Mon, Wed, Fri' },
    { time: '9:30 AM - 10:30 AM', class: 'English Literature', teacher: 'Ms. Davis', days: 'Mon, Wed, Fri' },
    { time: '11:00 AM - 12:00 PM', class: 'History 201', teacher: 'Dr. Smith', days: 'Tue, Thu' },
    { time: '1:00 PM - 2:00 PM', class: 'Biology 101', teacher: 'Dr. Mitchell', days: 'Mon, Wed, Fri' },
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
  icon: typeof MapPin
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
// MAIN COMPONENT
// ============================================================================

function ClassroomDetailPage() {
  const { classroomId: _classroomId } = Route.useParams()
  // TODO: Fetch classroom data using _classroomId
  const classroom = MOCK_CLASSROOM

  const statusColors = {
    active: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    maintenance: 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
    inactive: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
  }

  const equipmentIcons: Record<string, typeof Monitor> = {
    'Smart Board': Monitor,
    'Projector': Projector,
    'Computer Station': Monitor,
    'Wi-Fi Access Point': Wifi,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/academics/classrooms"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Classrooms
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/15 to-cyan-500/10 dark:from-teal-500/20 dark:to-cyan-500/15 border border-teal-500/20">
            <MapPin className="w-8 h-8 text-teal-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {classroom.name}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[classroom.status]}`}>
                {classroom.status.charAt(0).toUpperCase() + classroom.status.slice(1)}
              </span>
            </div>
            <p className="text-[rgb(var(--text-secondary))]">
              {classroom.building} • {classroom.floor}
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {classroom.type}
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
          label="Capacity"
          value={classroom.capacity}
          icon={Users}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Current Use"
          value={classroom.currentOccupancy}
          icon={Users}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Classes/Week"
          value={classroom.schedule.length * 3}
          icon={BookOpen}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Equipment"
          value={classroom.equipment.length}
          icon={Monitor}
          iconBg="bg-vanilla-400/30 dark:bg-vanilla-400/20"
          iconColor="text-vanilla-700 dark:text-vanilla-500"
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Weekly Schedule
              </h2>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {classroom.schedule.map((slot, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                      <Clock className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </div>
                    <div>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{slot.class}</p>
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">{slot.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{slot.time}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{slot.days}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Equipment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Equipment & Resources
              </h2>
            </div>
            <div className="p-5 space-y-3">
              {classroom.equipment.map((item, idx) => {
                const Icon = equipmentIcons[item.name] || Monitor
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      <span className="text-sm font-medium text-[rgb(var(--text-primary))]">{item.name}</span>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-aqua-400/20 text-aqua-700 dark:text-aqua-400">
                      {item.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Location Info */}
          <Card className="mt-4">
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Location
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <span className="text-sm text-[rgb(var(--text-primary))]">{classroom.building}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                <span className="text-sm text-[rgb(var(--text-primary))]">{classroom.floor}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

