/**
 * Settings Page - Clean Content-Only Design
 * 
 * Navigation is now handled by the dynamic sidebar.
 * This page only renders the content for the active tab.
 * Features a Google Account-inspired overview when no tab is selected.
 */

import { useState } from 'react'
import { createFileRoute, redirect, useSearch, Link } from '@tanstack/react-router'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { 
  Mail, 
  Camera,
  Shield,
  Key,
  Globe,
  Save,
  Check,
  Smartphone,
  Trash2,
  Building2,
  Users,
  CreditCard,
  Zap,
  Link2,
  ChevronRight,
  User,
  Bell,
  School,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextField, PhoneField, ToggleField } from '@/components/forms/fields'
import { AddressSection } from '@/components/forms/sections'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useAppStore } from '@/stores/app.store'
import { can } from '@/lib/abac'
import type { GlobalRole } from '@/types/auth'
import { profileUpdateSchema, type ProfileUpdateFormValues } from '@/schemas/person.schema'
import { getUserAvatar } from '@/lib/avatar'

// Route search params validation
const SETTINGS_TABS = [
  'overview',
  'account',
  'preferences',
  'notifications',
  'security',
  'connections',
  'general',
  'people',
  'schools',
  'billing',
  'integrations',
  'data',
  'danger',
] as const

type SettingsTab = (typeof SETTINGS_TABS)[number]

const settingsSearchSchema = {
  parse: (search: Record<string, unknown>) => {
    const tab = search.tab as string | undefined
    // If no tab specified, show overview
    if (!tab) return { tab: 'overview' as SettingsTab }
    // If valid tab, use it
    if (SETTINGS_TABS.includes(tab as SettingsTab)) {
      return { tab: tab as SettingsTab }
    }
    // Fallback to overview
    return { tab: 'overview' as SettingsTab }
  },
}

const SETTINGS_TAB_RULES: Partial<
  Record<
    SettingsTab,
    {
      tenantRoles?: GlobalRole[]
      permission?: { action: Parameters<typeof can>[1]['action']; resource: Parameters<typeof can>[1]['resource'] }
    }
  >
> = {
  general: { permission: { action: 'view', resource: 'settings' } },
  people: { permission: { action: 'view', resource: 'staff' } },
  schools: { permission: { action: 'view', resource: 'settings:school' } },
  billing: {
    tenantRoles: ['TenantAdmin'],
    permission: { action: 'manage', resource: 'settings:tenant' },
  },
  integrations: {
    tenantRoles: ['TenantAdmin'],
    permission: { action: 'manage', resource: 'settings:tenant' },
  },
  data: {
    tenantRoles: ['TenantAdmin'],
    permission: { action: 'manage', resource: 'settings:tenant' },
  },
}

export const Route = createFileRoute('/_protected/settings/')({
  beforeLoad: ({ search }) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      throw redirect({ to: '/login' })
    }

    const tab = (search as { tab: SettingsTab }).tab
    const rule = SETTINGS_TAB_RULES[tab]
    if (!rule) return

    if (rule.tenantRoles && rule.tenantRoles.length > 0) {
      if (!rule.tenantRoles.includes(user.globalRole)) {
        throw redirect({ to: '/forbidden' })
      }
    }

    if (rule.permission) {
      const { activeSchoolId } = useAppStore.getState()
      const ok = can(user, {
        action: rule.permission.action,
        resource: rule.permission.resource,
        schoolId: activeSchoolId ?? undefined,
      })
      if (!ok) {
        throw redirect({ to: '/forbidden' })
      }
    }
  },
  component: SettingsPage,
  validateSearch: settingsSearchSchema,
})

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

function SettingsPage() {
  const { tab } = useSearch({ from: '/_protected/settings/' })
  const user = useAuthStore((s) => s.user)
  const activeSchoolId = useAppStore((s) => s.activeSchoolId)
  const activeSchool = activeSchoolId ? MOCK_SCHOOLS[activeSchoolId] : null
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Form setup
  const methods = useForm<ProfileUpdateFormValues>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.name?.split(' ')[0] || '',
      lastName: user?.name?.split(' ').slice(1).join(' ') || '',
      email: user?.email || '',
      phone: '',
    },
  })

  const { handleSubmit, formState: { isDirty } } = methods

  const onSubmit = async (data: ProfileUpdateFormValues) => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    console.log('Settings updated:', data)
    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const avatarUrl = getUserAvatar(user?.name || 'User')

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Render content based on active tab */}
                {tab === 'overview' && (
                  <SettingsOverviewContent 
                    avatarUrl={avatarUrl}
                    userName={user?.name}
                    userEmail={user?.email}
                    userRole={user?.globalRole}
                  />
                )}
                {tab === 'account' && (
                  <AccountTabContent 
                    avatarUrl={avatarUrl} 
                    userName={user?.name}
                    userRole={user?.globalRole}
                    isDirty={isDirty}
                    isSaving={isSaving}
                    saveSuccess={saveSuccess}
                  />
                )}
                {tab === 'preferences' && <PreferencesTabContent />}
                {tab === 'notifications' && <NotificationsTabContent />}
                {tab === 'security' && <SecurityTabContent />}
                {tab === 'connections' && <ConnectionsTabContent />}
                {tab === 'general' && <GeneralTabContent school={activeSchool} />}
                {tab === 'people' && <PeopleTabContent />}
                {tab === 'schools' && <SchoolsTabContent />}
                {tab === 'billing' && <BillingTabContent />}
                {tab === 'integrations' && <IntegrationsTabContent />}
                {tab === 'data' && <DataTabContent />}
                {tab === 'danger' && <DangerZoneContent />}
              </motion.div>
            </AnimatePresence>
          </form>
        </FormProvider>
      </div>
    </div>
  )
}

// ============================================================================
// SETTINGS OVERVIEW - Google Account Inspired
// ============================================================================

interface QuickActionProps {
  label: string
  icon: LucideIcon
  href: SettingsTab
  delay?: number
}

function QuickActionPill({ label, icon: Icon, href, delay = 0 }: QuickActionProps) {
  const [hovered, setHovered] = useState(false)

  const spring = useSpring({
    scale: hovered ? 1.02 : 1,
    y: hovered ? -2 : 0,
    config: config.wobbly,
  })

  const iconSpring = useSpring({
    rotate: hovered ? 5 : 0,
    scale: hovered ? 1.1 : 1,
    config: { tension: 400, friction: 20 },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
    >
      <Link
        to="/settings"
        search={{ tab: href }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <animated.div
          style={{
            transform: spring.scale.to(s => `scale(${s}) translateY(${spring.y.get()}px)`),
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:bg-[rgb(var(--surface-tertiary))] hover:border-teal-500/30 transition-colors cursor-pointer"
        >
          <animated.div
            style={{
              transform: iconSpring.scale.to(s => `scale(${s}) rotate(${iconSpring.rotate.get()}deg)`),
            }}
          >
            <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </animated.div>
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">{label}</span>
        </animated.div>
      </Link>
    </motion.div>
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
  const [searchFocused, setSearchFocused] = useState(false)
  const [photoHovered, setPhotoHovered] = useState(false)

  const searchSpring = useSpring({
    scale: searchFocused ? 1.01 : 1,
    shadow: searchFocused ? 12 : 0,
    config: config.gentle,
  })

  const photoSpring = useSpring({
    scale: photoHovered ? 1.05 : 1,
    config: config.wobbly,
  })

  // Quick action items
  const quickActions: QuickActionProps[] = [
    { label: 'My Account', icon: User, href: 'account' },
    { label: 'Security', icon: Shield, href: 'security' },
    { label: 'Notifications', icon: Bell, href: 'notifications' },
    { label: 'Schools', icon: School, href: 'schools' },
    { label: 'Billing', icon: CreditCard, href: 'billing' },
  ]

  return (
    <div className="space-y-8">
      {/* Profile Header - Google Account Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center text-center pt-4 pb-6"
      >
        {/* Avatar with camera overlay */}
        <animated.div
          style={{ transform: photoSpring.scale.to(s => `scale(${s})`) }}
          onMouseEnter={() => setPhotoHovered(true)}
          onMouseLeave={() => setPhotoHovered(false)}
          className="relative group cursor-pointer mb-4"
        >
          <img
            src={avatarUrl}
            alt={userName}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-[rgb(var(--surface-tertiary))] group-hover:ring-teal-500/30 transition-all"
          />
          <motion.div
            initial={false}
            animate={{ opacity: photoHovered ? 1 : 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
          >
            <Camera className="w-6 h-6 text-white" />
          </motion.div>
          {/* Camera badge */}
          <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[rgb(var(--surface-secondary))] border-2 border-[rgb(var(--surface-primary))] shadow-lg">
            <Camera className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
          </div>
        </animated.div>

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
          animate={{ opacity: 1, scale: 1 }}
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
        <animated.div
          style={{
            transform: searchSpring.scale.to(s => `scale(${s})`),
            boxShadow: searchSpring.shadow.to(s => `0 ${s}px ${s * 2}px rgba(0, 0, 0, 0.08)`),
          }}
          className="relative"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          <input
            type="text"
            placeholder="Search settings..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-12 pr-4 py-3.5 rounded-full border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-tertiary))] focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20 transition-all"
          />
        </animated.div>
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
          Only you can see your settings. Edforge keeps your data private, safe, and secure.{' '}
          <a href="#" className="text-teal-600 dark:text-cyan-400 hover:underline">
            Learn more
          </a>
        </p>
      </motion.div>
    </div>
  )
}

// ============================================================================
// TAB CONTENT COMPONENTS
// ============================================================================

function AccountTabContent({ 
  avatarUrl, 
  userName, 
  userRole,
  isDirty,
  isSaving,
  saveSuccess,
}: { 
  avatarUrl: string
  userName?: string
  userRole?: string
  isDirty: boolean
  isSaving: boolean
  saveSuccess: boolean
}) {
  const [photoHovered, setPhotoHovered] = useState(false)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">My Account</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Manage your personal information
          </p>
        </div>
        <SaveButton isDirty={isDirty} isSaving={isSaving} saveSuccess={saveSuccess} />
      </div>

      {/* Profile Photo + Name */}
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <motion.div
            onMouseEnter={() => setPhotoHovered(true)}
            onMouseLeave={() => setPhotoHovered(false)}
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <img
              src={avatarUrl}
              alt={userName}
              className="w-20 h-20 rounded-xl object-cover ring-2 ring-[rgb(var(--border-primary))] group-hover:ring-teal-500/50 transition-all"
            />
            <motion.div
              initial={false}
              animate={{ opacity: photoHovered ? 1 : 0 }}
              className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50"
            >
              <Camera className="w-5 h-5 text-white" />
            </motion.div>
          </motion.div>
          
          <div className="flex-1 space-y-1">
            <p className="text-lg font-semibold text-[rgb(var(--text-primary))]">{userName}</p>
            <p className="text-sm text-teal-600 dark:text-cyan-400">{userRole}</p>
            <div className="flex items-center gap-2 mt-3">
              <Button variant="outline" size="sm">Upload Photo</Button>
              <Button variant="ghost" size="sm" className="text-[rgb(var(--text-tertiary))]">Remove</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[rgb(var(--border-primary))]" />

      {/* Personal Information */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Personal Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <TextField name="firstName" label="First Name" placeholder="Enter first name" />
          <TextField name="lastName" label="Last Name" placeholder="Enter last name" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[rgb(var(--border-primary))]" />

      {/* Contact Information */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Contact Information</h2>
        <div className="grid grid-cols-2 gap-5">
          <TextField name="email" label="Email" type="email" placeholder="email@example.com" icon={Mail} />
          <PhoneField name="phone" label="Phone" placeholder="(555) 123-4567" />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[rgb(var(--border-primary))]" />

      {/* Address */}
      <div className="space-y-5">
        <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">Address</h2>
        <AddressSection namePrefix="address" showHeader={false} />
      </div>
    </div>
  )
}

function PreferencesTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Preferences</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Customize your display and language settings
        </p>
      </div>

      <div className="space-y-4">
        <SettingsCard title="Language" description="Select your preferred language">
          <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
            <option>English (US)</option>
            <option>Spanish</option>
            <option>French</option>
          </select>
        </SettingsCard>

        <SettingsCard title="Timezone" description="Set your local timezone">
          <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
            <option>Pacific Time (PT)</option>
            <option>Mountain Time (MT)</option>
            <option>Central Time (CT)</option>
            <option>Eastern Time (ET)</option>
          </select>
        </SettingsCard>

        <SettingsCard title="Date Format" description="Choose how dates are displayed">
          <select className="px-3 py-2 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50">
            <option>MM/DD/YYYY</option>
            <option>DD/MM/YYYY</option>
            <option>YYYY-MM-DD</option>
          </select>
        </SettingsCard>
      </div>
    </div>
  )
}

function NotificationsTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Notifications</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Manage how you receive updates and alerts
        </p>
      </div>

      <div className="space-y-1">
        <ToggleField name="notifications.email" label="Email Notifications" description="Receive updates via email" />
        <ToggleField name="notifications.push" label="Push Notifications" description="Get notified in your browser" />
        <ToggleField name="notifications.sms" label="SMS Notifications" description="Receive important alerts via text" />
        <ToggleField name="notifications.marketing" label="Marketing Emails" description="News about new features and updates" />
      </div>
    </div>
  )
}

function SecurityTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Security</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Manage your account security settings
        </p>
      </div>

      <div className="space-y-4">
        <SettingsRow icon={Key} title="Password" description="Last changed 30 days ago" action={<Button variant="outline" size="sm">Change</Button>} />
        <SettingsRow icon={Smartphone} title="Two-Factor Authentication" description="Add an extra layer of security" action={<Button variant="outline" size="sm">Enable</Button>} />
        <SettingsRow icon={Shield} title="Active Sessions" description="Manage devices where you're logged in" action={<Button variant="ghost" size="sm">View All</Button>} />
      </div>
    </div>
  )
}

function ConnectionsTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Connections</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Apps and services connected to your account
        </p>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
        <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No connected apps</p>
        <p className="text-sm mt-1">Connect apps to enhance your experience</p>
      </div>
    </div>
  )
}

function GeneralTabContent({ school }: { school?: { name: string; code?: string } | null }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">General</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Workspace settings and preferences
        </p>
      </div>

      <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">
            {school?.name?.charAt(0) || 'W'}
          </div>
          <div>
            <p className="font-semibold text-[rgb(var(--text-primary))]">{school?.name || 'My Workspace'}</p>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">Free Plan • 1 member</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SettingsRow icon={Building2} title="Workspace Name" description={school?.name || 'My Workspace'} action={<Button variant="ghost" size="sm">Edit</Button>} />
        <SettingsRow icon={Globe} title="Workspace URL" description="edforge.app/workspace-name" action={<Button variant="ghost" size="sm">Copy</Button>} />
      </div>
    </div>
  )
}

function PeopleTabContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">People</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Manage workspace members and roles
          </p>
        </div>
        <Button>Add Members</Button>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">Invite your team</p>
        <p className="text-sm mt-1">Add members to collaborate together</p>
        <Button variant="outline" className="mt-4">Send Invites</Button>
      </div>
    </div>
  )
}

function SchoolsTabContent() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Schools</h1>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Manage schools in your workspace
          </p>
        </div>
        <Button>Add School</Button>
      </div>

      <div className="space-y-3">
        {Object.entries(MOCK_SCHOOLS).slice(0, 3).map(([id, school]) => (
          <div key={id} className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500/30 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-medium">
                {school.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-[rgb(var(--text-primary))]">{school.name}</p>
                <p className="text-sm text-[rgb(var(--text-tertiary))]">{school.code}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[rgb(var(--text-tertiary))]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function BillingTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Billing</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Manage your subscription and payment methods
        </p>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">Current Plan</p>
            <p className="text-xl font-bold text-[rgb(var(--text-primary))]">Free</p>
          </div>
          <Button>Upgrade</Button>
        </div>
      </div>

      <div className="space-y-4">
        <SettingsRow icon={CreditCard} title="Payment Method" description="No payment method added" action={<Button variant="outline" size="sm">Add</Button>} />
      </div>
    </div>
  )
}

function IntegrationsTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Integrations</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Connect third-party services
        </p>
      </div>

      <div className="text-center py-12 text-[rgb(var(--text-tertiary))]">
        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">No integrations yet</p>
        <p className="text-sm mt-1">Connect apps to automate your workflow</p>
      </div>
    </div>
  )
}

function DataTabContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">Import/Export</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Manage your workspace data
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Import Data</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Import students, staff, and other data from CSV or Excel files.
          </p>
          <Button variant="outline">Import from File</Button>
        </div>

        <div className="p-6 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Export Data</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Download your workspace data in various formats.
          </p>
          <Button variant="outline">Export All Data</Button>
        </div>
      </div>
    </div>
  )
}

function DangerZoneContent() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-rust-600 dark:text-rust-400">Danger Zone</h1>
        <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
          Irreversible actions that affect your account
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-6 rounded-xl bg-rust-500/5 border border-rust-500/20">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Deactivate Account</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Temporarily disable your account. You can reactivate it anytime.
          </p>
          <Button variant="outline" className="border-rust-500/30 text-rust-600 hover:bg-rust-500/10">
            Deactivate
          </Button>
        </div>

        <div className="p-6 rounded-xl bg-rust-500/5 border border-rust-500/20">
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-2">Delete Account</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button variant="outline" className="border-rust-500/30 text-rust-600 hover:bg-rust-500/10">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function SettingsCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
      <div>
        <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
      </div>
      {children}
    </div>
  )
}

function SettingsRow({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
          <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

function SaveButton({ isDirty, isSaving, saveSuccess }: { isDirty: boolean; isSaving: boolean; saveSuccess: boolean }) {
  return (
    <Button type="submit" disabled={!isDirty || isSaving} className="min-w-[110px]">
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            Saving...
          </motion.div>
        ) : saveSuccess ? (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Saved!
          </motion.div>
        ) : (
          <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}
