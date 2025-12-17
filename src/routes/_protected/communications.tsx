/**
 * Meeting Hub - Communications Module
 * 
 * Integration-focused hub for connecting video conferencing platforms
 * (Google Meet, Zoom, Microsoft Teams) and managing scheduled meetings.
 */

import { createFileRoute, Outlet, useMatches } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Video,
  Plus,
  Link as LinkIcon,
  Calendar,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useIntegrationsStore } from '@/stores/integrations.store'
import {
  getVideoPlatforms,
  getCalendarPlatforms,
  type MeetingPlatformId,
} from '@/lib/meeting-integrations'
import {
  IntegrationCard,
  ConnectionWizard,
  ScheduledMeetingsList,
} from '@/components/meetings'

export const Route = createFileRoute('/_protected/communications')({
  component: CommunicationsLayout,
})

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

function CommunicationsLayout() {
  const matches = useMatches()
  const isExactRoute = matches[matches.length - 1]?.routeId === '/_protected/communications'
  
  if (isExactRoute) {
    return (
      <>
        <MeetingHubPage />
        <ConnectionWizard />
      </>
    )
  }
  
  return (
    <>
      <Outlet />
      <ConnectionWizard />
    </>
  )
}

// ============================================================================
// MEETING HUB PAGE
// ============================================================================

function MeetingHubPage() {
  const {
    connectedIntegrations,
    openWizard,
    disconnectIntegration,
  } = useIntegrationsStore()
  
  const videoPlatforms = getVideoPlatforms()
  const calendarPlatforms = getCalendarPlatforms()
  
  const connectedCount = connectedIntegrations.filter(i => i.status === 'connected').length
  const totalPlatforms = videoPlatforms.length + calendarPlatforms.length
  
  const getIntegration = (platformId: MeetingPlatformId) =>
    connectedIntegrations.find(i => i.platformId === platformId)
  
  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-12">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-violet-500/10 dark:bg-violet-400/15 flex items-center justify-center">
            <Video className="w-7 h-7 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[rgb(var(--text-primary))]">
              Meeting Hub
            </h1>
            <p className="text-[rgb(var(--text-secondary))] mt-1">
              Connect your video conferencing tools and manage meetings
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => openWizard()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 dark:bg-cyan-600 text-white font-medium hover:bg-teal-700 dark:hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Integration
          </button>
        </div>
      </motion.header>

      {/* ================================================================== */}
      {/* CONNECTION STATUS CARD */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/5 via-transparent to-teal-500/5 dark:from-violet-500/10 dark:to-cyan-500/10 border border-[rgb(var(--border-primary))]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 dark:bg-violet-400/20 flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="font-semibold text-[rgb(var(--text-primary))]">
                  Integration Status
                </h2>
                <p className="text-sm text-[rgb(var(--text-secondary))]">
                  {connectedCount} of {totalPlatforms} platforms connected
                </p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 rounded-full bg-[rgb(var(--surface-tertiary))] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(connectedCount / totalPlatforms) * 100}%` }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-500 dark:from-violet-400 dark:to-cyan-400"
                />
              </div>
              <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                {Math.round((connectedCount / totalPlatforms) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* VIDEO CONFERENCING PLATFORMS */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Video className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
            Video Conferencing
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videoPlatforms.map((platform, index) => (
            <IntegrationCard
              key={platform.id}
              platform={platform}
              integration={getIntegration(platform.id)}
              index={index}
              onConnect={() => openWizard(platform.id)}
              onManage={() => {/* TODO: Open settings */}}
              onDisconnect={() => disconnectIntegration(platform.id)}
            />
          ))}
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* CALENDAR SERVICES */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h2 className="text-sm font-medium text-[rgb(var(--text-secondary))] uppercase tracking-wider">
            Calendar Services
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendarPlatforms.map((platform, index) => (
            <IntegrationCard
              key={platform.id}
              platform={platform}
              integration={getIntegration(platform.id)}
              index={index}
              onConnect={() => openWizard(platform.id)}
              onManage={() => {/* TODO: Open settings */}}
              onDisconnect={() => disconnectIntegration(platform.id)}
            />
          ))}
        </div>
      </motion.section>

      {/* ================================================================== */}
      {/* SCHEDULED MEETINGS */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <ScheduledMeetingsList maxItems={5} />
      </motion.section>

      {/* ================================================================== */}
      {/* GOOGLE FOR EDUCATION CALLOUT */}
      {/* ================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="p-6 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4285F4]/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-[#4285F4]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-1">
                Google Workspace for Education
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
                EdForge integrates seamlessly with Google Workspace for Education. 
                Connect Google Meet for virtual classrooms, Google Calendar for scheduling, 
                and access the full suite of Google's education tools.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-[#00897B]/10 text-[#00897B] text-xs font-medium">
                  Google Meet
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#4285F4]/10 text-[#4285F4] text-xs font-medium">
                  Google Calendar
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#FBBC04]/10 text-[#F9AB00] text-xs font-medium">
                  Google Classroom
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#EA4335]/10 text-[#EA4335] text-xs font-medium">
                  Gmail
                </span>
              </div>
            </div>
            <a
              href="https://edu.google.com/workspace-for-education/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-colors"
            >
              Learn more
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </motion.section>
    </div>
  )
}
