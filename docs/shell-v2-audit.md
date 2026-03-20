# Shell V2 Redesign — Audit Report

**Date:** 2026-03-20
**Scope:** apps/shell/ only — visual layer redesign to Gmail-inspired inset card pattern

---

## 1. Shell File Structure

### Layout Components (files to modify)

| File | Purpose | Lines |
|------|---------|-------|
| `apps/shell/src/components/layout/AppShell.tsx` | Shell container — wraps Sidebar + Header + content | 65 |
| `apps/shell/src/components/layout/Sidebar.tsx` | Fixed sidebar with nav items, school selector, edge trigger | 863 |
| `apps/shell/src/components/layout/Header.tsx` | Sticky topbar — greeting, breadcrumbs, user menu | 336 |

### State Management

| File | Purpose |
|------|---------|
| `apps/shell/src/stores/app.store.ts` | `sidebarCollapsed`, `toggleSidebar()` — persisted via **cookie** (key: `edforge-app`) |
| `apps/shell/src/stores/theme.store.ts` | `theme: 'light'|'dark'|'system'`, `resolvedTheme` — persisted via Zustand persist (key: `edforge-theme`) |
| `apps/shell/src/stores/sidebar.store.ts` | `currentModule`, `isTransitioning`, `transitionDirection` — NOT persisted |

### Style Files

| File | Purpose |
|------|---------|
| `apps/shell/src/index.css` | Entry point — imports `@edforge/theme`, `home-v2-tokens.css`, `home-v2-animations.css` |
| `apps/shell/src/styles/home-v2-tokens.css` | V2 design tokens scoped to `[data-page="home-v2"]` and `[data-v2]` (192 lines) |
| `apps/shell/src/styles/home-v2-animations.css` | Skeleton/bar-fill animations (36 lines) |
| `packages/theme/src/base.css` | **Global** CSS custom properties — `--surface-*`, `--text-*`, `--border-*`, `--interactive-*` using RGB triplets |

### Config Files

| File | Purpose |
|------|---------|
| `apps/shell/src/config/sidebar-modules.ts` | Nav item definitions — all modules, groups, items, ABAC permissions |
| `apps/shell/rsbuild.config.ts` | Module Federation config (Rsbuild + Rspack), remotes: academics:3002, people:3006, finance:3003 |

---

## 2. Current Layout Architecture

### AppShell.tsx (L1-65)

```
Structure:
  <div className="min-h-screen bg-[rgb(var(--surface-primary))]">
    <Sidebar />                          ← position: fixed, left: 0, z-40
    <motion.div marginLeft={collapsed ? 72 : 260}>  ← Framer Motion spring animation
      <Header />                         ← sticky, z-30
      <main className="relative flex-1 overflow-x-clip">
        {children}                       ← Page content (Outlet)
        <SchoolTransitionOverlay />      ← position: absolute inset-0
      </main>
    </motion.div>
  </div>
```

**Layout Method:** NOT CSS Grid. Uses Framer Motion `marginLeft` animation on a flex column.
**Sidebar positioning:** `position: fixed` (not in document flow).
**Content area:** Margin-based offset from sidebar.

### Key Current Values

| Element | Property | Current Value | Target Value |
|---------|----------|---------------|--------------|
| **Shell container** | layout | Framer Motion marginLeft | CSS Grid `56px 1fr` rows |
| **Topbar** | height | `h-16` (64px) | 56px |
| **Topbar** | background | `bg-[rgb(var(--surface-secondary))]` (white/teal-dark) | `var(--page-bg)` (#f0f4f9/#0a0d14) |
| **Topbar** | border-bottom | `border-b border-[rgb(var(--border-primary))]` | **NONE** |
| **Topbar** | position | `sticky top-0 z-30` | Part of grid row, z-50 |
| **Sidebar** | width (expanded) | 260px | 240px |
| **Sidebar** | width (collapsed) | 72px | 68px |
| **Sidebar** | background | `bg-[rgb(var(--surface-secondary))]` | `var(--sidebar-bg)` (#f0f4f9/#0a0d14) |
| **Sidebar** | border-right | `border-r border-[rgb(var(--border-primary))]` | **NONE** |
| **Sidebar** | position | `fixed left-0 top-0 bottom-0 z-40` | flex child, z-40 |
| **Sidebar** | animation | Framer Motion spring `{ stiffness: 280, damping: 32 }` | CSS `transition: width 220ms cubic-bezier(0.4,0,0.2,1)` |
| **Content pane** | border-radius | 0 | 16px |
| **Content pane** | box-shadow | none | `var(--cp-shadow)` |
| **Content pane** | background | inherits from parent | `var(--cp-bg)` (#fff/#161b27) |
| **Content pane** | overflow | `overflow-x-clip` | `overflow: hidden; overflow-y: auto` |
| **Content pane** | position | `relative` ✓ | `relative` (keep) |
| **Content pane** | inset gap | 0 | `padding: 0 12px 12px 0` on body-wrap |

---

## 3. Sidebar Component Analysis

### Nav Item Active State (Sidebar.tsx L116-162)
- **Active background:** `<motion.div layoutId="activeNavBg" className="absolute inset-0 rounded-xl bg-[rgb(var(--interactive-active))]" />`
- **Left accent bar:** `<motion.div layoutId="activeIndicator" className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-teal-500 to-cyan-500" />`
- **Active text:** `text-teal-700 dark:text-white`
- **Active icon:** `text-teal-700 dark:text-white`
- **Shape:** `rounded-xl` (12px radius)

**Target changes:**
- Remove `activeIndicator` left bar entirely
- Change `rounded-xl` → `rounded-[24px]` (full pill)
- Add module-specific active colors (teal/amber/coral/blue) instead of single teal
- Change active text to module-specific colors
- Add `margin: 1px 8px` inset from sidebar edges
- Change font-weight to 600 for active labels

### Nav Rendering (Sidebar.tsx L266-274)
- Items rendered via `NavGroup` → `NavItemLink` components
- Uses config array from `sidebar-modules.ts`
- Active state detected via `useActiveNavItem()` hook
- Group labels: `text-[10px] font-semibold uppercase tracking-wider text-[rgb(var(--text-tertiary))]`

### School Selector Location
- **Currently:** In sidebar (`SidebarSchoolSelector` at Sidebar.tsx L411-789)
- **Target:** Move to topbar, next to hamburger button
- **Complexity:** HIGH — the `SidebarSchoolSelector` is 378 lines with dropdown, search, role-based behavior, loading states, empty states. This component needs to be extracted and adapted for topbar placement.

### Section Labels
- Current: `text-[10px] font-semibold uppercase tracking-wider`
- Target: `font-size: 10.5px; font-weight: 500; sentence-case` (NOT uppercase)

---

## 4. Topbar Component Analysis (Header.tsx)

### Current Structure (L314-335)
```jsx
<header className="sticky top-0 z-30 h-16 px-6 flex items-center justify-between
                    border-b border-[rgb(var(--border-primary))]
                    bg-[rgb(var(--surface-secondary))]">
  <div> {isHomeV2 ? <HomeTopbarLeft /> : <Breadcrumbs />} </div>
  <div> {isHomeV2 && <NotificationBadge />} <UserMenu /> </div>
</header>
```

**Target three-zone layout:**
```
[hamburger] [school-switcher] | [greeting/breadcrumbs center — flex:1] | [theme-pill] [notification] [avatar]
```

### Theme Toggle
- **Currently:** Inside `UserMenu` dropdown (Header.tsx L228-252) — Sun/Moon/Monitor icons
- **Target:** Standalone `Light|Dark` pill toggle in topbar right zone (before notification bell)

### Notification Badge (Header.tsx L139-169)
- Currently only shows when `isHomeV2Active` is true
- Uses hardcoded dark-theme styles (rgba bg, border)
- Needs to always be visible and use theme tokens

---

## 5. Theme System

### Mechanism
- **Toggle:** `.dark` class on `document.documentElement` + `colorScheme` style
- **Store:** `useThemeStore` — supports `'light' | 'dark' | 'system'`
- **Detection:** `applyTheme()` adds/removes `.dark` class on root

### Token Format
- **Global tokens** (`packages/theme/src/base.css`): Use RGB triplets — e.g., `--surface-primary: 251 249 245` consumed as `rgb(var(--surface-primary))`
- **V2 tokens** (`home-v2-tokens.css`): Use hex/rgba — e.g., `--v2-bg-app: #0f1117` — scoped to `[data-page="home-v2"]` and `[data-v2]`

### Token Mapping Strategy
The shell V2 tokens should be added as **new global CSS properties** in the shell's `index.css` (NOT in the theme package, which is shared by all apps). They should use the same `[data-theme]` or `.dark` switching mechanism.

**Existing tokens to update (or leave as-is for remote apps):**

| Current Token | Current Value (Light) | New Shell V2 Value | Notes |
|---|---|---|---|
| `--surface-primary` | `251 249 245` (warm off-white) | Keep for remote apps | Shell uses new `--page-bg` instead |
| `--surface-secondary` | `255 255 255` | Keep for remote apps | Shell uses new `--cp-bg` instead |

**Decision:** Add NEW shell-specific tokens rather than modifying the global theme, to avoid breaking remote app styling. The shell layout elements will use the new tokens directly.

---

## 6. Content Pane Safety Check

### position: relative
- **Current:** `<main className="relative flex-1 overflow-x-clip">` — ✅ HAS `relative`
- The `SchoolTransitionOverlay` uses `absolute inset-0` inside this element — confirms `position: relative` is load-bearing.

### overflow
- **Current:** `overflow-x-clip` only (no `overflow: hidden` or `overflow-y: auto`)
- **Target:** `overflow: hidden; overflow-y: auto` — needed for border-radius clipping AND scroll

### Drawers
- `BaseModal.tsx` uses `createPortal(content, document.body)` with `position: fixed inset-0 z-50`
- Modals portal to `document.body` → unaffected by content-pane changes ✅
- `SchoolTransitionOverlay` uses `absolute inset-0 z-10` inside content pane → works with `position: relative` ✅

---

## 7. Cross-App Style Dependencies

**Result: NONE found** ✅

No remote app (academics, finance, people) imports styles from `apps/shell/`. Each app uses:
- `@edforge/theme` package (shared via Module Federation `shared` config)
- Its own CSS

**Risk Assessment:** LOW — shell CSS changes are isolated. However, the global theme tokens in `packages/theme/src/base.css` must NOT be changed, as remote apps depend on them.

---

## 8. Module Federation Config

**Build System:** Rsbuild (not Webpack/Vite)
**Config:** `apps/shell/rsbuild.config.ts`

```typescript
name: 'shell'
remotes: {
  academics: 'http://localhost:3002/remoteEntry.js'
  people: 'http://localhost:3006/remoteEntry.js'
  finance: 'http://localhost:3003/remoteEntry.js'
}
shared: getMFSharedConfig('host')
```

**No changes needed** to Module Federation config. This is a visual-only redesign.

---

## 9. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Framer Motion → CSS transition migration** | HIGH | The current sidebar uses Framer Motion springs; the prototype uses CSS transitions. Need to carefully replace without breaking animation smoothness. The `layoutId` animations on nav items are deeply integrated. |
| **School selector extraction** | HIGH | 378 lines of complex component with dropdowns, queries, role-based logic. Must be carefully moved from sidebar to topbar without breaking any functionality. |
| **Global token contamination** | MEDIUM | Must add NEW shell tokens, not modify `@edforge/theme` base.css. Remote apps depend on existing tokens. |
| **Content pane overflow change** | MEDIUM | Changing from `overflow-x-clip` to `overflow: hidden; overflow-y: auto` could affect page-level scroll behavior. Need testing. |
| **Nav item layoutId animations** | MEDIUM | Removing `activeIndicator` layoutId and changing `activeNavBg` shape could cause animation glitches if not done cleanly. |
| **Header height change** | LOW | 64px → 56px. May affect sticky positioning calculations in remote apps, but unlikely. |
| **Sidebar width change** | LOW | 260px → 240px (expanded), 72px → 68px (collapsed). Framer Motion animates to these values. |

---

## 10. Files That Need Modification

### Must Modify

1. **`apps/shell/src/components/layout/AppShell.tsx`** — Restructure to CSS Grid layout, add body-wrap with inset gap, wrap content in card div
2. **`apps/shell/src/components/layout/Sidebar.tsx`** — Remove border-right, change bg, remove left accent bars, implement pill nav items with module-specific colors, change widths (260→240, 72→68), extract school selector
3. **`apps/shell/src/components/layout/Header.tsx`** — Add hamburger button, add school switcher, add theme pill toggle, restructure to 3-zone layout, change height to 56px, remove border-bottom
4. **`apps/shell/src/index.css`** — Add shell V2 tokens (light + dark)
5. **`apps/shell/src/styles/home-v2-tokens.css`** — May need alignment with new shell tokens

### May Need New Files

1. **Shell V2 CSS tokens** — Could go in `index.css` or new `styles/shell-v2.css`
2. **`TopbarSchoolSelector`** — Extracted/adapted version of `SidebarSchoolSelector` for topbar placement

### DO NOT Touch

- `packages/theme/src/base.css` — Global tokens shared by all apps
- `apps/academics/`, `apps/finance/`, `apps/people/` — Remote apps
- `packages/ui/` — Shared components
- `apps/shell/src/stores/app.store.ts` — Already has `sidebarCollapsed` + `toggleSidebar`
- `apps/shell/rsbuild.config.ts` — Module Federation config
- `apps/shell/src/router.tsx` — Routing logic
- `apps/shell/src/config/sidebar-modules.ts` — Nav config (data, not visual)
