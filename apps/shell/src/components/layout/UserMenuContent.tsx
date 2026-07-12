/**
 * UserMenuContent — presentational pieces of the account surface, shared by
 * the desktop avatar popover (Header's UserMenu, which wraps them in Headless
 * Menu items) and the phone AccountSheet (plain buttons in a bottom sheet).
 * One content contract, two presentations — never fork the content.
 */

import { motion } from 'framer-motion'
import { Sun, Moon, Languages, type LucideIcon } from 'lucide-react'
import { Avatar } from '@edforge/ui'
import { AnimatedIcon, type IconName } from '@edforge/ui/motion'
import { normalizePlatformLanguage, useTranslation } from '@edforge/i18n'
import { useThemeStore } from '../../stores/theme.store'
import { cn } from '../../lib/utils'
import type { UserIdentity } from '@edforge/types'

// ============================================================================
// LANGUAGE SLIDING TOGGLE
// ============================================================================

const LANG_OPTIONS = [
  { code: "en", label: "EN", labelKey: "languageEnglish" },
  { code: "ne", label: "NP", labelKey: "languageNepali" },
] as const;

export function LanguageToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t: tNav, i18n } = useTranslation("nav");
  const currentLang = normalizePlatformLanguage(i18n.language);

  const handleSwitch = (code: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined") {
      window.localStorage.setItem("edforge-language", code);
    }
    i18n.changeLanguage(code);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-[rgb(var(--background-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]",
        fullWidth && "w-full"
      )}
      role="radiogroup"
      aria-label={tNav("language")}
    >
      {LANG_OPTIONS.map(({ code, label, labelKey }) => {
        const isActive = currentLang === code;
        return (
          <button
            key={code}
            role="radio"
            aria-checked={isActive}
            aria-label={tNav(labelKey)}
            onClick={handleSwitch(code)}
            className={cn(
              "relative px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors duration-200",
              fullWidth && "flex-1 flex items-center justify-center",
              isActive
                ? "text-[rgb(var(--action-primary-fg))]"
                : "text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="lang-toggle-pill"
                className="absolute inset-0 bg-[rgb(var(--action-primary-bg))]  rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// APPEARANCE SLIDING TOGGLE — Light | Dark (mirrors LanguageToggle)
// ============================================================================

const THEME_OPTIONS = [
  { code: "light", labelKey: "themeLight" },
  { code: "dark", labelKey: "themeDark" },
] as const;

export function AppearanceToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const { t: tNav } = useTranslation("nav");
  const { resolvedTheme, setTheme } = useThemeStore();

  const handleSwitch = (code: "light" | "dark") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(code);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 bg-[rgb(var(--background-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]",
        fullWidth && "w-full"
      )}
      role="radiogroup"
      aria-label={tNav("appearance")}
    >
      {THEME_OPTIONS.map(({ code, labelKey }) => {
        const isActive = resolvedTheme === code;
        return (
          <button
            key={code}
            role="radio"
            aria-checked={isActive}
            aria-label={tNav(labelKey)}
            onClick={handleSwitch(code)}
            className={cn(
              "relative px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors duration-200",
              fullWidth && "flex-1 flex items-center justify-center",
              isActive
                ? "text-[rgb(var(--action-primary-fg))]"
                : "text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="appearance-toggle-pill"
                className="absolute inset-0 bg-[rgb(var(--action-primary-bg))]  rounded-md shadow-sm"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tNav(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// IDENTITY CARD — avatar + name + email + role chip
// ============================================================================

export function UserIdentityCard({ user }: { user: UserIdentity }) {
  return (
    <div className="px-4 py-4 border-b border-[rgb(var(--border-secondary))] bg-[rgb(var(--background-tertiary))]">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="lg" shape="rounded" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[rgb(var(--text-primary))] truncate">
            {user.displayName || user.name}
          </p>
          <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
            {user.email}
          </p>
          <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  ">
            {user.globalRole}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PREFERENCES ROWS — Appearance + Language, one consolidated group.
// layout 'inline' = label left / toggle right (desktop popover);
// layout 'stacked' = label above a stretched toggle (phone sheet).
// ============================================================================

export function PreferencesRows({ layout = 'inline' }: { layout?: 'inline' | 'stacked' }) {
  const { t: tNav } = useTranslation("nav");
  const { resolvedTheme } = useThemeStore();
  const stacked = layout === 'stacked';

  return (
    <div className={stacked ? "space-y-3" : "space-y-2.5"}>
      <div className={cn("gap-3", stacked ? "space-y-1.5" : "flex items-center justify-between")}>
        <div className="flex items-center gap-2.5 min-w-0">
          {resolvedTheme === "dark" ? (
            <Moon className="w-4 h-4 flex-shrink-0 text-[rgb(var(--text-tertiary))]" />
          ) : (
            <Sun className="w-4 h-4 flex-shrink-0 text-[rgb(var(--text-tertiary))]" />
          )}
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {tNav("appearance")}
          </span>
        </div>
        <AppearanceToggle fullWidth={stacked} />
      </div>
      <div className={cn("gap-3", stacked ? "space-y-1.5" : "flex items-center justify-between")}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Languages className="w-4 h-4 flex-shrink-0 text-[rgb(var(--text-tertiary))]" />
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {tNav("language")}
          </span>
        </div>
        <LanguageToggle fullWidth={stacked} />
      </div>
    </div>
  );
}

// ============================================================================
// MENU ROW BODY — icon tile + title (+ subtitle). The caller supplies the
// interactive wrapper (Headless MenuItem button on desktop, plain button in
// the sheet).
// ============================================================================

export function UserMenuRowBody({
  icon,
  sigName,
  title,
  subtitle,
  danger = false,
}: {
  icon: LucideIcon
  sigName?: IconName
  title: string
  subtitle?: string
  danger?: boolean
}) {
  return (
    <>
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
          danger ? "bg-rust-100 dark:bg-rust-900/30" : "bg-[rgb(var(--background-tertiary))]"
        )}
      >
        <AnimatedIcon
          name={sigName}
          icon={icon}
          size={16}
          applyAccent={false}
          className={danger ? "text-rust-500" : "text-[rgb(var(--text-secondary))]"}
        />
      </div>
      <div className="text-left">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-rust-600 dark:text-rust-400" : "text-[rgb(var(--text-primary))]"
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-[rgb(var(--text-tertiary))]">{subtitle}</p>
        )}
      </div>
    </>
  );
}
