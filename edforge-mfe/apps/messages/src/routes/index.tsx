
/**
 * Messages Overview Hub
 * 
 * Central dashboard for all communications.
 * Integrates with external tools and provides a high-level view.
 */

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  MessageCircleMore,
  Video,
  Calendar,
  Slack,
  Mail,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react'
// NOTE: Auth is handled by Shell's protected routes - remotes inherit auth from Shell
import { useAppStore } from '@/stores/app.store'
import { Card } from '@edforge/ui'
import { Button } from '@edforge/ui'

export default function MessagesOverviewPage() {
  const { activeSchoolId } = useAppStore()

  // NOTE: Auth/ABAC checks removed - Shell's protected routes handle authentication
  // Remote modules should NOT perform independent redirect logic
  console.log('[Messages:Overview] Rendering messages overview, activeSchoolId:', activeSchoolId)
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}


      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Unread Messages"
          value="12"
          icon={Mail}
          trend="+4 today"
          color="teal"
          delay={0.1}
          href="/inbox"
        />
        <StatCard
          title="Upcoming Meetings"
          value="3"
          icon={Video}
          trend="Next at 2:00 PM"
          color="cyan"
          delay={0.2}
          href="/meetings"
        />
        <StatCard
          title="Avg. Response Time"
          value="45m"
          icon={Clock}
          trend="-15m vs last week"
          color="indigo"
          delay={0.3}
          href="/analytics"
          external
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area - 2 Columns */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Activity / Inbox Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">Recent Conversations</h2>
              <Link to="/inbox" className="text-sm text-teal-600 dark:text-cyan-400 font-medium hover:underline flex items-center">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>

            <Card className="divide-y divide-[rgb(var(--border-secondary))] overflow-hidden">
              <InboxRow
                name="Sarah Mitchell"
                role="Principal"
                message="Please review the Q3 attendance report when you have a chance."
                time="10:30 AM"
                unread
              />
              <InboxRow
                name="Robert Thompson"
                role="Parent"
                message="Thank you for the update on Emma's progress."
                time="Yesterday"
                unread={false}
              />
              <InboxRow
                name="Math Department"
                role="Group"
                message="Meeting agenda for tomorrow's curriculum review."
                time="Yesterday"
                unread={false}
              />
            </Card>
          </motion.div>

          {/* Connected Tools */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))] mb-4">Connected Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IntegrationCard
                name="Google Meet"
                description="Video conferencing for remote classes"
                icon={<Video className="w-6 h-6 text-white" />}
                iconBg="bg-blue-500"
                connected
              />
              <IntegrationCard
                name="Google Calendar"
                description="Sync your class schedules and events"
                icon={<Calendar className="w-6 h-6 text-white" />}
                iconBg="bg-green-500"
                connected
              />
              <IntegrationCard
                name="Slack"
                description="Team communication and notifications"
                icon={<Slack className="w-6 h-6 text-white" />}
                iconBg="bg-purple-500"
                connected={false}
              />
              <IntegrationCard
                name="Microsoft Teams"
                description="Collaboration platform for staff"
                icon={<MessageCircleMore className="w-6 h-6 text-white" />}
                iconBg="bg-indigo-500"
                connected={false}
              />
            </div>
          </motion.div>
        </div>

        {/* Sidebar Area - 1 Column */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-teal-500/20">
              <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">EdForge Connect</h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
                Seamlessly integrate your preferred communication tools. EdForge works with the platforms you already use.
              </p>
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white dark:bg-cyan-600 dark:hover:bg-cyan-700">
                Browse Integrations
              </Button>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2 text-[rgb(var(--text-tertiary))]" />
                Email Parents
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <MessageCircleMore className="w-4 h-4 mr-2 text-[rgb(var(--text-tertiary))]" />
                Staff Announcement
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2 text-[rgb(var(--text-tertiary))]" />
                Start Instant Meeting
              </Button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  delay,
  href
}: {
  title: string
  value: string
  icon: any
  trend: string
  color: string
  delay: number
  href: string
  external?: boolean
}) {
  const content = (
    <Card className="p-5 hover:border-teal-500/30 transition-all cursor-pointer h-full">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        {href && <ArrowRight className="w-4 h-4 text-[rgb(var(--text-tertiary))] opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-[rgb(var(--text-primary))]">{value}</h3>
        <p className="text-sm font-medium text-[rgb(var(--text-secondary))]">{title}</p>
        <p className="text-xs text-[rgb(var(--text-tertiary))] mt-1">{trend}</p>
      </div>
    </Card>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      {external ? (
        <a href={href} className="block group">
          {content}
        </a>
      ) : (
        <Link to={href} className="block group">
          {content}
        </Link>
      )}
    </motion.div>
  )
}

function InboxRow({ name, role, message, time, unread }: { name: string; role: string; message: string; time: string; unread: boolean }) {
  return (
    <Link to="/inbox" className="block hover:bg-[rgb(var(--interactive-hover))] transition-colors">
      <div className="p-4 flex items-center gap-4">
        <div className={`w-2 h-2 rounded-full ${unread ? 'bg-teal-500' : 'bg-transparent'}`} />
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center font-medium text-[rgb(var(--text-secondary))]">
          {name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className={`text-sm ${unread ? 'font-semibold text-[rgb(var(--text-primary))]' : 'font-medium text-[rgb(var(--text-secondary))]'}`}>
                {name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]">
                {role}
              </span>
            </div>
            <span className="text-xs text-[rgb(var(--text-tertiary))]">{time}</span>
          </div>
          <p className={`text-sm truncate ${unread ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-tertiary))]'}`}>
            {message}
          </p>
        </div>
      </div>
    </Link>
  )
}

function IntegrationCard({ name, description, icon, iconBg, connected }: { name: string; description: string; icon: any; iconBg: string; connected: boolean }) {
  return (
    <Card className="p-4 flex items-center gap-4 hover:border-teal-500/30 transition-colors cursor-pointer">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg shadow-black/5`}>
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-[rgb(var(--text-primary))]">{name}</h4>
        <p className="text-xs text-[rgb(var(--text-secondary))] line-clamp-1">{description}</p>
      </div>
      {connected ? (
        <div className="p-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      ) : (
        <Button variant="ghost" size="sm" className="text-teal-600 dark:text-cyan-400">
          Connect
        </Button>
      )}
    </Card>
  )
}
