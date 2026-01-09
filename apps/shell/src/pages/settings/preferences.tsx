/**
 * Preferences Settings Page
 * 
 * Customize display settings like theme, language, timezone, and date format.
 * Integrated with backend User Preferences API via TanStack Query.
 */

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Palette, 
  Globe, 
  Clock, 
  Sun,
  Moon,
  Monitor,
  School,
  Check
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, MOCK_SCHOOLS } from '@/stores/auth.store'
import { useThemeStore, type Theme } from '@/stores/theme.store'
import {
  SettingsPageHeader,
  SettingsSection,
  SettingsCard,
  SettingsAlert,
  SettingsSkeleton,
  staggerChildren,
  fadeInUp,
} from '@/components/settings/SettingsShared'
import { 
  usersService, 
  type UserPreferences, 
  type UpdatePreferencesDto 
} from '@/services/users.service'

// ============================================================================
// CONSTANTS
// ============================================================================

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
  { value: 'system', label: 'System', icon: Monitor, description: 'Match your system settings' },
]

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'ja', label: '日本語' },
  { value: 'np', label: 'Nepali (Nepal)' },
  {value:  'hin', label: 'Hindi (India)'},
]

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)', offset: 'UTC-5' },
  { value: 'America/Chicago', label: 'Central Time (CT)', offset: 'UTC-6' },
  { value: 'America/Denver', label: 'Mountain Time (MT)', offset: 'UTC-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', offset: 'UTC-8' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)', offset: 'UTC-9' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)', offset: 'UTC-10' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC)', offset: 'UTC+0' },
  { value: 'Europe/London', label: 'London (GMT/BST)', offset: 'UTC+0/+1' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', offset: 'UTC+1/+2' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: 'UTC+9' },
  { value: 'Asia/Shanghai', label: 'Beijing (CST)', offset: 'UTC+8' },
  { value: 'Asia/Kolkata', label: 'India (IST)', offset: 'UTC+5:30' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', offset: 'UTC+10/+11' },
]

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '01/15/2026' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '15/01/2026' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-01-15' },
]

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour', example: '2:30 PM' },
  { value: '24h', label: '24-hour', example: '14:30' },
]

const WEEK_START_OPTIONS = [
  { value: 'sunday', label: 'Sunday' },
  { value: 'monday', label: 'Monday' },
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
// STYLED SELECT
// ============================================================================

interface StyledSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string; [key: string]: string }[]
  showExtra?: keyof { value: string; label: string; [key: string]: string }
}

function StyledSelect({ value, onChange, options, showExtra }: StyledSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2.5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] text-sm text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 min-w-[200px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}{showExtra && opt[showExtra] ? ` (${opt[showExtra]})` : ''}
        </option>
      ))}
    </select>
  )
}

// ============================================================================
// DATE FORMAT PREVIEW
// ============================================================================

interface DateFormatPreviewProps {
  format: string
  timezone: string
}

function DateFormatPreview({ format, timezone }: DateFormatPreviewProps) {
  const now = new Date()
  
  const formattedDate = useMemo(() => {
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const year = now.getFullYear()
    
    switch (format) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      default:
        return `${month}/${day}/${year}`
    }
  }, [format, now])

  const formattedTime = useMemo(() => {
    try {
      return now.toLocaleTimeString('en-US', { 
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }, [timezone, now])

  return (
    <div className="px-4 py-3 rounded-lg bg-[rgb(var(--surface-tertiary))] border border-[rgb(var(--border-primary))]">
      <p className="text-xs text-[rgb(var(--text-tertiary))] mb-1">Preview</p>
      <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
        {formattedDate} • {formattedTime}
      </p>
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
// MAIN COMPONENT
// ============================================================================

export default function PreferencesPage() {
  const user = useAuthStore((s) => s.user)
  const queryClient = useQueryClient()
  
  // Theme store for local theme sync
  const { theme: localTheme, setTheme: setLocalTheme } = useThemeStore()
  
  // Local state
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  
  // Local form state (used for immediate UI updates)
  const [theme, setTheme] = useState<Theme>(localTheme)
  const [language, setLanguage] = useState('en-US')
  const [timezone, setTimezone] = useState('America/New_York')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [weekStartsOn, setWeekStartsOn] = useState<'sunday' | 'monday'>('sunday')
  const [defaultSchoolId, setDefaultSchoolId] = useState<string | undefined>()

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
      setSaveSuccess(true)
      setSaveError(null)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
    onError: (err: Error) => {
      setSaveError(err.message || 'Failed to save preferences')
      setSaveSuccess(false)
    },
  })

  // Update local state when preferences load
  useEffect(() => {
    if (preferences) {
      setTheme(preferences.theme)
      setLanguage(preferences.language)
      setTimezone(preferences.timezone)
      setDateFormat(preferences.dateFormat)
      setTimeFormat(preferences.timeFormat || '12h')
      setWeekStartsOn(preferences.weekStartsOn || 'sunday')
      setDefaultSchoolId(preferences.defaultSchoolId)
      
      // Sync theme with local store
      setLocalTheme(preferences.theme)
    }
  }, [preferences, setLocalTheme])

  // Handle theme change with immediate local update
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    setLocalTheme(newTheme) // Immediate local update
    
    // Save to backend
    updateMutation.mutate({ theme: newTheme })
  }

  // Save preference changes (debounced for select changes)
  const handlePreferenceChange = <K extends keyof UpdatePreferencesDto>(
    key: K,
    value: UpdatePreferencesDto[K]
  ) => {
    updateMutation.mutate({ [key]: value })
  }

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
        <SettingsSkeleton rows={5} showHeader />
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
          <p className="text-[rgb(var(--text-tertiary))]">
            {error instanceof Error ? error.message : 'Failed to load preferences'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 text-teal-600 dark:text-cyan-400 hover:underline"
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
          title="Preferences"
          description="Customize your display and regional settings"
        />

        {/* Alerts */}
        <AnimatePresence>
          {saveSuccess && (
            <SettingsAlert
              type="success"
              message="Preferences saved"
              onDismiss={() => setSaveSuccess(false)}
              autoDismiss
              autoDismissDelay={2000}
            />
          )}
          {saveError && (
            <SettingsAlert
              type="error"
              message={saveError}
              onDismiss={() => setSaveError(null)}
            />
          )}
        </AnimatePresence>

        {/* Theme Section */}
        <SettingsSection
          title="Appearance"
          icon={Palette}
          description="Choose your preferred theme"
        >
          <ThemeSelector value={theme} onChange={handleThemeChange} />
        </SettingsSection>

        {/* Language Section */}
        <SettingsSection
          title="Language"
          icon={Globe}
          description="Select your preferred language"
        >
          <SettingsCard title="Display Language" description="Language used throughout the app">
            <StyledSelect
              value={language}
              onChange={(value) => {
                setLanguage(value)
                handlePreferenceChange('language', value)
              }}
              options={LANGUAGE_OPTIONS}
            />
          </SettingsCard>
        </SettingsSection>

        {/* Date & Time Section */}
        <SettingsSection
          title="Date & Time"
          icon={Clock}
          description="Configure how dates and times are displayed"
        >
          <div className="space-y-4">
            <SettingsCard title="Timezone" description="Your local timezone for all timestamps">
              <StyledSelect
                value={timezone}
                onChange={(value) => {
                  setTimezone(value)
                  handlePreferenceChange('timezone', value)
                }}
                options={TIMEZONE_OPTIONS}
                showExtra="offset"
              />
            </SettingsCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SettingsCard title="Date Format" description="How dates are shown">
                <StyledSelect
                  value={dateFormat}
                  onChange={(value) => {
                    setDateFormat(value)
                    handlePreferenceChange('dateFormat', value as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD')
                  }}
                  options={DATE_FORMAT_OPTIONS}
                  showExtra="example"
                />
              </SettingsCard>

              <SettingsCard title="Time Format" description="12 or 24 hour clock">
                <StyledSelect
                  value={timeFormat}
                  onChange={(value) => {
                    setTimeFormat(value as '12h' | '24h')
                    handlePreferenceChange('timeFormat', value as '12h' | '24h')
                  }}
                  options={TIME_FORMAT_OPTIONS}
                  showExtra="example"
                />
              </SettingsCard>
            </div>

            <SettingsCard title="Week Starts On" description="First day of the week in calendars">
              <StyledSelect
                value={weekStartsOn}
                onChange={(value) => {
                  setWeekStartsOn(value as 'sunday' | 'monday')
                  handlePreferenceChange('weekStartsOn', value as 'sunday' | 'monday')
                }}
                options={WEEK_START_OPTIONS}
              />
            </SettingsCard>

            {/* Live Preview */}
            <motion.div variants={fadeInUp}>
              <DateFormatPreview format={dateFormat} timezone={timezone} />
            </motion.div>
          </div>
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
      </motion.div>
    </div>
  )
}
