/**
 * Settings Overview Page
 *
 * Google Account-style settings overview with:
 * - Profile header with avatar
 * - Search bar
 * - Quick action pills
 * - Settings category cards
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  User,
  Bell,
  Shield,
  Link2,
  Settings,
  CreditCard,
  Zap,
  Building2,
  Users,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react'
import { useShell } from '../../../lib/shell-context'
import { getUserAvatar } from '../../../lib/avatar'

// ============================================================================
// QUICK ACTION PILLS
// ============================================================================

interface QuickActionPill {
  id: string
  label: string
  icon: LucideIcon
  href: string
}

const QUICK_ACTIONS: QuickActionPill[] = [
  { id: 'profile', label: 'Edit profile', icon: User, href: '/settings/account' },
  { id: 'security', label: 'Security checkup', icon: Shield, href: '/settings/security' },
  { id: 'notifications', label: 'Manage notifications', icon: Bell, href: '/settings/notifications' },
  { id: 'connections', label: 'Connected apps', icon: Link2, href: '/settings/connections' },
]

// ============================================================================
// SETTINGS CATEGORIES
// ============================================================================

interface SettingsCategory {
  id: string
  title: string
  description: string
  icon: LucideIcon
  href: string
  items: string[]
}

const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'account',
    title: 'Personal Info',
    description: 'Basic info, like your name and email',
    icon: User,
    href: '/settings/account',
    items: ['Name', 'Email', 'Phone', 'Profile photo'],
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customize your experience',
    icon: Settings,
    href: '/settings/preferences',
    items: ['Theme', 'Language', 'Date format', 'Time zone'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Choose what you want to be notified about',
    icon: Bell,
    href: '/settings/notifications',
    items: ['Email alerts', 'Push notifications', 'SMS alerts'],
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Settings that help keep your account secure',
    icon: Shield,
    href: '/settings/security',
    items: ['Password', 'Two-factor auth', 'Session management'],
  },
  {
    id: 'organization',
    title: 'Organization',
    description: 'Manage your education organization hierarchy',
    icon: Building2,
    href: '/settings/organization',
    items: ['SEA & Districts', 'Schools', 'Service Centers'],
  },
  {
    id: 'users',
    title: 'Access Policy',
    description: 'Manage user access and permissions',
    icon: Users,
    href: '/settings/people',
    items: ['User roles', 'Permissions', 'Invitations'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect third-party services',
    icon: Zap,
    href: '/settings/integrations',
    items: ['Google Workspace', 'Microsoft 365', 'Ed-Fi'],
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Manage your subscription and payment',
    icon: CreditCard,
    href: '/settings/billing',
    items: ['Plan', 'Payment method', 'Invoices'],
  },
]

// ============================================================================
// QUICK ACTION PILL COMPONENT
// ============================================================================

interface QuickActionPillProps {
  action: QuickActionPill
  onClick: () => void
}

function QuickActionPillButton({ action, onClick }: QuickActionPillProps) {
  const Icon = action.icon
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-[rgb(var(--surface-tertiary))] hover:bg-[rgb(var(--interactive-hover))] border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus))] transition-all text-sm font-medium text-[rgb(var(--text-primary))]"
    >
      <Icon className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
      {action.label}
    </button>
  )
}

// ============================================================================
// SETTINGS CARD COMPONENT
// ============================================================================

interface SettingsCategoryCardProps {
  category: SettingsCategory
  index: number
  onClick: () => void
}

function SettingsCategoryCard({ category, index, onClick }: SettingsCategoryCardProps) {
  const Icon = category.icon
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      onClick={onClick}
      className="group p-6 rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-[rgb(var(--border-focus))] hover:shadow-lg transition-all duration-200 text-left w-full"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-[rgb(var(--action-primary-bg))]/10 to-[rgb(var(--action-primary-bg-hover))]/10 group-hover:from-[rgb(var(--action-primary-bg))]/20 group-hover:to-[rgb(var(--action-primary-bg-hover))]/20 transition-colors">
          <Icon className="w-6 h-6 text-[rgb(var(--action-secondary-fg))] " />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-[rgb(var(--text-primary))]">
              {category.title}
            </h3>
            <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-[rgb(var(--action-secondary-fg))] group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-3">
            {category.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {category.items.map((item) => (
              <span
                key={item}
                className="text-xs px-2 py-1 rounded-md bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ============================================================================
// SETTINGS PAGE COMPONENT
// ============================================================================

export default function SettingsPlaceholder() {
  const { user, navigate } = useShell()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const displayName = user?.displayName || user?.name || 'User'

  const filteredCategories = searchQuery
    ? SETTINGS_CATEGORIES.filter(
        (cat) =>
          cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.items.some((item) => item.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : SETTINGS_CATEGORIES

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <img
            src={getUserAvatar(user?.name || 'User')}
            alt={displayName}
            className="w-24 h-24 rounded-full ring-4 ring-[rgb(var(--border-primary))]"
          />
        </motion.div>
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {displayName}
          </h1>
          <p className="text-[rgb(var(--text-secondary))]">
            {user?.email || 'user@example.com'}
          </p>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center"
      >
        <motion.div
          animate={{ width: searchFocused ? '100%' : '50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative max-w-xl"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-12 pr-4 py-3 rounded-full bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] focus:border-[rgb(var(--border-focus))] focus:ring-2 focus:ring-[rgb(var(--border-focus))]/20 text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] transition-all"
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {QUICK_ACTIONS.map((action) => (
          <QuickActionPillButton
            key={action.id}
            action={action}
            onClick={() => navigate(action.href)}
          />
        ))}
      </motion.div>

      {/* Settings Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((category, index) => (
          <SettingsCategoryCard
            key={category.id}
            category={category}
            index={index}
            onClick={() => navigate(category.href)}
          />
        ))}
      </div>

      {/* Privacy Note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-sm text-[rgb(var(--text-tertiary))]"
      >
        Your data is protected and managed according to our{' '}
        <a href="/privacy" className="text-[rgb(var(--action-secondary-fg))]  hover:underline">
          privacy policy
        </a>
        .
      </motion.p>
    </div>
  )
}
