/**
 * Preferences & Notifications Page
 *
 * Personal display preferences and notification settings for the logged-in user.
 * Organization-wide settings have been moved to Workspace Settings.
 *
 * User-specific settings:
 * - Theme (light/dark/system)
 * - Default School (for multi-school users)
 * - Notification category preferences (MVP: Announcements, Attendance, Grades, Calendar)
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  School,
  Check,
  ArrowRight,
  Building2,
  Info,
  Bell,
  Megaphone,
  ClipboardCheck,
  GraduationCap,
  Calendar,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useThemeStore, type Theme } from '@/stores/theme.store'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
  SettingsToggleRow,
  SettingsSkeleton,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import {
  usersService,
  type UserPreferences,
  type UpdatePreferencesDto,
  type NotificationSettings,
  type NotificationCategorySettings,
} from '@/services/users.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Match your system settings' },
]

/** MVP notification categories — core school operations only */
const MVP_NOTIFICATION_CATEGORIES: {
  key: keyof NotificationCategorySettings
  label: string
  description: string
  icon: typeof Bell
}[] = [
  { key: 'announcements', label: 'Announcements', description: 'School-wide and class announcements', icon: Megaphone },
  { key: 'attendance', label: 'Attendance', description: 'Attendance alerts and absence notifications', icon: ClipboardCheck },
  { key: 'grades', label: 'Grades & Assessments', description: 'Grade updates and assessment results', icon: GraduationCap },
  { key: 'calendar', label: 'Calendar & Events', description: 'Upcoming events and schedule changes', icon: Calendar },
]

// ============================================================================
// THEME SELECTOR
// ============================================================================

interface ThemeSelectorProps {
  value: Theme
  onChange: (theme: Theme) => void
}

function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = value === option.value
        
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-4 rounded-xl border-2 transition-all text-left
              ${isSelected 
                ? 'border-teal-500 bg-teal-500/5' 
                : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:border-[rgb(var(--border-secondary))]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg 
                ${isSelected ? 'bg-teal-500/10' : 'bg-[rgb(var(--surface-tertiary))]'}
              `}>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600 dark:text-cyan-400' : 'text-[rgb(var(--text-tertiary))]'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? 'text-teal-600 dark:text-cyan-400' : 'text-[rgb(var(--text-primary))]'}`}>
                  {option.label}
                </p>
              </div>
            </div>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-2">
              {option.description}
            </p>
            
            {/* Selection indicator */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-2 right-2"
                >
                  <div className="p-0.5 rounded-full bg-teal-500">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}

// ============================================================================
// SCHOOL SELECTOR
// ============================================================================

interface SchoolSelectorProps {
  value?: string
  onChange: (schoolId: string) => void
  schools: { id: string; name: string }[]
}

function SchoolSelector({ value, onChange, schools }: SchoolSelectorProps) {
  if (schools.length === 0) {
    return (
      <p className="text-sm text-[rgb(var(--text-tertiary))]">No schools assigned</p>
    )
  }

  if (schools.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))]">
        <School className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <span className="text-sm text-[rgb(var(--text-primary))]">{schools[0].name}</span>
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-w-[200px]"
    >
      <option value="">Select default school</option>
      {schools.map((school) => (
        <option key={school.id} value={school.id}>
          {school.name}
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// WORKSPACE SETTINGS LINK
// ============================================================================

function WorkspaceSettingsLink() {
  return (
    <motion.div variants={fadeInUp}>
      <Link
        to="/settings/workspace"
        className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] hover:border-teal-500/30 hover:shadow-md transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10">
            <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="font-medium text-[rgb(var(--text-primary))] group-hover:text-teal-700 dark:group-hover:text-teal-400">
              Workspace Settings
            </p>
            <p className="text-sm text-[rgb(var(--text-tertiary))]">
              Manage organization-wide settings like timezone, language, and date formats
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-[rgb(var(--text-tertiary))] group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
      </Link>
    </motion.div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PreferencesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  // Theme store for local theme sync
  const { theme: localTheme, setTheme: setLocalTheme } = useThemeStore()
  
  // Local form state (used for immediate UI updates)
  const [theme, setTheme] = useState<Theme>(localTheme)
  const [defaultSchoolId, setDefaultSchoolId] = useState<string | undefined>()

  // Notification category state
  const [categories, setCategories] = useState<NotificationCategorySettings>({
    announcements: true,
    attendance: true,
    grades: true,
    messages: true,    // preserved for backend compat (parked in UI)
    calendar: true,
    billing: true,     // preserved for backend compat (parked in UI)
    security: true,    // preserved for backend compat (parked in UI)
  })

  // Fetch preferences from API
  const {
    data: preferences,
    isLoading,
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
      toast.success('Preferences saved')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save preferences')
    },
  })

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme)
      setDefaultSchoolId(preferences.defaultSchoolId)
      setLocalTheme(preferences.theme)

      // Sync notification categories from API
      if (preferences.notifications?.categories) {
        setCategories(preferences.notifications.categories)
      }
    }
  }, [preferences, setLocalTheme])

  // Handle theme change with immediate local update
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setLocalTheme(newTheme) // Immediate local update
    
    // Save to backend
    updateMutation.mutate({ theme: newTheme })
  }

  // Save preference changes
  const handlePreferenceChange = <K extends keyof UpdatePreferencesDto>(
    key: K,
    value: UpdatePreferencesDto[K]
  ) => {
    updateMutation.mutate({ [key]: value })
  }

  // Handle notification category toggle
  const handleCategoryToggle = useCallback((
    category: keyof NotificationCategorySettings,
    enabled: boolean,
  ) => {
    const newCategories = { ...categories, [category]: enabled }
    setCategories(newCategories)

    // Preserve full notification structure (channels + all 7 categories)
    // so parked categories keep their values in the backend
    const notifications: NotificationSettings = {
      channels: preferences?.notifications?.channels ?? {
        email: { enabled: true, digest: 'immediate' as const },
        push: { enabled: true },
        sms: { enabled: false, phone: '' },
      },
      categories: newCategories,
    }
    updateMutation.mutate({ notifications })
  }, [categories, preferences, updateMutation])

  // Get schools for selector (from user assignments)
  const schools = useMemo(() => {
    if (!user?.assignments) return []
    return Object.keys(user.assignments).map((schoolId) => ({
      id: schoolId,
      name: MOCK_SCHOOLS[schoolId]?.name || `School ${schoolId}`,
    }))
  }, [user?.assignments])

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-8">
        <SettingsSkeleton rows={3} showHeader />
      </div>
    )
  }

  // Error state - show UI anyway with local theme

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
          title="Preferences & Notifications"
          description="Personal display and notification settings"
          icon={Palette}
        />

        {/* Theme Section */}
        <SettingsSection
          title="Appearance"
          icon={Palette}
          description="Choose your preferred color theme"
        >
          <ThemeSelector value={theme} onChange={handleThemeChange} />
        </SettingsSection>

        {/* Default School (for multi-school users) */}
        {schools.length > 0 && (
          <SettingsSection
            title="Default School"
            icon={School}
            description="Your default school context when you log in"
          >
            <SettingsCard title="Default School" description="School to load by default">
              <SchoolSelector
                value={defaultSchoolId}
                onChange={(value) => {
                  setDefaultSchoolId(value || undefined)
                  handlePreferenceChange('defaultSchoolId', value || undefined)
                }}
                schools={schools}
              />
            </SettingsCard>
          </SettingsSection>
        )}

        {/* Notification Preferences */}
        <SettingsSection
          title="Notification Preferences"
          icon={Bell}
          description="Choose which notifications you'd like to receive"
        >
          <div className="space-y-1">
            {MVP_NOTIFICATION_CATEGORIES.map((cat) => (
              <SettingsToggleRow
                key={cat.key}
                icon={cat.icon}
                title={cat.label}
                description={cat.description}
                checked={categories[cat.key]}
                onChange={(checked) => handleCategoryToggle(cat.key, checked)}
                loading={updateMutation.isPending}
              />
            ))}
          </div>
        </SettingsSection>

        {/* Link to Workspace Settings */}
        <motion.div variants={fadeInUp}>
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))] mb-4">
            <Info className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                <strong>Looking for regional settings?</strong> Organization-wide settings like
                timezone, language, date format, and week start day are now managed in Workspace Settings.
              </p>
            </div>
          </div>
          <WorkspaceSettingsLink />
        </motion.div>
      </motion.div>
    </div>
  )
}
