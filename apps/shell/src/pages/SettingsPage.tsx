/**
 * Settings Layout
 *
 * Provides nested routing support for the Settings module.
 * Renders the overview page at /settings and child routes via Outlet.
 * Features a Google Account-inspired overview with Account/Workspace sections.
 */

import { Outlet, useLocation } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import {
  Shield,
  CreditCard,
  User,
  Palette,
  Building2,
  Search,
  Settings,
} from 'lucide-react'
import { useAuthStore } from '../stores/auth.store'
import { getUserAvatar } from '../lib/avatar'
import { useTranslation } from '@edforge/i18n'
import { QuickActionPill, type QuickActionProps } from '../components/settings/SettingsShared'

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function SettingsPage() {
  const location = useLocation()
  // Check if we're at exactly /settings (not a child route like /settings/account)
  const isExactRoute = location.pathname === '/settings'

  if (isExactRoute) {
    return <SettingsOverviewPage />
  }

  // Render child routes (account, security, etc.)
  return <Outlet />
}

// ============================================================================
// OVERVIEW PAGE
// ============================================================================

function SettingsOverviewPage() {
  const user = useAuthStore((s) => s.user)
  const avatarUrl = getUserAvatar(user?.name || 'User')

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <SettingsOverviewContent
        avatarUrl={avatarUrl}
        userName={user?.displayName || user?.name}
        userEmail={user?.email}
        userRole={user?.globalRole}
      />
    </div>
  )
}

function SettingsOverviewContent({
  avatarUrl,
  userName,
  userEmail,
  userRole,
}: {
  avatarUrl: string
  userName?: string
  userEmail?: string
  userRole?: string
}) {
  const { t } = useTranslation('settings')

  // Quick action items for the pill row
  const quickActions: QuickActionProps[] = [
    { label: t('account.title'), icon: User, href: '/settings/account' },
    { label: t('security.title'), icon: Shield, href: '/settings/security' },
    { label: t('preferences.title'), icon: Palette, href: '/settings/preferences' },
    { label: t('organization.title'), icon: Building2, href: '/settings/organization' },
    { label: t('workspace.title'), icon: Settings, href: '/settings/workspace' },
    { label: 'Fee Structures', icon: CreditCard, href: '/finance/configuration/fee-structures' },
    { label: 'Payment Gateways', icon: CreditCard, href: '/finance/configuration/payment-gateways' },
    // [MVP-PARKED] { label: 'Billing', icon: CreditCard, href: '/settings/billing' },
  ]

  return (
    <div className="space-y-10">
      {/* Profile Header - Google Account Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center pt-4 pb-6"
      >
        {/* Avatar */}
        <div className="mb-4">
          <img
            src={avatarUrl}
            alt={userName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-[rgb(var(--surface-tertiary))]"
          />
        </div>

        {/* Name and Email */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold text-[rgb(var(--text-primary))]"
        >
          {userName || 'Your Name'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-[rgb(var(--text-tertiary))] mt-1"
        >
          {userEmail || 'your@email.com'}
        </motion.p>

        {/* Role Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3"
        >
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-teal-500/10 text-teal-600 dark:text-cyan-400 border border-teal-500/20">
            {userRole || 'User'}
          </span>
        </motion.div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <motion.div
          whileFocus={{ scale: 1.01 }}
          className="relative max-w-xl mx-auto"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search settings (coming soon)"
            disabled
            aria-disabled="true"
            className="w-full pl-12 pr-4 py-3.5 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] opacity-60 cursor-not-allowed"
          />
        </motion.div>
      </motion.div>

      {/* Quick Actions - Pill Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-2"
      >
        {quickActions.map((action, idx) => (
          <QuickActionPill key={action.label} {...action} delay={idx} />
        ))}
      </motion.div>

      {/* Privacy Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pt-4"
      >
        <p className="text-xs text-[rgb(var(--text-tertiary))] max-w-md mx-auto">
          {t('privacyNote')}{' '}
          <a href="/privacy" className="text-teal-600 dark:text-cyan-400 hover:underline">
            {t('privacyLearnMore')}
          </a>
        </p>
      </motion.div>
    </div>
  )
}
