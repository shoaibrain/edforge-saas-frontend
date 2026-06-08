# EdForge Design System

This directory documents the production presentation layer contract for EdForge’s multi-tenant EMIS frontend. The goal is warm, institutional-grade operator clarity: semantic color, comfortable admin density, visible focus, and purposeful motion without making EdForge feel like an internal developer dashboard.

## Principles

1. **Semantic tokens first.** Use `background.*`, `text.*`, `border.*`, `action.*`, and `state.*` roles instead of raw palette colors.
2. **Primitives before page styling.** Use shared layout, typography, form, overlay, and state primitives before adding page-local `div` structures.
3. **Accessible by default.** Every interactive primitive must expose visible `focus-visible` treatment and keyboard activation.
4. **Density is intentional.** Tables and operator dashboards can be compact, but form workflows should stay comfortable and spacing should come from the Tailwind scale or a primitive prop.
5. **Motion is quiet.** Use tokenized durations/easings and respect reduced-motion settings.
6. **MFE drift is a defect.** New MFE pages must consume shared recipes and primitives instead of recreating local color, field, card, tab, or overlay grammars.

## Token taxonomy

### Background

- `background.primary` — page/app background.
- `background.secondary` — default card/table surface.
- `background.tertiary` — subtle inset/selected/toolbar surface.
- `background.elevated` — popovers, drawers, prominent cards.
- `background.overlay` — modal/scrim overlays.
- `background.inverse` — inverse surfaces.

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

### Form primitives

The next UI/UX iteration standardizes form UI through `@edforge/ui` primitives and RHF adapters in `@edforge/forms`.

- `Field` / `FormField` — label, required marker, helper text, error text, locked/read-only/disabled metadata, and ARIA wiring.
- `Input` — text-like controls with prefix/suffix, invalid, disabled, read-only, and loading/success affordances.
- `Textarea` — multi-line input with resize and optional character-count support.
- `Select` — non-native listbox replacement for finite option sets.
- `Combobox` — searchable single-select for long option sets and async/filtered lists.
- `Checkbox`, `RadioGroup`, and `Switch` — boolean/exclusive setting controls with keyboard and focus behavior.

See [Form grammar and primitives](./forms.md) for state, accessibility, token, and migration requirements.

### Page and state recipes

- `PageShell` — standard page canvas/width/vertical rhythm recipes.
- `InlineAlert` — semantic info/success/warning/danger callouts.
- `EmptyState`, `LoadingState`, `ErrorState` — standard non-data states for cards, pages, and tables.
- `Tabs` / `SegmentedControl` — standard top-level tab and in-card filter controls.

See [Page recipes](./page-recipes.md) for allowed page composition patterns.

## Adding a component

1. Start with existing primitives. If the layout is a page header, section, stack, inline group, table, tab, or card, reuse the shared primitive.
2. Use semantic tokens only. Avoid `bg-white`, `text-gray-*`, `text-emerald-*`, `bg-red-*`, `text-amber-*`, arbitrary hex, or inline presentation styles.
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
- `allow-native-form-control: <reason>`
- `allow-presentation-style: <reason>`

Do not use allow comments for normal app/page UI.

## MFE page rules

Each MFE should consume the same production presentation contract:

- import the full shared theme rather than defining app-local semantic utility aliases;
- use `PageShell`, `PageHeader`, `SectionCard`, `Stack`, and `Inline` for standard pages;
- use `Field`/`Input`/`Select`/`Combobox` or `@edforge/forms` adapters for form UI;
- use shared `Modal`/`Drawer` recipes for overlays;
- use shared state primitives for empty, loading, and error states;
- keep MFE-specific classes limited to data layout, not visual language.

Disallowed in product code unless explicitly justified:

- native `<select>` for app forms;
- page-local `inputClass`, `selectClass`, `labelClass`, `errorClass`, or `SELECT_CLASS` constants;
- raw status colors such as `text-amber-*`, `bg-red-*`, `text-teal-*`, or hex values;
- arbitrary typography such as `text-[11px]` where `Text variant="caption"` is appropriate.
