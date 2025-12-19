/**
 * Parent Portal Module Layout
 * 
 * A dedicated portal for parents/guardians to:
 * - View their children's academic progress
 * - Check attendance records
 * - Track fee payments
 * - Communicate with teachers
 */

import { createFileRoute, Outlet, useMatches, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  Calendar,
  Bell,
  ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/auth.store'

export const Route = createFileRoute('/_protected/parent-portal')({
  component: ParentPortalLayout,
})

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

function ParentPortalLayout() {
  const matches = useMatches()
  const isExactRoute = matches[matches.length - 1]?.routeId === '/_protected/parent-portal'

  if (isExactRoute) {
    return <ParentPortalPage />
  }

  return <Outlet />
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CHILDREN = [
  {
    id: 'student-001',
    name: 'Emma Thompson',
    grade: '8th Grade',
    section: 'A',
    avatar: null,
    gpa: 3.8,
    attendanceRate: 96.5,
    upcomingAssignments: 3,
    pendingFees: 150,
  },
  {
    id: 'student-002',
    name: 'Lucas Thompson',
    grade: '5th Grade',
    section: 'B',
    avatar: null,
    gpa: 3.5,
    attendanceRate: 94.2,
    upcomingAssignments: 2,
    pendingFees: 0,
  },
]

const MOCK_RECENT_ACTIVITY = [
  { id: 1, type: 'grade', message: 'Emma received A- on Biology Midterm', time: '2 hours ago' },
  { id: 2, type: 'attendance', message: 'Lucas was marked present today', time: '4 hours ago' },
  { id: 3, type: 'message', message: 'New message from Dr. Sarah Mitchell', time: '1 day ago' },
  { id: 4, type: 'fee', message: 'Lab fee payment due for Emma', time: '2 days ago' },
  { id: 5, type: 'event', message: 'Parent-Teacher Conference scheduled', time: '3 days ago' },
]

const MOCK_ANNOUNCEMENTS = [
  { id: 1, title: 'Spring Break Schedule Update', date: '2024-03-15', priority: 'high' },
  { id: 2, title: 'Parent-Teacher Conference Registration', date: '2024-03-14', priority: 'normal' },
  { id: 3, title: 'New Library Resources Available', date: '2024-03-12', priority: 'low' },
]

// ============================================================================
// CHILD CARD COMPONENT
// ============================================================================

function ChildCard({ child }: { child: typeof MOCK_CHILDREN[0] }) {
  const [hovered, setHovered] = useState(false)

  const springProps = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -4 : 0,
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
      <Card className="p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <Avatar name={child.name} size="lg" shape="rounded" />
            <div>
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{child.name}</h3>
              <p className="text-sm text-[rgb(var(--text-tertiary))]">{child.grade} • Section {child.section}</p>
            </div>
          </div>
          {child.pendingFees > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rust-100 dark:bg-rust-900/30 text-rust-600 dark:text-rust-400 text-xs font-semibold">
              ${child.pendingFees} due
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{child.gpa.toFixed(1)}</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">GPA</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{child.attendanceRate}%</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">Attendance</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">{child.upcomingAssignments}</p>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">Upcoming</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link to="/parent-portal/grades" search={{ studentId: child.id }}>
            <Button variant="outline" size="sm" className="w-full">
              <GraduationCap className="w-4 h-4 mr-2" />
              Grades
            </Button>
          </Link>
          <Link to="/parent-portal/attendance" search={{ studentId: child.id }}>
            <Button variant="outline" size="sm" className="w-full">
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Attendance
            </Button>
          </Link>
        </div>
      </Card>
    </animated.div>
  )
}

// ============================================================================
// QUICK ACTION CARD
// ============================================================================

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  iconBg,
  iconColor,
}: {
  icon: typeof Users
  title: string
  description: string
  href: string
  iconBg: string
  iconColor: string
}) {
  return (
    <Link to={href}>
      <Card className="p-4 h-full hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start gap-3">
          <div className={`p-2.5 rounded-xl ${iconBg} group-hover:scale-105 transition-transform`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-[rgb(var(--text-primary))] group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-0.5">{description}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--text-primary))] transition-colors" />
        </div>
      </Card>
    </Link>
  )
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function ParentPortalPage() {
  const user = useAuthStore((s) => s.user)
  const parentName = user?.name ?? 'Parent'

  const activityIcons: Record<string, typeof GraduationCap> = {
    grade: GraduationCap,
    attendance: ClipboardCheck,
    message: MessageSquare,
    fee: CreditCard,
    event: Calendar,
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
          Welcome back, {parentName.split(' ')[0]}
        </h1>
        <p className="text-[rgb(var(--text-secondary))] mt-1">
          Stay connected with your children's education
        </p>
      </motion.div>

      {/* Children Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          Your Children
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_CHILDREN.map((child) => (
            <ChildCard key={child.id} child={child} />
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            icon={GraduationCap}
            title="View Grades"
            description="Academic progress & reports"
            href="/parent-portal/grades"
            iconBg="bg-teal-500/15 dark:bg-cyan-500/20"
            iconColor="text-teal-600 dark:text-cyan-400"
          />
          <QuickActionCard
            icon={ClipboardCheck}
            title="Attendance"
            description="Daily attendance records"
            href="/parent-portal/attendance"
            iconBg="bg-aqua-400/20"
            iconColor="text-aqua-700 dark:text-aqua-400"
          />
          <QuickActionCard
            icon={CreditCard}
            title="Fee Payments"
            description="View & pay pending fees"
            href="/parent-portal/fees"
            iconBg="bg-golden-400/20"
            iconColor="text-golden-600 dark:text-golden-400"
          />
          <QuickActionCard
            icon={MessageSquare}
            title="Messages"
            description="Contact teachers & staff"
            href="/messages"
            iconBg="bg-caramel-400/20"
            iconColor="text-caramel-600 dark:text-caramel-400"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Recent Activity
                </h2>
                <Button variant="ghost" size="sm">View All</Button>
              </div>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {MOCK_RECENT_ACTIVITY.map((activity) => {
                const Icon = activityIcons[activity.type] || Bell
                return (
                  <div key={activity.id} className="p-4 flex items-start gap-3 hover:bg-[rgb(var(--interactive-hover))] transition-colors">
                    <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
                      <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[rgb(var(--text-primary))]">{activity.message}</p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  School Announcements
                </h2>
                <Link to="/messages/announcements">
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </div>
            </div>
            <div className="divide-y divide-[rgb(var(--border-secondary))]">
              {MOCK_ANNOUNCEMENTS.map((announcement) => (
                <div key={announcement.id} className="p-4 flex items-start justify-between hover:bg-[rgb(var(--interactive-hover))] transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full ${announcement.priority === 'high' ? 'bg-rust-500' :
                      announcement.priority === 'normal' ? 'bg-golden-500' :
                        'bg-[rgb(var(--text-tertiary))]'
                      }`} />
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{announcement.title}</p>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
                        {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Upcoming Events */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <div className="p-5 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                Upcoming Events
              </h2>
              <Button variant="ghost" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
              </Button>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20">
              <p className="text-xs text-teal-600 dark:text-cyan-400 font-semibold mb-1">Mar 25-29</p>
              <p className="font-medium text-[rgb(var(--text-primary))]">Spring Break</p>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">No classes</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-golden-400/10 to-golden-500/5 border border-golden-500/20">
              <p className="text-xs text-golden-600 dark:text-golden-400 font-semibold mb-1">Apr 5</p>
              <p className="font-medium text-[rgb(var(--text-primary))]">Parent-Teacher Conference</p>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">Register now</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-aqua-400/10 to-aqua-500/5 border border-aqua-500/20">
              <p className="text-xs text-aqua-600 dark:text-aqua-400 font-semibold mb-1">Jun 3-7</p>
              <p className="font-medium text-[rgb(var(--text-primary))]">Final Exams</p>
              <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">End of semester</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

