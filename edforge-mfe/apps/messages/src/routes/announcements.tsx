/**
 * Announcements Page
 * 
 * Manage school-wide and targeted announcements with:
 * - Announcement list with filters
 * - Create new announcement
 * - Schedule announcements
 * - Target specific audiences
 */


import { useState, Fragment } from 'react'
import { motion } from 'framer-motion'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import {
  Megaphone,
  Search,
  MoreHorizontal,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Send,
  Clock,
} from 'lucide-react'
import { can } from '@edforge/abac'
import { useAppStore } from '@/stores/app.store'
import { useAuthStore } from '@/stores/auth.store'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'



// Mock announcements data
const MOCK_ANNOUNCEMENTS = [
  {
    id: 'ann-001',
    title: 'Spring Break Schedule Update',
    content: 'Please note that spring break has been extended by one day. Classes will resume on Monday, April 8th.',
    author: 'Dr. Sarah Mitchell',
    audience: 'All Students & Parents',
    createdAt: '2024-03-15T10:30:00',
    scheduledFor: null,
    status: 'published' as const,
    views: 1247,
    priority: 'high' as const,
  },
  {
    id: 'ann-002',
    title: 'Parent-Teacher Conference Registration',
    content: 'Registration for spring parent-teacher conferences is now open. Please sign up for your preferred time slot.',
    author: 'James Wilson',
    audience: 'Parents',
    createdAt: '2024-03-14T14:00:00',
    scheduledFor: null,
    status: 'published' as const,
    views: 856,
    priority: 'normal' as const,
  },
  {
    id: 'ann-003',
    title: 'End of Year Exam Schedule',
    content: 'The final exam schedule for the 2023-2024 academic year has been released. Please check the attached document.',
    author: 'Academic Office',
    audience: 'All Students',
    createdAt: '2024-03-13T09:15:00',
    scheduledFor: '2024-03-20T08:00:00',
    status: 'scheduled' as const,
    views: 0,
    priority: 'high' as const,
  },
  {
    id: 'ann-004',
    title: 'New Library Resources Available',
    content: 'We have added 500+ new digital resources to the school library. Students can access them through the portal.',
    author: 'Library Staff',
    audience: 'Teachers & Students',
    createdAt: '2024-03-12T11:45:00',
    scheduledFor: null,
    status: 'draft' as const,
    views: 0,
    priority: 'low' as const,
  },
]

// ============================================================================
// ANNOUNCEMENT CARD
// ============================================================================

function AnnouncementCard({ announcement }: { announcement: typeof MOCK_ANNOUNCEMENTS[0] }) {
  const statusColors = {
    published: 'bg-aqua-400/20 text-aqua-700 dark:text-aqua-400',
    scheduled: 'bg-golden-400/20 text-golden-600 dark:text-golden-400',
    draft: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
  }

  const priorityColors = {
    high: 'border-l-rust-500',
    normal: 'border-l-teal-500 dark:border-l-cyan-500',
    low: 'border-l-[rgb(var(--border-primary))]',
  }

  return (
    <Card className={`border-l-4 ${priorityColors[announcement.priority]} hover:shadow-md transition-shadow`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[announcement.status]}`}>
                {announcement.status.charAt(0).toUpperCase() + announcement.status.slice(1)}
              </span>
              {announcement.priority === 'high' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-rust-400/20 text-rust-600 dark:text-rust-400">
                  High Priority
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
              {announcement.title}
            </h3>
            <p className="text-sm text-[rgb(var(--text-secondary))] line-clamp-2 mb-4">
              {announcement.content}
            </p>
            <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-tertiary))]">
              <div className="flex items-center gap-1.5">
                <Avatar name={announcement.author} size="xs" />
                <span>{announcement.author}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{announcement.audience}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
              {announcement.status === 'published' && (
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{announcement.views.toLocaleString()} views</span>
                </div>
              )}
              {announcement.scheduledFor && (
                <div className="flex items-center gap-1 text-golden-600 dark:text-golden-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled: {new Date(announcement.scheduledFor).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <Menu as="div" className="relative">
            <MenuButton className="p-2 rounded-lg hover:bg-[rgb(var(--interactive-hover))] transition-colors">
              <MoreHorizontal className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            </MenuButton>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <MenuItems className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-lg py-1">
                <MenuItem>
                  {({ active }) => (
                    <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                      <Eye className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      View
                    </button>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                      <Edit className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                      Edit
                    </button>
                  )}
                </MenuItem>
                {announcement.status === 'draft' && (
                  <MenuItem>
                    {({ active }) => (
                      <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''} text-[rgb(var(--text-primary))]`}>
                        <Send className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
                        Publish
                      </button>
                    )}
                  </MenuItem>
                )}
                <div className="border-t border-[rgb(var(--border-secondary))] my-1" />
                <MenuItem>
                  {({ active }) => (
                    <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''} text-rust-600 dark:text-rust-400`}>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </MenuItem>
              </MenuItems>
            </Transition>
          </Menu>
        </div>
      </div>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AnnouncementsPage() {
  const { user } = useAuthStore()
  const { activeSchoolId } = useAppStore()

  if (!can(user, { action: 'view', resource: 'staff', schoolId: activeSchoolId ?? undefined })) {
    return <div className="p-8">Access Denied</div>
  }
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all')

  const filteredAnnouncements = MOCK_ANNOUNCEMENTS.filter(ann => {
    const matchesSearch = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ann.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: MOCK_ANNOUNCEMENTS.length,
    published: MOCK_ANNOUNCEMENTS.filter(a => a.status === 'published').length,
    scheduled: MOCK_ANNOUNCEMENTS.filter(a => a.status === 'scheduled').length,
    draft: MOCK_ANNOUNCEMENTS.filter(a => a.status === 'draft').length,
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">


      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] rounded-xl text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500/50 transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 p-1 bg-[rgb(var(--surface-tertiary))] rounded-xl border border-[rgb(var(--border-primary))]">
          {(['all', 'published', 'scheduled', 'draft'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === status
                ? 'bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] shadow-sm'
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))]'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-60">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Announcements List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {filteredAnnouncements.length === 0 ? (
          <Card className="p-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-50" />
            <p className="text-lg font-medium text-[rgb(var(--text-secondary))]">No announcements found</p>
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
              Try adjusting your search or filter criteria
            </p>
          </Card>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <AnnouncementCard key={announcement.id} announcement={announcement} />
          ))
        )}
      </motion.div>
    </div>
  )
}

