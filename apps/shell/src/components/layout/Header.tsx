import { Fragment } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react'
import {
  Bell,
  User,
  Settings,
  FileText,
  Moon,
  Sun,
  Monitor,
  LogOut,
  HelpCircle,
} from 'lucide-react'
import { useAuthStore } from '../../stores/auth.store'
import { useThemeStore, type Theme } from '../../stores/theme.store'
import { Avatar, LanguageSwitcher } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'

import { Breadcrumbs } from './Breadcrumbs'

// ============================================================================
// USER MENU WITH THEME PICKER
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { theme, setTheme } = useThemeStore()
  const { t: tNav } = useTranslation('nav')
  const { t: tCommon } = useTranslation('common')
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

          {/* Theme Picker */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">{tCommon('theme')}</span>
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
            <MenuItem>
              {({ active }) => (
                <button className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? 'bg-[rgb(var(--interactive-hover))]' : ''}`}>
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--surface-tertiary))] flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{tNav('helpSupport')}</p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">{tNav('getHelp')}</p>
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
  const { t: tNav } = useTranslation('nav')

  return (
    <>
      <header
        className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between border-b border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
        aria-label="Global header"
      >
        {/* Left Section - Breadcrumbs only (sidebar toggle is now edge-based) */}
        <div className="flex items-center min-w-0 flex-1">
          <Breadcrumbs />
        </div>

        {/* Right Section - All header actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Language Switcher */}
          <LanguageSwitcher variant="default" />

          {/* Documentation */}
          <button
            className="p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200"
            aria-label={tNav('documentation')}
          >
            <FileText className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--interactive-hover))] transition-all duration-200"
            aria-label={tNav('notifications')}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rust-500 rounded-full ring-2 ring-[rgb(var(--surface-secondary))]" />
          </button>

          {/* User Menu */}
          <UserMenu />
        </div>
      </header>
    </>
  )
}
