# EdForge Design System

This directory documents the production presentation layer contract for EdForge’s multi-tenant EMIS frontend. The goal is Google-for-Education operator clarity with Apple-HIG restraint: semantic color, compact density, visible focus, and purposeful motion.

## Principles

1. **Semantic tokens first.** Use `background.*`, `text.*`, `border.*`, `action.*`, and `state.*` roles instead of raw palette colors.
2. **Primitives before page styling.** Use shared layout/typography primitives before adding page-local `div` structures.
3. **Accessible by default.** Every interactive primitive must expose visible `focus-visible` treatment and keyboard activation.
4. **Density is intentional.** Tables and operator dashboards can be compact, but spacing should come from the Tailwind scale or a primitive prop.
5. **Motion is quiet.** Use tokenized durations/easings and respect reduced-motion settings.

## Token taxonomy

### Background

- `background.primary` — page/app background.
- `background.secondary` — default card/table surface.
- `background.tertiary` — subtle inset/selected/toolbar surface.
- `background.elevated` — popovers, drawers, prominent cards.
- `background.overlay` — modal/scrim overlays.
- `background.inverse` — inverse surfaces.

Legacy aliases (`surface-primary`, `surface-secondary`, etc.) remain during the migration window.

### Text

- `text.primary` — primary labels/content.
- `text.secondary` — secondary body/metadata.
- `text.tertiary` / `text.muted` — low-emphasis metadata.
- `text.disabled` — disabled copy.
- `text.onAccent` — text on action/accent backgrounds.

### Borders/focus

- `border.subtle` — low-emphasis separators.
- `border.DEFAULT` / `border.default` — standard boundaries.
- `border.strong` — emphasized boundaries.
- `border.focus` — keyboard focus outline/ring.

### Actions and states

- `action.primary.*` — primary buttons and dominant actions.
- `action.secondary.*` — secondary controls.
- `action.danger.*` — destructive actions.
- `state.success|warning|danger|info.{bg,fg,border}` — badges, alerts, validation, and status chips.

## Primitive catalog

### Layout

- `Container` — page width + horizontal padding presets.
- `Stack` — vertical rhythm (`space="xs|sm|md|lg|xl"`).
- `Inline` — horizontal rhythm and alignment.
- `PageHeader` — standard page title/description/actions/breadcrumbs.
- `SectionCard` — standard card section with optional title/description/actions.

### Typography

- `Heading` — semantic headings with `display|page|section|subsection` variants.
- `Text` — semantic body, secondary, caption, label, and code text roles.

### Interactive primitives

- `Button`, `Dropdown`, `FilterTabs`, `Accordion`, `Table`/`DataTable`, `AttendanceHeatmap`, clickable `Card`, and clickable `Tag` use the shared semantic focus utilities:
  - `focusRing`
  - `focusRingInset`

## Adding a component

1. Start with existing primitives. If the layout is a page header, section, stack, inline group, table, tab, or card, reuse the shared primitive.
2. Use semantic tokens only. Avoid `bg-white`, `text-gray-*`, `text-emerald-*`, `bg-red-*`, arbitrary hex, or inline presentation styles.
3. Add keyboard and focus states before visual polish.
4. Add or update tests:
   - unit/interaction test for behavior;
   - focus-ring baseline if interactive;
   - contrast test if introducing token pairs.
5. Run gates:
   - `pnpm turbo typecheck`
   - `pnpm turbo lint`
   - `pnpm vitest run`
   - visual regression where UI output changes.

## Allowing exceptions

Only use allow comments when a value is demonstrably decorative or third-party-constrained:

- `allow-hardcoded-color: <reason>`
- `allow-arbitrary-spacing: <reason>`

Do not use allow comments for normal app/page UI.
