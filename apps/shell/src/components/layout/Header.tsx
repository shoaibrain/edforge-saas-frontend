import { Fragment, useMemo } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import { motion } from 'framer-motion'
import {
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useThemeStore } from '../../stores/theme.store'
import { useHomeStore } from '../../stores/home.store'
import { useAppStore } from '../../stores/app.store'
import { Avatar } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { getGreeting } from '../../lib/greeting'
import { adToBS, formatBSLong } from '@edforge/date-utils'
import { cn } from '../../lib/utils'

import { Breadcrumbs } from './Breadcrumbs'
import { SchoolSwitcher } from './SchoolSwitcher'

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
      className="flex items-center gap-1 p-1 bg-[rgb(var(--background-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]"
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
                ? 'text-[rgb(var(--action-primary-fg))]'
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="lang-toggle-pill"
                className="absolute inset-0 bg-[rgb(var(--action-primary-bg))]  rounded-md shadow-sm"
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
// HAMBURGER BUTTON
// ============================================================================

function HamburgerButton() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)
  const collapsed = useAppStore((s) => s.sidebarCollapsed)

  return (
    <button
      onClick={toggleSidebar}
      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150"
      style={{ cursor: 'pointer' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--shell-ni-hover)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <div className="flex flex-col gap-1">
        <span className="block w-5 h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)', transition: 'background 0.3s' }} />
        <span className="block w-5 h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)', transition: 'background 0.3s' }} />
        <span className="block w-5 h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)', transition: 'background 0.3s' }} />
      </div>
    </button>
  )
}

// ============================================================================
// THEME PILL — Light | Dark toggle in topbar
// ============================================================================

function ThemePill() {
  const { resolvedTheme, setTheme } = useThemeStore()

  return (
    <div
      className="flex items-center gap-0.5 rounded-2xl flex-shrink-0"
      style={{
        padding: '3px',
        background: 'var(--shell-theme-pill-bg)',
        border: '0.5px solid var(--shell-border-color)',
        transition: 'background 0.3s',
      }}
    >
      <button
        className={cn(
          'rounded-xl text-xs font-medium transition-all duration-150 border-none font-[inherit]',
        )}
        style={{
          padding: '3px 10px',
          background: resolvedTheme === 'light' ? 'var(--shell-cp-bg)' : 'transparent',
          color: resolvedTheme === 'light' ? 'var(--shell-text-1)' : 'var(--shell-text-3)',
          boxShadow: resolvedTheme === 'light' ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setTheme('light')}
      >
        Light
      </button>
      <button
        className={cn(
          'rounded-xl text-xs font-medium transition-all duration-150 border-none font-[inherit]',
        )}
        style={{
          padding: '3px 10px',
          background: resolvedTheme === 'dark' ? 'var(--shell-cp-bg)' : 'transparent',
          color: resolvedTheme === 'dark' ? 'var(--shell-text-1)' : 'var(--shell-text-3)',
          boxShadow: resolvedTheme === 'dark' ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setTheme('dark')}
      >
        Dark
      </button>
    </div>
  )
}

// ============================================================================
// V2 HOME TOPBAR CENTER — Greeting + Date
// ============================================================================

function HomeTopbarCenter() {
  const user = useAuthStore((s) => s.user)
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

    const parts = [bsPart, gregPart].filter(Boolean)
    return parts.join(' · ')
  }, [])

  return (
    <div className="flex items-center gap-0 min-w-0">
      <span
        className="text-[13.5px] font-medium"
        style={{ color: 'var(--shell-text-1)', transition: 'color 0.3s' }}
      >
        {greeting}
      </span>
      <span
        className="text-xs ml-[10px] pl-[10px]"
        style={{
          color: 'var(--shell-text-4)',
          borderLeft: '1px solid var(--shell-border-color)',
          transition: 'color 0.3s, border-color 0.3s',
        }}
      >
        {dateDisplay}
      </span>
    </div>
  )
}

// ============================================================================
// USER MENU — Avatar dropdown (theme picker removed, now in topbar pill)
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { t: tNav } = useTranslation('nav')

  if (!user) return null

  return (
    <Menu as="div" className="relative">
      <MenuButton
        className="flex items-center rounded-full hover:ring-[rgb(var(--border-focus)/0.50)] transition-all duration-200 ml-1 flex-shrink-0"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Avatar
            name={user.name}
            size="sm"
            shape="circle"
          />
        </div>
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
        <MenuItems className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl bg-[rgb(var(--background-secondary))] border border-[rgb(var(--border-primary))] shadow-xl shadow-ink-500/10 dark:shadow-black/20 z-50 overflow-hidden">
          {/* User Info */}
          <div className="px-4 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary))]">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} size="lg" shape="rounded" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[rgb(var(--text-primary))] truncate">
                  {user.displayName || user.name}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">{user.email}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  ">
                  {user.globalRole}
                </span>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-end">
              <LanguageToggle />
            </div>
          </div>

          <div className="py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate({ to: '/settings', search: { tab: 'account' } })}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--background-tertiary))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--background-tertiary))] flex items-center justify-center">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--background-tertiary))]' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--background-tertiary))] flex items-center justify-center">
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
// MAIN HEADER COMPONENT — Shell V2 Three-Zone Layout
// ============================================================================

export function Header() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed)
  const isHomeV2 = useHomeStore((s) => s.isHomeV2Active)

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[45] flex items-center"
      style={{
        height: 'var(--shell-topbar-h)',
        background: 'var(--shell-page-bg)',
        transition: 'background 0.3s',
      }}
      aria-label="Global header"
    >
      {/* LEFT ZONE: width tracks sidebar for visual alignment */}
      <div
        className="flex items-center gap-1 flex-shrink-0 overflow-hidden"
        style={{
          width: collapsed
            ? 'var(--shell-sidebar-w-collapsed)'
            : 'var(--shell-sidebar-w)',
          transition: 'width var(--shell-transition)',
          paddingLeft: '16px',
        }}
      >
        <HamburgerButton />
        {!collapsed && <SchoolSwitcher />}
      </div>

      {/* CENTER ZONE: Greeting (home) or Breadcrumbs (modules) — flex:1 */}
      <div className="flex-1 flex items-center px-4 min-w-0">
        {isHomeV2 ? <HomeTopbarCenter /> : <Breadcrumbs />}
      </div>

      {/* RIGHT ZONE: Theme pill + User avatar */}
      <div className="flex items-center gap-0.5 flex-shrink-0 pr-4">
        <ThemePill />
        <UserMenu />
      </div>
    </header>
  )
}
