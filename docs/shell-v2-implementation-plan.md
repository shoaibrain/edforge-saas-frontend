# Shell V2 Redesign — Implementation Plan

**Based on:** [shell-v2-audit.md](shell-v2-audit.md) + prototype `edforge_shell_v2_home.html`

---

## Execution Sequence

```
Phase 1: Token Foundation (index.css)
   |
Phase 2: AppShell.tsx — layout restructure
   |
Phase 3: Sidebar.tsx — pill nav, remove borders, CSS transition, extract school selector
   |
Phase 4: SchoolSwitcher.tsx (NEW) — extracted from Sidebar, adapted for topbar
   |
Phase 5: Header.tsx — 3-zone layout, hamburger, theme pill, receive school switcher
   |
Phase 6: Cleanup — remove SidebarEdgeTrigger, update sidebar-modules.ts
```

---

## Files to Modify

### 1. `apps/shell/src/index.css` (Phase 1)

**After line 27** — append shell V2 tokens block.

Add `:root` and `.dark` blocks with all shell layout tokens. These are shell-scoped (NOT in `packages/theme/src/base.css`).

```css
/* ============================================================================
 * SHELL V2 LAYOUT TOKENS — Gmail-inspired inset card pattern
 * ============================================================================ */
:root {
  --shell-page-bg: #f0f4f9;
  --shell-cp-bg: #ffffff;
  --shell-cp-shadow: 0 1px 3px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(0,0,0,0.07);
  --shell-cp-radius: 16px;
  --shell-cp-gap: 12px;
  --shell-sidebar-w: 240px;
  --shell-sidebar-w-collapsed: 68px;
  --shell-topbar-h: 56px;
  --shell-transition: 220ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Nav pill colors */
  --shell-ni-hover: rgba(0,0,0,0.06);
  --shell-pill-teal-bg: rgba(29,158,117,0.14);
  --shell-pill-teal-text: #0d5c42;
  --shell-pill-teal-icon: #0f6e56;
  --shell-pill-amber-bg: rgba(239,159,39,0.14);
  --shell-pill-amber-text: #6b3d0a;
  --shell-pill-amber-icon: #854f0b;
  --shell-pill-coral-bg: rgba(216,90,48,0.13);
  --shell-pill-coral-text: #5a1a05;
  --shell-pill-coral-icon: #712b13;
  --shell-pill-blue-bg: rgba(55,138,221,0.13);
  --shell-pill-blue-text: #0c447c;
  --shell-pill-blue-icon: #185fa5;

  /* Shell text & misc */
  --shell-text-1: #1f2328;
  --shell-text-2: #444746;
  --shell-text-3: #5f6368;
  --shell-text-4: #9aa0b8;
  --shell-icon-color: #5f6368;
  --shell-sec-lbl: #5f6368;
  --shell-divider: rgba(0,0,0,0.08);
  --shell-notif-border: #f0f4f9;
  --shell-theme-pill-bg: rgba(0,0,0,0.04);
  --shell-border-color: rgba(0,0,0,0.08);
  --shell-school-name: #1f2328;
  --shell-school-code: #6e7680;
  --shell-hbg-line: #5f6368;
}

.dark {
  --shell-page-bg: #0a0d14;
  --shell-cp-bg: #161b27;
  --shell-cp-shadow: 0 1px 6px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.07);

  --shell-ni-hover: rgba(255,255,255,0.06);
  --shell-pill-teal-bg: rgba(29,158,117,0.17);
  --shell-pill-teal-text: #1D9E75;
  --shell-pill-teal-icon: #1D9E75;
  --shell-pill-amber-bg: rgba(239,159,39,0.16);
  --shell-pill-amber-text: #EF9F27;
  --shell-pill-amber-icon: #EF9F27;
  --shell-pill-coral-bg: rgba(216,90,48,0.15);
  --shell-pill-coral-text: #D85A30;
  --shell-pill-coral-icon: #D85A30;
  --shell-pill-blue-bg: rgba(55,138,221,0.16);
  --shell-pill-blue-text: #378ADD;
  --shell-pill-blue-icon: #378ADD;

  --shell-text-1: #e8eaf0;
  --shell-text-2: #c8ccd8;
  --shell-text-3: #9aa0b8;
  --shell-text-4: #4a5068;
  --shell-icon-color: #9aa0b8;
  --shell-sec-lbl: #4a5068;
  --shell-divider: rgba(255,255,255,0.07);
  --shell-notif-border: #0a0d14;
  --shell-theme-pill-bg: rgba(255,255,255,0.04);
  --shell-border-color: rgba(255,255,255,0.07);
  --shell-school-name: #e8eaf0;
  --shell-school-code: #4a5068;
  --shell-hbg-line: #9aa0b8;
}
```

---

### 2. `apps/shell/src/components/layout/AppShell.tsx` (Phase 2)

**Rewrite entire component (65 lines → ~65 lines)**

| Line(s) | Current | Change |
|---------|---------|--------|
| 3 | `import { motion } from 'framer-motion'` | **Remove** — no longer needed |
| 36 | `<div className="min-h-screen bg-[rgb(var(--surface-primary))]">` | Change to `<div className="h-screen overflow-hidden" style={{ background: 'var(--shell-page-bg)', transition: 'background 0.3s' }}>` |
| 44-46 | `<motion.div animate={{ marginLeft: collapsed ? 72 : 260 }} transition={{ type: 'spring', ... }} className="flex flex-col min-h-screen">` | Replace with plain `<div>` using CSS transition on `margin-left` |
| 53-61 | `<main className="relative flex-1 overflow-x-clip outline-none">` | Wrap in a card container div with `border-radius`, `box-shadow`, `overflow: hidden`, `position: relative`. Add `padding: 0 12px 12px 0` on the body-wrap for the 3-sided inset gap. |

**New structure:**

```tsx
<div className="h-screen overflow-hidden"
     style={{ background: 'var(--shell-page-bg)', transition: 'background 0.3s' }}>
  <SkipLink targetId="main-content" />
  <Sidebar />

  <div
    className="flex flex-col h-screen"
    style={{
      marginLeft: collapsed
        ? 'var(--shell-sidebar-w-collapsed)'
        : 'var(--shell-sidebar-w)',
      transition: 'margin-left var(--shell-transition)',
    }}
  >
    <Header />

    {/* Body wrap — creates 3-sided inset gap */}
    <div className="flex-1 min-h-0"
         style={{ padding: '0 var(--shell-cp-gap) var(--shell-cp-gap) 0' }}>
      {/* Content card */}
      <main
        id="main-content"
        tabIndex={-1}
        className="h-full overflow-y-auto overflow-x-hidden outline-none"
        style={{
          background: 'var(--shell-cp-bg)',
          borderRadius: 'var(--shell-cp-radius)',
          boxShadow: 'var(--shell-cp-shadow)',
          position: 'relative',       /* LOAD-BEARING: drawer positioning */
          transition: 'background 0.3s, box-shadow 0.3s',
        }}
        aria-label="Main content"
      >
        {children}
        <SchoolTransitionOverlay />
      </main>
    </div>
  </div>
</div>
```

---

### 3. `apps/shell/src/components/layout/Sidebar.tsx` (Phase 3)

**Major changes across all 863 lines. Grouped by concern:**

#### 3A. Sidebar `<aside>` element (lines 816-819)

| Property | Current | Change |
|----------|---------|--------|
| Element | `<motion.aside animate={{ width: ... }}>` | Plain `<aside>` with CSS transition |
| Width expanded | 260px | `var(--shell-sidebar-w)` (240px) |
| Width collapsed | 72px | `var(--shell-sidebar-w-collapsed)` (68px) |
| Background | `bg-[rgb(var(--surface-secondary))]` | `background: var(--shell-page-bg)` (seamless) |
| Border | `border-r border-[rgb(var(--border-primary))]` | **REMOVE** |
| Animation | Framer Motion spring `{ stiffness: 280, damping: 32 }` | CSS `transition: width var(--shell-transition)` |

#### 3B. Remove school selector section (lines 822-825)

**Delete:**
```tsx
<div className="flex items-center h-16 px-2 border-b border-[rgb(var(--border-primary))]">
  <SidebarSchoolSelector collapsed={collapsed} />
</div>
```

**Replace with spacer:**
```tsx
<div style={{ height: 'var(--shell-topbar-h)' }} aria-hidden />
```

#### 3C. Remove left accent bar from NavItemLink (lines 147-162)

**Delete entirely:**
```tsx
{/* Active indicator line */}
{isActive && (
  <motion.div
    layoutId="activeIndicator"
    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full
               bg-gradient-to-b from-teal-500 to-cyan-500"
    ...
  />
)}
```

#### 3D. Change active background pill shape (lines 128-145)

- Line 133: `rounded-xl` → `rounded-3xl` (24px pill)
- Line 136: `bg-[rgb(var(--interactive-active))]` → module-specific bg via inline style

#### 3E. Change nav item container (lines 123-126)

- Add `mx-2 my-[1px]` for sidebar inset margins
- Change `rounded-xl` → `rounded-3xl`

#### 3F. Module-specific active colors

Currently active text is hardcoded `text-teal-700 dark:text-white` (line 182). Change to use a `moduleAccent` prop/context that maps to the shell pill tokens.

**Module-to-accent mapping** (resolve in Sidebar component using `moduleId`):

| Module | Accent Key | CSS Vars |
|--------|-----------|----------|
| home, home-student, home-parent, academics, student-portal | `teal` | `--shell-pill-teal-*` |
| finance | `amber` | `--shell-pill-amber-*` |
| people | `coral` | `--shell-pill-coral-*` |
| settings | `blue` | `--shell-pill-blue-*` |

Pass accent key as prop through `NavGroup` → `NavItemLink`.

#### 3G. Remove left accent bar from HomeNavButton (lines 349-361)

Same as 3C — delete the `activeIndicator` layoutId block.

#### 3H. AnimatedNavIcon active color (lines 66-70)

- Line 68: `text-teal-700 dark:text-white` → use module accent inline style
- Lines 80-83: Glow effect `bg-teal-500/25 dark:bg-cyan-500/25` → use module accent with opacity

#### 3I. Remove SidebarEdgeTrigger (line 860)

Delete: `<SidebarEdgeTrigger collapsed={collapsed} onToggle={toggleSidebar} />`

Remove import (line 36): `import { SidebarEdgeTrigger } from './SidebarEdgeTrigger'`

#### 3J. Group label style (line 259)

Keep uppercase for now (matches existing convention). Minor change if needed:
- Currently: `text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]`
- Target: `font-size: 10.5px; font-weight: 500; color: var(--shell-sec-lbl)`

---

### 4. `apps/shell/src/components/layout/SchoolSwitcher.tsx` (Phase 4 — NEW FILE)

**Extract from Sidebar.tsx lines 411-789, adapt for topbar.**

~200 lines. Key changes from the sidebar version:

| Aspect | Sidebar Version | Topbar Version |
|--------|----------------|----------------|
| `collapsed` prop | Controls tooltip/compact mode | **Removed** — always shows name |
| Trigger height | `h-12` | `h-10` |
| Trigger style | Full sidebar width, rounded-xl | Compact, rounded-lg, hover bg |
| Avatar size | 40px | 28px rounded-lg |
| School name | Full width | `max-w-[160px] truncate` |
| Dropdown position | `absolute left-0 top-full mt-2` (expanded) or `left-full top-0 ml-3` (collapsed) | `absolute left-0 top-full mt-2` only |
| Dropdown width | `w-80` | `w-80` (keep) |

**Keep all business logic unchanged:** role-based filtering, school switching, search, create school, loading/empty states.

---

### 5. `apps/shell/src/components/layout/Header.tsx` (Phase 5)

**Major restructure of main `Header()` component (lines 314-336)**

#### 5A. Header element (line 320)

| Property | Current | Change |
|----------|---------|--------|
| Height | `h-16` (64px) | `var(--shell-topbar-h)` (56px) |
| Background | `bg-[rgb(var(--surface-secondary))]` | `background: var(--shell-page-bg)` (seamless) |
| Border | `border-b border-[rgb(var(--border-primary))]` | **REMOVE** |
| z-index | `z-30` | `z-30` (keep — topbar is below sidebar z-40 which is correct) |

#### 5B. Three-zone layout

**Replace current two-section layout with three zones:**

```
[LEFT: hamburger + SchoolSwitcher]  |  [CENTER: greeting/breadcrumbs flex-1]  |  [RIGHT: ThemePill + NotificationBadge + UserMenu]
```

#### 5C. Add hamburger button (NEW)

First element in left zone. Uses `useAppStore` → `toggleSidebar`.

```tsx
<button
  onClick={toggleSidebar}
  className="w-10 h-10 rounded-full flex items-center justify-center
             hover:bg-[var(--shell-ni-hover)] transition-colors"
  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
>
  <div className="flex flex-col gap-1">
    <span className="block w-[18px] h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)' }} />
    <span className="block w-[18px] h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)' }} />
    <span className="block w-[18px] h-[1.8px] rounded-sm" style={{ background: 'var(--shell-hbg-line)' }} />
  </div>
</button>
```

#### 5D. Add ThemePill component (NEW, ~40 lines)

Standalone `Light|Dark` pill toggle in the right zone (before notification bell):

```tsx
function ThemePill() {
  const { resolvedTheme, setTheme } = useThemeStore()
  return (
    <div className="flex items-center gap-0.5 p-[3px] rounded-2xl border-[0.5px]"
         style={{ background: 'var(--shell-theme-pill-bg)', borderColor: 'var(--shell-border-color)' }}>
      <button
        className={cn('px-2.5 py-[3px] rounded-xl text-[10px] font-medium transition-all',
          resolvedTheme === 'light'
            ? 'bg-[var(--shell-cp-bg)] text-[var(--shell-text-1)] shadow-sm'
            : 'text-[var(--shell-text-3)]'
        )}
        onClick={() => setTheme('light')}
      >Light</button>
      <button
        className={cn('px-2.5 py-[3px] rounded-xl text-[10px] font-medium transition-all',
          resolvedTheme === 'dark'
            ? 'bg-[var(--shell-cp-bg)] text-[var(--shell-text-1)] shadow-sm'
            : 'text-[var(--shell-text-3)]'
        )}
        onClick={() => setTheme('dark')}
      >Dark</button>
    </div>
  )
}
```

#### 5E. NotificationBadge (lines 139-170)

- Line 330: Remove `{isHomeV2 && ...}` guard — always show notification badge
- Replace hardcoded dark rgba styles (lines 148-151) with shell tokens
- Notification dot border: `border: 2px solid var(--shell-notif-border)` (matches page bg)

#### 5F. UserMenu cleanup (lines 228-252)

Remove the "Quick Preferences: Theme + Language" section from the dropdown since theme toggle moves to topbar. Keep language toggle inside the dropdown menu.

---

### 6. `apps/shell/src/config/sidebar-modules.ts` (Phase 6)

**Add `accentKey` to `ModuleConfig` interface (line 96-102):**

```ts
export interface ModuleConfig {
  id: SidebarModule
  title: string
  icon?: LucideIcon
  accentKey: 'teal' | 'amber' | 'coral' | 'blue'  // NEW — maps to --shell-pill-{key}-*
  backTo?: { path: string; label: string }
  groups: NavItemGroup[]
}
```

**Set on each module:**

| Module | Line | `accentKey` |
|--------|------|-------------|
| `homeModule` | 125 | `'teal'` |
| `studentHomeModule` | 203 | `'teal'` |
| `parentHomeModule` | 281 | `'teal'` |
| `settingsModule` | 366 | `'blue'` |
| `academicsModule` | 506 | `'teal'` |
| `financeModule` | 554 | `'amber'` |
| `peopleModule` | 590 | `'coral'` |
| `studentPortalModule` | 668 | `'teal'` |
| `parentPortalModule` | 724 | `'teal'` |

---

## Files to Create

| File | Purpose |
|------|---------|
| `apps/shell/src/components/layout/SchoolSwitcher.tsx` | School selector extracted from Sidebar, adapted for topbar placement (~200 lines) |

## Files NOT to Touch

| Path | Reason |
|------|--------|
| `packages/theme/src/base.css` | Global tokens shared by ALL apps — remote apps depend on these |
| `packages/theme/src/*.css` | Shared theme — no changes |
| `packages/ui/` | Shared component library |
| `apps/academics/` | Remote app — renders inside content pane unchanged |
| `apps/finance/` | Remote app |
| `apps/people/` | Remote app |
| `apps/shell/rsbuild.config.ts` | Module Federation config — no changes needed |
| `apps/shell/src/router.tsx` | Routing logic — purely visual redesign |
| `apps/shell/src/stores/app.store.ts` | Already has `sidebarCollapsed` + `toggleSidebar` — no changes needed |
| `apps/shell/src/stores/theme.store.ts` | Already has theme system — no changes needed |
| `apps/shell/src/stores/sidebar.store.ts` | Module transition state — no changes needed |
| `apps/shell/src/config/sidebar-modules.ts` | Only adding `accentKey` field — no structural changes |

## Framer Motion Migration Strategy

The current codebase uses Framer Motion extensively. We do NOT remove all of it — only the layout-level animations that should be CSS transitions:

| Animation | Current | New | Rationale |
|-----------|---------|-----|-----------|
| Sidebar width | `motion.aside animate={{ width }}` spring | CSS `transition: width 220ms` | Layout animation — CSS is simpler and more performant |
| Content margin | `motion.div animate={{ marginLeft }}` spring | CSS `transition: margin-left 220ms` | Layout animation |
| Nav item hover bg | `motion.div animate={{ backgroundColor }}` | **Keep** Framer Motion | Micro-interaction — spring feels better |
| Nav item label show/hide | `AnimatePresence` + `motion.span` | **Keep** Framer Motion | Collapse animation needs AnimatePresence |
| Active pill `layoutId` | `motion.div layoutId="activeNavBg"` | **Keep** Framer Motion | Smooth pill transition between items |
| Module transition | `motion.div` on nav container | **Keep** Framer Motion | Module switch animation |

---

## Testing Plan (post-implementation)

1. **Build check:** `cd apps/shell && npm run build` — must compile
2. **Remote app builds:** academics, finance, people — must compile unchanged
3. **Visual verification:** Compare against prototype HTML in both light/dark themes
4. **Sidebar collapse:** Toggle → 68px rail, labels hidden, icons centered, persists on refresh
5. **Theme toggle:** Light ↔ Dark via topbar pill, smooth 0.3s transitions
6. **School switcher:** Dropdown opens from topbar, search works, role-based filtering works
7. **Content card:** 16px radius, shadow visible, content clips to rounded corners
8. **Inset gap:** 12px visible on right, bottom; sidebar flush left
9. **Drawer compatibility:** Open student quick profile → drawer renders inside content pane
10. **Nav pills:** Module-specific colors (teal for home/academics, amber for finance, coral for people, blue for settings)
11. **Responsive:** KPI tiles reflow, sidebar auto-collapses at ≤1024px
