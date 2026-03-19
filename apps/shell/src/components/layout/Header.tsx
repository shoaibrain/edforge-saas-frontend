import { Fragment, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import {
  User,
  Settings,
  Moon,
  Sun,
  Monitor,
  LogOut,
  Bell,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useThemeStore, type Theme } from '../../stores/theme.store'
import { useHomeStore } from '../../stores/home.store'
import { Avatar } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { getGreeting } from '../../lib/greeting'
import { adToBS, formatBSLong } from '@edforge/date-utils'

import { Breadcrumbs } from './Breadcrumbs'

// ============================================================================
// LANGUAGE SLIDING TOGGLE
// ============================================================================

const LANG_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'ne', label: 'NP' },
] as const

function LanguageToggle() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language || 'en'

  const handleSwitch = (code: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    i18n.changeLanguage(code)
  }

  return (
    <div
      className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]"
      role="radiogroup"
      aria-label="Language"
    >
      {LANG_OPTIONS.map(({ code, label }) => {
        const isActive = currentLang === code
        return (
          <button
            key={code}
            role="radio"
            aria-checked={isActive}
            onClick={handleSwitch(code)}
            className={`relative px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors duration-200 ${
              isActive
                ? 'text-white'
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="lang-toggle-pill"
                className="absolute inset-0 bg-teal-500 dark:bg-cyan-500 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// V2 HOME TOPBAR LEFT — Greeting + Date
// ============================================================================

function HomeTopbarLeft() {
  const user = useAuthStore((s) => s.user)
  const academicYear = useHomeStore((s) => s.activeAcademicYear)
  const { t } = useTranslation('dashboard')

  const firstName = user?.displayName || user?.name?.split(' ')[0]
  const greeting = getGreeting(firstName, t)

  const dateDisplay = useMemo(() => {
    const now = new Date()

    // BS date
    let bsPart = ''
    try {
      const bs = adToBS(now)
      bsPart = `${formatBSLong(bs)} BS`
    } catch {
      // Fallback: skip BS date if conversion fails
    }

    // Gregorian date
    const gregPart = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })

    // Academic year
    const yearPart = academicYear ? `Academic Year ${academicYear.name}` : ''

    const parts = [bsPart, gregPart, yearPart].filter(Boolean)
    return parts.join('  ·  ')
  }, [academicYear])

  return (
    <div className="min-w-0">
      <div
        className="text-sm font-medium tracking-tight"
        style={{ color: 'var(--v2-text-primary, rgb(var(--text-primary)))' }}
      >
        {greeting}
      </div>
      <div
        className="text-[11px] mt-0.5 truncate"
        style={{ color: 'var(--v2-text-faint, rgb(var(--text-tertiary)))' }}
      >
        {dateDisplay}
      </div>
    </div>
  )
}

// ============================================================================
// NOTIFICATION BADGE
// ============================================================================

function NotificationBadge() {
  const alertCount = useHomeStore((s) => s.alertCount)

  return (
    <button
      className="relative flex items-center justify-center rounded-lg border transition-colors"
      style={{
        width: 30,
        height: 30,
        background: 'rgba(255, 255, 255, 0.04)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
      aria-label={`Notifications: ${alertCount} alerts`}
    >
      <Bell className="w-3.5 h-3.5" style={{ color: 'var(--v2-text-hint, #7a8099)' }} />
      {alertCount > 0 && (
        <span
          className="absolute -top-[3px] -right-[3px] flex items-center justify-center text-[9px] font-bold text-white rounded-full"
          style={{
            width: 14,
            height: 14,
            background: '#E24B4A',
            border: '1.5px solid var(--v2-bg-app, #0f1117)',
          }}
          aria-hidden="true"
        >
          {alertCount}
        </span>
      )}
    </button>
  )
}

// ============================================================================
// USER MENU WITH THEME PICKER
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const { t: tNav } = useTranslation('nav')
  const { t: tSettings } = useTranslation('settings')

  if (!user) return null

  const themes: { value: Theme; icon: typeof Sun; label: string }[] = [
    { value: 'light', icon: Sun, label: tSettings('preferences.themeLight') },
    { value: 'dark', icon: Moon, label: tSettings('preferences.themeDark') },
    { value: 'system', icon: Monitor, label: tSettings('preferences.themeSystem') },
  ]

  return (
    <Menu as="div" className="relative">
      <MenuButton className="flex items-center rounded-full ring-2 ring-[rgb(var(--border-primary))] ring-offset-2 ring-offset-[rgb(var(--surface-secondary))] hover:ring-teal-500/50 transition-all duration-200">
        <Avatar
          name={user.name}
          size="sm"
          shape="circle"
        />
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95 translate-y-1"
        enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100 translate-y-0"
        leaveTo="opacity-0 scale-95 translate-y-1"
      >
        <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--surface-tertiary))]">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" shape="rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[rgb(var(--text-primary))] truncate">
                  {user.displayName || user.name}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-teal-500/15 text-teal-700 dark:bg-cyan-500/20 dark:text-cyan-300">
                  {user.globalRole}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Preferences: Theme + Language */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 p-1 bg-[rgb(var(--surface-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]">
                {themes.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setTheme(value)
                    }}
                    className={`p-2 rounded-md transition-all duration-200 ${theme === value
                      ? 'bg-teal-500 dark:bg-cyan-500 text-white shadow-sm'
                      : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))]'
                      }`}
                    title={label}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
              <LanguageToggle />
            </div>
          </div>

          <div className="py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <User className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{tNav('myProfile')}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{tNav('viewEditProfile')}</p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <Settings className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{tNav('settings')}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{tNav('managePreferences')}</p>
                  </div>
                </button>
              )}
            </MenuItem>
          </div>

          <div className="border-t border-[rgb(var(--border-secondary))] py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={logout}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-rust-50 dark:bg-rust-900/20' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rust-100 dark:bg-rust-900/30 flex items-center justify-center">
                    <LogOut className="w-4 h-4 text-rust-500" />
                  </div>
                  <span className="text-sm font-medium text-rust-600 dark:text-rust-400">{tNav('signOut')}</span>
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}

// ============================================================================
// MAIN HEADER COMPONENT
// ============================================================================

export function Header() {
  const isHomeV2 = useHomeStore((s) => s.isHomeV2Active)

  return (
    <>
      <header
        className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
        aria-label="Global header"
      >
        {/* Left Section */}
        <div className="flex items-center min-w-0 flex-1">
          {isHomeV2 ? <HomeTopbarLeft /> : <Breadcrumbs />}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isHomeV2 && <NotificationBadge />}
          <UserMenu />
        </div>
      </header>
    </>
  )
}
