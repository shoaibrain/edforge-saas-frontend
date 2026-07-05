/**
 * LanguageSwitcher
 *
 * Dropdown toggle for switching between supported platform languages.
 * Uses Headless UI Menu for accessible keyboard-navigable dropdown.
 */

import { Fragment } from 'react'
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { useTranslation } from 'react-i18next'
import { cn, focusRing, focusRingInset } from '../utils'

const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'ne', label: 'नेपाली', flag: 'ने' },
  { code: 'hi', label: 'हिन्दी', flag: 'हि' },
] as const

interface LanguageSwitcherProps {
  /** Called after language changes (e.g., to persist to backend) */
  onLanguageChange?: (lang: string) => void
  className?: string
  /** Variant: 'default' renders with background, 'ghost' is transparent */
  variant?: 'default' | 'ghost'
}

export function LanguageSwitcher({
  onLanguageChange,
  className,
  variant = 'default',
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation('nav')
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0]

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code)
    onLanguageChange?.(code)
  }

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <MenuButton
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
          focusRing,
          variant === 'default'
            ? 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-secondary))]'
            : 'text-[rgb(var(--text-inverted)/0.80)] hover:text-[rgb(var(--text-inverted))] hover:bg-[rgb(var(--background-primary)/0.10)]'
        )}
        aria-label={t('changeLanguage')}
      >
        <span className="text-xs font-bold w-5 text-center">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.label}</span>
        <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-enter duration-fast"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-exit duration-instant"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 z-50 mt-1.5 w-40 origin-top-right rounded-xl bg-[rgb(var(--background-elevated))] shadow-popover ring-1 ring-[rgb(var(--border-secondary))] border border-[rgb(var(--border-secondary))] focus:outline-none overflow-hidden">
          <div className="py-1">
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code}>
                {({ focus }) => (
                  <button
                    type="button"
                    onClick={() => handleSelect(lang.code)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm',
                      focusRingInset,
                      focus && 'bg-[rgb(var(--background-tertiary))]',
                      i18n.language === lang.code
                        ? 'text-[rgb(var(--action-secondary-fg))] font-medium'
                        : 'text-[rgb(var(--text-primary))]'
                    )}
                  >
                    <span className="text-xs font-bold w-5 text-center">{lang.flag}</span>
                    <span>{lang.label}</span>
                    {i18n.language === lang.code && (
                      <svg className="ml-auto w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  )
}
