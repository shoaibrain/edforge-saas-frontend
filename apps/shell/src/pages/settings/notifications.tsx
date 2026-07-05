/**
 * Notification Settings Page
 * 
 * Manage notification preferences across different channels and categories.
 * Integrated with backend User Preferences API via TanStack Query.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { 
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Megaphone,
  ClipboardCheck,
  GraduationCap,
  Calendar,
  CreditCard,
  Shield,
  Clock,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsToggleRow,
  SettingsSkeleton,
  staggerChildren,
} from '@/components/settings/SettingsShared'
import { 
  usersService, 
  type UserPreferences, 
  type UpdatePreferencesDto,
  type NotificationSettings,
  type NotificationChannelSettings,
  type NotificationCategorySettings,
} from '@/services/users.service'

// ============================================================================
// TYPES
// ============================================================================

type DigestFrequency = 'immediate' | 'daily' | 'weekly' | 'never'

interface CategoryConfig {
  key: keyof NotificationCategorySettings
  label: string
  description: string
  icon: typeof Mail
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DIGEST_OPTIONS: { value: DigestFrequency; label: string; description: string }[] = [
  { value: 'immediate', label: 'Immediate', description: 'Get notified right away' },
  { value: 'daily', label: 'Daily Digest', description: 'One email per day' },
  { value: 'weekly', label: 'Weekly Digest', description: 'One email per week' },
  { value: 'never', label: 'Never', description: 'Don\'t send email digests' },
]

const NOTIFICATION_CATEGORIES: CategoryConfig[] = [
  { 
    key: 'announcements', 
    label: 'Announcements', 
    description: 'School-wide and class announcements',
    icon: Megaphone,
  },
  { 
    key: 'attendance', 
    label: 'Attendance', 
    description: 'Attendance alerts and absence notifications',
    icon: ClipboardCheck,
  },
  { 
    key: 'grades', 
    label: 'Grades & Assessments', 
    description: 'Grade updates and assessment results',
    icon: GraduationCap,
  },
  { 
    key: 'messages', 
    label: 'Messages', 
    description: 'Direct messages from staff and parents',
    icon: MessageSquare,
  },
  { 
    key: 'calendar', 
    label: 'Calendar & Events', 
    description: 'Upcoming events and schedule changes',
    icon: Calendar,
  },
  { 
    key: 'billing', 
    label: 'Billing & Payments', 
    description: 'Payment reminders and fee updates',
    icon: CreditCard,
  },
  { 
    key: 'security', 
    label: 'Security Alerts', 
    description: 'Login attempts and account security',
    icon: Shield,
  },
]

// ============================================================================
// DIGEST SELECTOR COMPONENT
// ============================================================================

interface DigestSelectorProps {
  value: DigestFrequency
  onChange: (value: DigestFrequency) => void
  disabled?: boolean
}

function DigestSelector({ value, onChange, disabled }: DigestSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {DIGEST_OPTIONS.map((option) => {
        const isSelected = value === option.value
        
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => !disabled && onChange(option.value)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.02 } : undefined}
            whileTap={!disabled ? { scale: 0.98 } : undefined}
            className={`
              p-3 rounded-xl border text-start transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${isSelected 
                ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--action-primary-bg))]/5' 
                : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:border-[rgb(var(--border-secondary))]'
              }
            `}
          >
            <p className={`text-sm font-medium ${isSelected ? 'text-[rgb(var(--action-secondary-fg))] ' : 'text-[rgb(var(--text-primary))]'}`}>
              {option.label}
            </p>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              {option.description}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NotificationsPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  // Local state for UI
  const [pendingChanges, setPendingChanges] = useState<Map<string, boolean>>(new Map())
  
  // Local notification state
  const [channels, setChannels] = useState<NotificationChannelSettings>({
    email: { enabled: true, digest: 'immediate' },
    push: { enabled: true },
    sms: { enabled: false, phone: '' },
  })
  
  const [categories, setCategories] = useState<NotificationCategorySettings>({
    announcements: true,
    attendance: true,
    grades: true,
    messages: true,
    calendar: true,
    billing: true,
    security: true,
  })

  // Fetch preferences from API
  const {
    data: preferences,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserPreferences>({
    queryKey: ['preferences', user?.id],
    queryFn: () => usersService.getPreferences(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  // Update preferences mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePreferencesDto) => usersService.updatePreferences(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences', user?.id] })
      toast.success('Notification settings saved')
      setPendingChanges(new Map())
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save notification settings')
      setPendingChanges(new Map())
    },
  })

  // Update local state when preferences load
  useEffect(() => {
    if (preferences?.notifications) {
      const notif = preferences.notifications
      setChannels(notif.channels)
      setCategories(notif.categories)
    }
  }, [preferences])

  // Save notification settings
  const saveNotifications = useCallback((
    newChannels: NotificationChannelSettings,
    newCategories: NotificationCategorySettings
  ) => {
    const notifications: NotificationSettings = {
      channels: newChannels,
      categories: newCategories,
    }
    updateMutation.mutate({ notifications })
  }, [updateMutation])

  // Handle channel toggle
  const handleChannelToggle = useCallback((
    channel: keyof NotificationChannelSettings,
    enabled: boolean
  ) => {
    const changeKey = `channel.${channel}`
    setPendingChanges((prev) => new Map(prev).set(changeKey, true))
    
    const newChannels = { ...channels }
    if (channel === 'email') {
      newChannels.email = { ...newChannels.email, enabled }
    } else if (channel === 'push') {
      newChannels.push = { enabled }
    } else if (channel === 'sms') {
      newChannels.sms = { ...newChannels.sms, enabled }
    }
    
    setChannels(newChannels)
    saveNotifications(newChannels, categories)
  }, [channels, categories, saveNotifications])

  // Handle email digest change
  const handleDigestChange = useCallback((digest: DigestFrequency) => {
    setPendingChanges((prev) => new Map(prev).set('digest', true))
    
    const newChannels = {
      ...channels,
      email: { ...channels.email, digest },
    }
    
    setChannels(newChannels)
    saveNotifications(newChannels, categories)
  }, [channels, categories, saveNotifications])

  // Handle category toggle
  const handleCategoryToggle = useCallback((
    category: keyof NotificationCategorySettings,
    enabled: boolean
  ) => {
    const changeKey = `category.${category}`
    setPendingChanges((prev) => new Map(prev).set(changeKey, true))
    
    const newCategories = { ...categories, [category]: enabled }
    
    setCategories(newCategories)
    saveNotifications(channels, newCategories)
  }, [channels, categories, saveNotifications])

  // Check if a specific setting is being saved
  const isSettingLoading = (key: string) => {
    return updateMutation.isPending && pendingChanges.has(key)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={6} showHeader />
      </div>
    )
  }

  // Error state
  if (isError && !preferences) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Bell className="w-12 h-12 mx-auto text-[rgb(var(--text-tertiary))] mb-4" />
          <p className="text-[rgb(var(--text-tertiary))]">
            {error instanceof Error ? error.message : 'Failed to load notification settings'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-[rgb(var(--action-secondary-fg))]  hover:underline"
          >
            Try again
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Notifications"
          description="Manage how and when you receive updates"
        />

        {/* Delivery Channels */}
        <SettingsSection
          title="Delivery Channels"
          icon={Bell}
          description="Choose how you want to receive notifications"
        >
          <div className="space-y-1">
            <SettingsToggleRow
              icon={Mail}
              title="Email Notifications"
              description="Receive notifications via email"
              checked={channels.email.enabled}
              onChange={(checked) => handleChannelToggle('email', checked)}
              loading={isSettingLoading('channel.email')}
            />
            <SettingsToggleRow
              icon={Smartphone}
              title="Push Notifications"
              description="Get instant notifications in your browser"
              checked={channels.push.enabled}
              onChange={(checked) => handleChannelToggle('push', checked)}
              loading={isSettingLoading('channel.push')}
            />
            <SettingsToggleRow
              icon={MessageSquare}
              title="SMS Notifications"
              description="Receive important alerts via text message"
              checked={channels.sms.enabled}
              onChange={(checked) => handleChannelToggle('sms', checked)}
              loading={isSettingLoading('channel.sms')}
            />
          </div>
        </SettingsSection>

        {/* Email Digest Frequency */}
        <AnimatePresence>
          {channels.email.enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <SettingsSection
                title="Email Digest"
                icon={Clock}
                description="How often to receive email summaries"
              >
                <DigestSelector
                  value={channels.email.digest}
                  onChange={handleDigestChange}
                  disabled={updateMutation.isPending && pendingChanges.has('digest')}
                />
              </SettingsSection>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification Categories */}
        <SettingsSection
          title="Notification Categories"
          icon={Megaphone}
          description="Choose what types of notifications to receive"
        >
          <div className="space-y-1">
            {NOTIFICATION_CATEGORIES.map((category) => (
              <SettingsToggleRow
                key={category.key}
                icon={category.icon}
                title={category.label}
                description={category.description}
                checked={categories[category.key]}
                onChange={(checked) => handleCategoryToggle(category.key, checked)}
                loading={isSettingLoading(`category.${category.key}`)}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Info note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))]"
        >
          <p className="text-sm text-[rgb(var(--text-tertiary))]">
            <strong className="text-[rgb(var(--text-secondary))]">Note:</strong>{' '}
            Critical security notifications (like password changes and suspicious activity) 
            will always be sent regardless of these settings.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
