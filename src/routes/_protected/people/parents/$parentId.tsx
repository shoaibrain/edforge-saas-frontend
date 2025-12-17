/**
 * Parent/Guardian Detail Page
 * 
 * Displays guardian profile including:
 * - Personal information
 * - Associated students (children)
 * - Contact information
 * - Communication history
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
  ArrowLeft,
  Edit,
  MoreHorizontal,
  Users,
  GraduationCap,
  MessageSquare,
  CreditCard,
  Bell,
} from 'lucide-react'
import { can } from '@/lib/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

export const Route = createFileRoute('/_protected/people/parents/$parentId')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState()
    const { activeSchoolId } = useAppStore.getState()

    if (!can(user, { action: 'view', resource: 'parents', schoolId: activeSchoolId ?? undefined })) {
      throw redirect({ to: '/forbidden' })
    }
  },
  component: ParentDetailPage,
})

// Mock parent data
const MOCK_PARENT = {
  id: 'parent-001',
  firstName: 'Robert',
  lastName: 'Thompson',
  email: 'robert.thompson@email.com',
  phone: '(555) 987-6543',
  alternatePhone: '(555) 123-4567',
  occupation: 'Software Engineer',
  employer: 'Tech Corp Inc.',
  status: 'active' as const,
  address: {
    street: '123 Oak Street',
    city: 'Springfield',
    state: 'IL',
    zipCode: '62701',
  },
  children: [
    { id: 'student-001', name: 'Emma Thompson', grade: '8th Grade', status: 'active' },
    { id: 'student-002', name: 'Lucas Thompson', grade: '5th Grade', status: 'active' },
  ],
  stats: {
    childrenEnrolled: 2,
    messagesThisMonth: 5,
    feesOutstanding: 250,
    eventsAttended: 8,
  },
  preferredContact: 'email',
  communicationPreferences: {
    email: true,
    sms: true,
    push: false,
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
  prefix,
}: { 
  label: string
  value: string | number
  icon: typeof User
  iconBg: string
  iconColor: string
  prefix?: string
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
              {prefix}{value}
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

function ParentDetailPage() {
  const { parentId: _parentId } = Route.useParams()
  // TODO: Fetch parent data using _parentId
  const parent = MOCK_PARENT

  const statusColors = {
    active: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    inactive: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back Navigation */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/people/parents"
          className="inline-flex items-center gap-2 text-sm text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Parents
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
            name={`${parent.firstName} ${parent.lastName}`} 
            size="xl" 
            shape="rounded" 
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                {parent.firstName} {parent.lastName}
              </h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[parent.status]}`}>
                {parent.status.charAt(0).toUpperCase() + parent.status.slice(1)}
              </span>
            </div>
            <p className="text-[rgb(var(--text-secondary))]">
              Parent / Guardian
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              {parent.occupation} at {parent.employer}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
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
          label="Children Enrolled"
          value={parent.stats.childrenEnrolled}
          icon={Users}
          iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
          iconColor="text-teal-600 dark:text-cyan-400"
        />
        <StatCard
          label="Messages (Month)"
          value={parent.stats.messagesThisMonth}
          icon={MessageSquare}
          iconBg="bg-aqua-400/20"
          iconColor="text-aqua-700 dark:text-aqua-400"
        />
        <StatCard
          label="Fees Outstanding"
          value={parent.stats.feesOutstanding}
          prefix="$"
          icon={CreditCard}
          iconBg="bg-golden-400/20"
          iconColor="text-golden-600 dark:text-golden-400"
        />
        <StatCard
          label="Events Attended"
          value={parent.stats.eventsAttended}
          icon={Bell}
          iconBg="bg-vanilla-400/30 dark:bg-vanilla-400/20"
          iconColor="text-vanilla-700 dark:text-vanilla-500"
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Contact Information
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div className="space-y-1">
                <InfoRow icon={Mail} label="Email" value={parent.email} />
                <InfoRow icon={Phone} label="Primary Phone" value={parent.phone} />
                <InfoRow icon={Phone} label="Alternate Phone" value={parent.alternatePhone} />
              </div>
              <div className="space-y-1">
                <InfoRow icon={MapPin} label="Address" value={`${parent.address.street}, ${parent.address.city}, ${parent.address.state} ${parent.address.zipCode}`} />
                <InfoRow icon={User} label="Occupation" value={parent.occupation} />
                <InfoRow icon={User} label="Employer" value={parent.employer} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Communication Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Communication
              </h2>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Email</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${parent.communicationPreferences.email ? 'bg-aqua-400/20 text-aqua-700' : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'}`}>
                  {parent.communicationPreferences.email ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">SMS</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${parent.communicationPreferences.sms ? 'bg-aqua-400/20 text-aqua-700' : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'}`}>
                  {parent.communicationPreferences.sms ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm text-[rgb(var(--text-primary))]">Push</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${parent.communicationPreferences.push ? 'bg-aqua-400/20 text-aqua-700' : 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]'}`}>
                  {parent.communicationPreferences.push ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Children */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Children / Students
              </h2>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {parent.children.map((child) => (
                <Link
                  key={child.id}
                  to="/academics/students/$studentId"
                  params={{ studentId: child.id }}
                  className="flex items-center justify-between p-5 hover:bg-[rgb(var(--interactive-hover))] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar name={child.name} size="md" />
                    <div>
                      <p className="font-medium text-[rgb(var(--text-primary))]">{child.name}</p>
                      <p className="text-sm text-[rgb(var(--text-tertiary))]">{child.grade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[child.status as keyof typeof statusColors]}`}>
                      {child.status.charAt(0).toUpperCase() + child.status.slice(1)}
                    </span>
                    <GraduationCap className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

