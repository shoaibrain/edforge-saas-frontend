import { Fragment, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import { User, Settings, LogOut, ChevronLeft } from "lucide-react";
import { useAuthStore } from "../../stores/auth.store";
import { useHomeStore } from "../../stores/home.store";
import { useAppStore } from "../../stores/app.store";
import { useNavStore } from "../../stores/nav.store";
import { Avatar, useBreakpoint } from "@edforge/ui";
import { useTranslation } from "@edforge/i18n";
import { getGreeting } from "../../lib/greeting";
import { adToBS, formatBSLong } from "@edforge/date-utils";
import { deriveAppBarState } from "../../lib/mobile-nav";
import { usePathname } from "../../hooks/useSidebarModule";
import { useBreadcrumbTrail } from "../../hooks/useBreadcrumbTrail";
import { useActiveSchool } from "../../hooks/useActiveSchool";

import { Breadcrumbs } from "./Breadcrumbs";
import { SchoolSwitcher } from "./SchoolSwitcher";
import { AccountSheet } from "./AccountSheet";
import { SchoolSheet } from "./SchoolSheet";
import {
  UserIdentityCard,
  PreferencesRows,
  UserMenuRowBody,
} from "./UserMenuContent";

// ============================================================================
// HAMBURGER BUTTON — desktop: collapses the sidebar; tablet / phone drawer
// variant: opens the nav drawer (caller passes onPress + ariaLabel).
// ============================================================================

function HamburgerButton({
  onPress,
  ariaLabel,
}: {
  onPress?: () => void;
  ariaLabel?: string;
}) {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const { t: tNav } = useTranslation("nav");

  const label =
    ariaLabel ?? (collapsed ? tNav("expandSidebar") : tNav("collapseSidebar"));

  return (
    <button
      onClick={onPress ?? toggleSidebar}
      className="shell-touch w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-150 cursor-pointer hover:bg-[var(--shell-ni-hover)]"
      aria-label={label}
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
// BS · AD DATE DISPLAY — shared by the desktop greeting and the phone app bar
// ============================================================================

function useBsAdDateDisplay(): string {
  return useMemo(() => {
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
}

// ============================================================================
// V2 HOME TOPBAR CENTER — Greeting + Date
// ============================================================================

function HomeTopbarCenter() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation("dashboard");

  const firstName = user?.displayName || user?.name?.split(" ")[0];
  const greeting = getGreeting(firstName, t);
  const dateDisplay = useBsAdDateDisplay();

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
// USER MENU — Avatar dropdown (desktop/tablet). Content pieces are shared
// with the phone AccountSheet via UserMenuContent.tsx.
// ============================================================================

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { t: tNav } = useTranslation("nav");

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
          <UserIdentityCard user={user} />

          {/* Preferences — appearance + language, one consolidated group */}
          <div className="px-4 py-3 border-b border-[rgb(var(--border-secondary))]">
            <p className="px-1 mb-2 text-2xs font-bold uppercase tracking-wider text-[rgb(var(--text-tertiary))]">
              {tNav("preferences")}
            </p>
            <PreferencesRows layout="inline" />
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
                  <UserMenuRowBody
                    icon={User}
                    sigName="account"
                    title={tNav("myProfile")}
                    subtitle={tNav("viewEditProfile")}
                  />
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
                  <UserMenuRowBody
                    icon={Settings}
                    sigName="settings"
                    title={tNav("settings")}
                    subtitle={tNav("managePreferences")}
                  />
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
                  <UserMenuRowBody icon={LogOut} title={tNav("signOut")} danger />
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
// PHONE APP BAR (< 640px) — composition tracks route depth:
// home → greeting + BS·AD date; module root → module title + school;
// deeper → back chevron + page title + school. Right side: avatar (account
// sheet). The notification bell mounts as a sibling before the avatar once a
// notifications source exists.
// ============================================================================

function PhoneHomeTitle() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation("dashboard");
  const firstName = user?.displayName || user?.name?.split(" ")[0];
  const greeting = getGreeting(firstName, t);
  const dateDisplay = useBsAdDateDisplay();

  return (
    <div className="min-w-0">
      <p className="shell-appbar-title truncate">{greeting}</p>
      <p className="shell-appbar-sub truncate">{dateDisplay}</p>
    </div>
  );
}

function PhoneAppBar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const variant = useNavStore((s) => s.variant);
  const openDrawer = useNavStore((s) => s.openDrawer);
  const trail = useBreadcrumbTrail();
  const { activeSchool, canSwitch } = useActiveSchool();
  const { t: tNav } = useTranslation("nav");
  const [accountOpen, setAccountOpen] = useState(false);
  const [schoolOpen, setSchoolOpen] = useState(false);

  const appBar = deriveAppBarState(pathname);

  const title =
    appBar.kind === "module-root"
      ? tNav(`module.${appBar.moduleId}`)
      : appBar.kind === "subpage"
        ? (trail[trail.length - 1]?.label ?? tNav(`module.${appBar.moduleId}`))
        : "";

  const schoolSubtitle =
    activeSchool &&
    (canSwitch ? (
      <button
        type="button"
        onClick={() => setSchoolOpen(true)}
        className="shell-appbar-sub truncate block max-w-full text-left"
        aria-label={tNav("switchSchool")}
      >
        {activeSchool.name}
      </button>
    ) : (
      <p className="shell-appbar-sub truncate">{activeSchool.name}</p>
    ));

  return (
    <>
      <header className="shell-appbar" aria-label={tNav("globalHeader")}>
        {variant === "drawer" && (
          <HamburgerButton onPress={openDrawer} ariaLabel={tNav("openNavigation")} />
        )}

        {appBar.kind === "subpage" && (
          <Link
            to={appBar.backTo}
            aria-label={tNav("back")}
            className="shell-touch flex items-center justify-center rounded-full flex-shrink-0 text-[color:var(--shell-text-2)]"
          >
            <ChevronLeft size={22} strokeWidth={2.25} />
          </Link>
        )}

        <div className="flex-1 min-w-0 px-2">
          {appBar.kind === "home" ? (
            <PhoneHomeTitle />
          ) : (
            <div className="min-w-0">
              <p className="shell-appbar-title truncate">{title}</p>
              {schoolSubtitle}
            </div>
          )}
        </div>

        {/* Right zone — future notification bell mounts here, before the avatar */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {user && (
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label={tNav("account")}
              className="shell-touch flex items-center justify-center rounded-full"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Avatar name={user.name} size="sm" shape="circle" />
              </div>
            </button>
          )}
        </div>
      </header>

      <AccountSheet open={accountOpen} onClose={() => setAccountOpen(false)} />
      <SchoolSheet open={schoolOpen} onClose={() => setSchoolOpen(false)} />
    </>
  );
}

// ============================================================================
// MAIN HEADER COMPONENT — phone renders the app bar; tablet keeps the
// three-zone header with a content-sized left zone (no sidebar) and a
// hamburger that opens the nav drawer; desktop is unchanged.
// ============================================================================

export function Header() {
  const bp = useBreakpoint();
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const isHomeV2 = useHomeStore((s) => s.isHomeV2Active);
  const openDrawer = useNavStore((s) => s.openDrawer);
  const { t: tNav } = useTranslation("nav");

  if (bp === "phone") {
    return <PhoneAppBar />;
  }

  const isTablet = bp === "tablet";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-[45] flex items-center h-[var(--shell-topbar-h)] bg-[var(--shell-page-bg)]"
      style={{ transition: "background 0.3s" }}
      aria-label={tNav("globalHeader")}
    >
      {/* LEFT ZONE: width tracks the sidebar on desktop; content-sized on
          tablet where the sidebar is hidden and the hamburger opens the
          drawer instead */}
      <div
        className={`flex items-center gap-1 flex-shrink-0 overflow-hidden pl-4 ${
          isTablet
            ? "w-auto"
            : collapsed
              ? "w-[var(--shell-sidebar-w-collapsed)]"
              : "w-[var(--shell-sidebar-w)]"
        }`}
        style={isTablet ? undefined : { transition: "width var(--shell-transition)" }}
      >
        {isTablet ? (
          <>
            <HamburgerButton onPress={openDrawer} ariaLabel={tNav("openNavigation")} />
            <SchoolSwitcher />
          </>
        ) : (
          <>
            <HamburgerButton />
            {!collapsed && <SchoolSwitcher />}
          </>
        )}
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
