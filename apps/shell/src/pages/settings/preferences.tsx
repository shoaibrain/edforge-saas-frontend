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

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Select } from '@edforge/ui'
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  School,
  Check,
  Bell,
  Megaphone,
  ClipboardCheck,
  GraduationCap,
  Calendar,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { useShell } from '@/lib/shell-context'
import { useThemeStore, type Theme } from '@/stores/theme.store'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
  SettingsToggleRow,
  SettingsSkeleton,
  UnsavedChangesBar,
  staggerChildren,
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--action-primary-bg))]/5' 
                : 'border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:border-[rgb(var(--border-secondary))]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg 
                ${isSelected ? 'bg-[rgb(var(--action-primary-bg))]/10' : 'bg-[rgb(var(--background-tertiary))]'}
              `}>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[rgb(var(--action-secondary-fg))] ' : 'text-[rgb(var(--text-tertiary))]'}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isSelected ? 'text-[rgb(var(--action-secondary-fg))] ' : 'text-[rgb(var(--text-primary))]'}`}>
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
                  <div className="p-0.5 rounded-full bg-[rgb(var(--action-primary-bg))]">
                    <Check className="w-3 h-3 text-[rgb(var(--action-primary-fg))]" />
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
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))]">
        <School className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        <span className="text-sm text-[rgb(var(--text-primary))]">{schools[0].name}</span>
      </div>
    )
  }

  return (
    <Select
      aria-label="Default school"
      className="w-full md:w-auto md:min-w-52"
      placeholder="Select default school"
      value={value || null}
      onChange={(v) => onChange(v ?? '')}
      options={schools.map((school) => ({ value: school.id, label: school.name }))}
    />
  )
}


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PreferencesPage() {
  const user = useAuthStore((s) => s.user)
  const { availableSchools } = useShell()
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

  // Track server state for dirty detection
  const serverStateRef = useRef<{
    theme: Theme
    defaultSchoolId: string | undefined
    categories: NotificationCategorySettings
  } | null>(null)

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
      // Immediately sync server ref so isDirty becomes false
      serverStateRef.current = { theme, defaultSchoolId, categories }
      toast.success('Preferences saved')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to save preferences')
    },
  })

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      const serverTheme = preferences.theme as Theme
      const serverSchoolId = preferences.defaultSchoolId
      const serverCategories = preferences.notifications?.categories ?? {
        announcements: true, attendance: true, grades: true,
        messages: true, calendar: true, billing: true, security: true,
      }

      setTheme(serverTheme)
      setDefaultSchoolId(serverSchoolId)
      setLocalTheme(serverTheme)
      setCategories(serverCategories)

      serverStateRef.current = {
        theme: serverTheme,
        defaultSchoolId: serverSchoolId,
        categories: serverCategories,
      }
    }
  }, [preferences, setLocalTheme])

  // Dirty detection — plain expression (not memoized) so it recalculates when ref updates
  const isDirty = serverStateRef.current !== null
    && (theme !== serverStateRef.current.theme
      || defaultSchoolId !== serverStateRef.current.defaultSchoolId
      || JSON.stringify(categories) !== JSON.stringify(serverStateRef.current.categories))

  // Handle theme change with immediate visual feedback (no auto-save)
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setLocalTheme(newTheme) // Immediate visual update
  }

  // Handle notification category toggle (local only)
  const handleCategoryToggle = useCallback((
    category: keyof NotificationCategorySettings,
    enabled: boolean,
  ) => {
    setCategories(prev => ({ ...prev, [category]: enabled }))
  }, [])

  // Save all pending changes in a single API call
  const handleSave = useCallback(() => {
    const dto: UpdatePreferencesDto = {}
    const server = serverStateRef.current
    if (!server) return

    if (theme !== server.theme) {
      dto.theme = theme
    }
    if (defaultSchoolId !== server.defaultSchoolId) {
      dto.defaultSchoolId = defaultSchoolId
    }
    if (JSON.stringify(categories) !== JSON.stringify(server.categories)) {
      const notifications: NotificationSettings = {
        channels: preferences?.notifications?.channels ?? {
          email: { enabled: true, digest: 'immediate' as const },
          push: { enabled: true },
          sms: { enabled: false, phone: '' },
        },
        categories,
      }
      dto.notifications = notifications
    }

    updateMutation.mutate(dto)
  }, [theme, defaultSchoolId, categories, preferences, updateMutation])

  // Reset all local state to server values
  const handleReset = useCallback(() => {
    if (!serverStateRef.current) return
    const server = serverStateRef.current
    setTheme(server.theme)
    setLocalTheme(server.theme) // Revert visual theme
    setDefaultSchoolId(server.defaultSchoolId)
    setCategories(server.categories)
  }, [setLocalTheme])

  // Get schools for selector (from real school data via shell context)
  const schools = useMemo(() => {
    if (!availableSchools || availableSchools.length === 0) return []
    return availableSchools.map((school) => ({
      id: school.id,
      name: school.name,
    }))
  }, [availableSchools])

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
    <div className="max-w-3xl mx-auto px-6 py-8 pb-24">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        {/* Header */}
        <SettingsPageHeader
          title="Preferences"
          description="Personal display and appearance settings"
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
                }}
                schools={schools}
              />
            </SettingsCard>
          </SettingsSection>
        )}

        {/* Notification Preferences — disabled for pilot release */}
        <SettingsSection
          title="Notification Preferences"
          icon={Bell}
          description="Choose which notifications you'd like to receive"
        >
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-[rgb(var(--action-primary-bg))]/5 border border-[rgb(var(--border-focus))]/10">
            <Bell className="w-4 h-4 text-[rgb(var(--action-secondary-fg))]  flex-shrink-0" />
            <p className="text-sm text-[rgb(var(--text-secondary))]">
              Notification preferences are coming soon. We'll let you know when this is ready!
            </p>
          </div>
          <div className="space-y-1">
            {MVP_NOTIFICATION_CATEGORIES.map((cat) => (
              <SettingsToggleRow
                key={cat.key}
                icon={cat.icon}
                title={cat.label}
                description={cat.description}
                checked={categories[cat.key]}
                onChange={(checked) => handleCategoryToggle(cat.key, checked)}
                disabled
              />
            ))}
          </div>
        </SettingsSection>

      </motion.div>

      <UnsavedChangesBar
        isDirty={isDirty}
        onReset={handleReset}
        onSave={handleSave}
        isSaving={updateMutation.isPending}
      />
    </div>
  )
}
