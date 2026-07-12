import { Fragment, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import { motion } from "framer-motion";
import { User, Settings, LogOut, Sun, Moon, Languages } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useThemeStore } from "../../stores/theme.store";
import { useHomeStore } from "../../stores/home.store";
import { useAppStore } from "../../stores/app.store";
import { Avatar } from "@edforge/ui";
import { AnimatedIcon } from "@edforge/ui/motion";
import { normalizePlatformLanguage, useTranslation } from "@edforge/i18n";
import { getGreeting } from "../../lib/greeting";
import { adToBS, formatBSLong } from "@edforge/date-utils";

import { Breadcrumbs } from "./Breadcrumbs";
import { SchoolSwitcher } from "./SchoolSwitcher";

// ============================================================================
// LANGUAGE SLIDING TOGGLE
// ============================================================================

const LANG_OPTIONS = [
  { code: "en", label: "EN", labelKey: "languageEnglish" },
  { code: "ne", label: "NP", labelKey: "languageNepali" },
] as const;

function LanguageToggle() {
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
      className="flex items-center gap-1 p-1 bg-[rgb(var(--background-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]"
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
            className={`relative px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors duration-200 ${
              isActive
                ? "text-[rgb(var(--action-primary-fg))]"
                : "text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
            }`}
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
// HAMBURGER BUTTON
// ============================================================================

function HamburgerButton() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const { t: tNav } = useTranslation("nav");

  return (
    <button
      onClick={toggleSidebar}
      className="shell-touch w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150 cursor-pointer hover:bg-[var(--shell-ni-hover)]"
      aria-label={collapsed ? tNav("expandSidebar") : tNav("collapseSidebar")}
    >
      <div className="flex flex-col gap-1">
        <span
          className="block w-5 h-[1.8px] rounded-sm bg-[var(--shell-hbg-line)]"
          style={{ transition: "background 0.3s" }}
        />
        <span
          className="block w-5 h-[1.8px] rounded-sm bg-[var(--shell-hbg-line)]"
          style={{ transition: "background 0.3s" }}
        />
        <span
          className="block w-5 h-[1.8px] rounded-sm bg-[var(--shell-hbg-line)]"
          style={{ transition: "background 0.3s" }}
        />
      </div>
    </button>
  );
}

// ============================================================================
// APPEARANCE SLIDING TOGGLE — Light | Dark (mirrors LanguageToggle; lives in
// the avatar menu's Preferences group, not the topbar)
// ============================================================================

const THEME_OPTIONS = [
  { code: "light", labelKey: "themeLight" },
  { code: "dark", labelKey: "themeDark" },
] as const;

function AppearanceToggle() {
  const { t: tNav } = useTranslation("nav");
  const { resolvedTheme, setTheme } = useThemeStore();

  const handleSwitch = (code: "light" | "dark") => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTheme(code);
  };

  return (
    <div
      className="flex items-center gap-1 p-1 bg-[rgb(var(--background-tertiary))] rounded-lg border border-[rgb(var(--border-primary))]"
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
            className={`relative px-3 py-1.5 rounded-md text-xs font-bold tracking-wider transition-colors duration-200 ${
              isActive
                ? "text-[rgb(var(--action-primary-fg))]"
                : "text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))]"
            }`}
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
// V2 HOME TOPBAR CENTER — Greeting + Date
// ============================================================================

function HomeTopbarCenter() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation("dashboard");

  const firstName = user?.displayName || user?.name?.split(" ")[0];
  const greeting = getGreeting(firstName, t);

  const dateDisplay = useMemo(() => {
    const now = new Date();

    // BS date
    let bsPart = "";
    try {
      const bs = adToBS(now);
      bsPart = `${formatBSLong(bs)} BS`;
    } catch {
      // Fallback: skip BS date if conversion fails
    }

    // Gregorian date
    const gregPart = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const parts = [bsPart, gregPart].filter(Boolean);
    return parts.join(" · ");
  }, []);

  return (
    <div className="flex items-center gap-0 min-w-0">
      <span
        className="text-[13.5px] font-medium text-[color:var(--shell-text-1)]"
        style={{ transition: "color 0.3s" }}
      >
        {greeting}
      </span>
      <span
        className="text-xs ml-[10px] pl-[10px] border-l text-[color:var(--shell-text-4)] border-[var(--shell-border-color)]"
        style={{ transition: "color 0.3s, border-color 0.3s" }}
      >
        {dateDisplay}
      </span>
    </div>
  );
}

// ============================================================================
// USER MENU — Avatar dropdown (theme picker removed, now in topbar pill)
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { t: tNav } = useTranslation("nav");
  const { resolvedTheme } = useThemeStore();

  if (!user) return null;

  return (
    <Menu as="div" className="relative">
      <MenuButton className="shell-touch flex items-center justify-center rounded-full hover:ring-[rgb(var(--border-focus)/0.50)] transition-all duration-200 ml-1 flex-shrink-0">
        <div className="w-8 h-8 rounded-full overflow-hidden">
          <Avatar name={user.name} size="sm" shape="circle" />
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
                <p className="text-xs text-[rgb(var(--text-tertiary))] truncate">
                  {user.email}
                </p>
                <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-semibold rounded-full bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]  ">
                  {user.globalRole}
                </span>
              </div>
            </div>
          </div>

          {/* Preferences — appearance + language, one consolidated group */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <p className="px-1 mb-2 text-2xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
              {tNav("preferences")}
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-3">
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
                <AppearanceToggle />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Languages className="w-4 h-4 flex-shrink-0 text-[rgb(var(--text-tertiary))]" />
                  <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                    {tNav("language")}
                  </span>
                </div>
                <LanguageToggle />
              </div>
            </div>
          </div>

          <div className="py-2">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() =>
                    navigate({ to: "/settings", search: { tab: "account" } })
                  }
                  className={`ef-motion w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? "bg-[rgb(var(--background-tertiary))]" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--background-tertiary))] flex items-center justify-center">
                    <AnimatedIcon name="account" icon={User} size={16} applyAccent={false} className="text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {tNav("myProfile")}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {tNav("viewEditProfile")}
                    </p>
                  </div>
                </button>
              )}
            </MenuItem>
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() =>
                    navigate({ to: "/settings", search: { tab: "account" } })
                  }
                  className={`ef-motion w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? "bg-[rgb(var(--background-tertiary))]" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--background-tertiary))] flex items-center justify-center">
                    <AnimatedIcon name="settings" icon={Settings} size={16} applyAccent={false} className="text-[rgb(var(--text-secondary))]" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      {tNav("settings")}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-tertiary))]">
                      {tNav("managePreferences")}
                    </p>
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
                  className={`ef-motion w-full flex items-center gap-3 px-4 py-3 transition-colors ${active ? "bg-rust-50 dark:bg-rust-900/20" : ""}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-rust-100 dark:bg-rust-900/30 flex items-center justify-center">
                    <AnimatedIcon icon={LogOut} size={16} applyAccent={false} className="text-rust-500" />
                  </div>
                  <span className="text-sm font-medium text-rust-600 dark:text-rust-400">
                    {tNav("signOut")}
                  </span>
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}

// ============================================================================
// MAIN HEADER COMPONENT — Shell V2 Three-Zone Layout
// ============================================================================

export function Header() {
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const isHomeV2 = useHomeStore((s) => s.isHomeV2Active);
  const { t: tNav } = useTranslation("nav");

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[45] flex items-center h-[var(--shell-topbar-h)] bg-[var(--shell-page-bg)]"
      style={{ transition: "background 0.3s" }}
      aria-label={tNav("globalHeader")}
    >
      {/* LEFT ZONE: width tracks sidebar for visual alignment */}
      <div
        className={`flex items-center gap-1 flex-shrink-0 overflow-hidden pl-4 ${collapsed ? "w-[var(--shell-sidebar-w-collapsed)]" : "w-[var(--shell-sidebar-w)]"}`}
        style={{ transition: "width var(--shell-transition)" }}
      >
        <HamburgerButton />
        {!collapsed && <SchoolSwitcher />}
      </div>

      {/* CENTER ZONE: Greeting (home) or Breadcrumbs (modules) — flex:1 */}
      <div className="flex-1 flex items-center px-4 min-w-0">
        {isHomeV2 ? <HomeTopbarCenter /> : <Breadcrumbs />}
      </div>

      {/* RIGHT ZONE: User avatar (theme moved into the avatar menu) */}
      <div className="flex items-center flex-shrink-0 pr-4">
        <UserMenu />
      </div>
    </header>
  );
}
