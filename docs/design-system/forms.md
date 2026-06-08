# Form Grammar and Primitives

EdForge forms are high-confidence operator workflows. A Tenant Admin creating a school, a Platform Implementor configuring Ed-Fi descriptors, or an Operator editing settings should never have to interpret browser-native controls, inconsistent validation, or dark-mode surprises.

This document defines the form primitive contract for `@edforge/ui` and the integration contract for `@edforge/forms`.

## Goals

1. Replace product-facing native selects with a polished `Select`/`Combobox` system.
2. Make labels, helper text, required markers, validation, disabled/read-only/locked states, focus rings, and density consistent.
3. Keep app and MFE code focused on data and composition, not control styling.
4. Preserve current APIs and form behavior while improving presentation and accessibility.

## Package responsibilities

### `@edforge/ui`

Owns presentation primitives:

- `Field` / `FormField`
- `Input`
- `Textarea`
- `Select`
- `Combobox`
- `Checkbox`
- `RadioGroup`
- `Switch`
- `GradeRangeField` (composed dual-`Select` recipe with a shared label + error region)

These primitives must not depend on React Hook Form. They receive normal React props, semantic state props, generated IDs where needed, and class names for layout-only adjustment.

## Which form API to use (canonical rule)

There are two layers; do not improvise a third. Pick by whether the form has React Hook Form behind it.

| Your form is… | Use | Examples |
|---|---|---|
| **RHF-bound** — has validation, multiple fields, dirty/touched/submit state, or a Zod resolver | **`@edforge/forms`** adapters (`TextField`, `SelectField`, `TextareaField`, `ToggleField`, `CheckboxField`, `RadioGroupField`) inside a `FormProvider` | school wizard, organization SEA/LEA/ESC forms, student registration, staff forms |
| **Trivial local state** — one or two `useState` controls, no RHF, no resolver | **`@edforge/ui` form primitives** directly (`Field` + `Input`/`Select`/…) | a single inline filter, a one-toggle settings row, a quick search box |

Rules that follow from this:

- **Never hand-roll a `forwardRef` shim** that adapts a primitive back onto a native `<select>`/`<input>` event API (the retired `AnimatedInput`/`AnimatedSelect` pattern). If a screen needs RHF, use `@edforge/forms`; if it doesn't, use the primitive directly.
- `@edforge/forms` adapters **must** wrap `@edforge/ui` primitives — they own RHF wiring only, never colors/focus/borders/native-select styling.
- AdminWeb and any MFE may import `@edforge/forms` and `@edforge/ui` (both are published / workspace-resolvable for backend builds); neither may import workspace-only `@edforge/*` packages into a Docker/CodeBuild-built target.

> Migration note: screens still using local `AnimatedInput`/`AnimatedSelect` shims (e.g. `BasicInfoStep`) are scheduled to move onto `@edforge/forms` adapters during the settings/onboarding sweep (roadmap-v2 Epic T).

### `@edforge/forms`

Owns form-library integration:

- React Hook Form registration and controllers.
- Zod resolver helpers and schema exports.
- Tenant/archetype-aware form sections.

`@edforge/forms` must wrap `@edforge/ui` primitives instead of defining separate colors, focus rings, borders, shadows, or native-select styling.

## Core field anatomy

Every field follows the same DOM/ARIA contract:

1. Label row
   - label text;
   - required marker if required;
   - optional metadata such as “optional”, “read-only”, or “locked”.
2. Control
   - input/select/combobox/checkbox/radio/switch;
   - optional prefix/suffix/icon.
3. Message row
   - error text takes precedence;
   - otherwise helper text;
   - otherwise optional character count or metadata.

Required behavior:

- `label` uses `htmlFor` when the control has an input-like ID.
- Error/helper text IDs are included in `aria-describedby`.
- Invalid controls set `aria-invalid="true"`.
- Error text uses `role="alert"` when it appears as a validation result.
- Disabled controls are non-interactive and visually muted.
- Read-only controls remain readable and focusable only when useful.
- Locked controls explain why the user cannot edit the value.

## Visual contract

### Default fields

- Control height: 40px.
- Border radius: rounded-lg or rounded-xl depending on density.
- Surface: `background.secondary` or `background.tertiary` depending on page context.
- Border: `border.default`; hover may increase contrast but must not imply selection.
- Text: `text.primary`; placeholder/help text: `text.tertiary`.
- Focus: semantic `border.focus` plus `focusRing`/`focusRingInset`.

### Invalid fields

- Border: `state.danger.border`.
- Error text/icon: `state.danger.fg`.
- Optional subtle error ring/background may use `state.danger.bg` at low alpha.
- Do not use raw `text-red-*`, `text-rust-*`, or hardcoded RGB values.

### Successful or suggested fields

- Use success only after a meaningful validation event or in review/readiness states.
- Do not show success icons for every merely-dirty field unless the workflow needs it.

### Disabled and read-only fields

- Disabled: muted, not interactive, no hover/active state.
- Read-only: readable and stable; may use a lock/explanation but should not look broken.
- Locked: use the shared lock affordance and explain the rule, especially in settings forms.

## Primitive specifications

### `Field` / `FormField`

Purpose: the canonical wrapper for label, required marker, helper/error text, and control association.

Required props:

- `label`
- `htmlFor` or generated ID support
- `required`
- `error`
- `helperText`
- `disabled`
- `readOnly`
- `lockedReason`
- density: `default | compact | inline`

Tests:

- helper text is connected through `aria-describedby`;
- error replaces helper text and sets alert semantics;
- required marker renders without becoming the only required signal;
- disabled/read-only/locked metadata is visible.

### `Input`

Purpose: text-like input primitive.

Variants:

- sizes: `sm`, `md`, `lg`;
- types: `text`, `email`, `password`, `url`, `tel`, `number`, `search`;
- prefix/suffix;
- mono for codes/IDs.

States:

- default, hover, focus-visible, invalid, disabled, read-only, loading, success.

Tests:

- focus style is visible;
- invalid state sets `aria-invalid`;
- disabled prevents input;
- prefix/suffix do not break label association.

### `Textarea`

Purpose: multi-line text entry.

Variants:

- sizes;
- `rows`;
- resize: `none`, `vertical`, `horizontal`, `both`;
- optional character count.

Tests:

- character count is announced as metadata, not error;
- resize class matches prop;
- invalid/helper IDs are wired.

### `Select`

Purpose: non-native listbox for finite option sets.

Use for:

- school type;
- grade range;
- calendar system;
- language/locale/timezone when option count remains manageable;
- operational status and short descriptor lists.

Do not use for:

- hundreds of descriptors;
- user/school search;
- async lists. Use `Combobox`.

Required behavior:

- trigger button has label association;
- menu uses elevated surface and popover elevation;
- selected option is visible with checkmark/state;
- disabled options cannot be selected;
- Escape closes the list;
- arrow keys move through options;
- selection returns focus to the trigger;
- menu works inside Modal/Drawer scroll containers.

Tests:

- keyboard open/select/close;
- selected and placeholder rendering;
- disabled options;
- invalid state;
- dark-mode visual review.

### `Combobox`

Purpose: searchable single-select for long or async option sets.

Use for:

- Ed-Fi descriptor lists with many entries;
- user assignment;
- school/organization selectors;
- parent LEA/ESC selection when lists can grow.

Required behavior:

- typed filtering;
- loading state;
- empty results state;
- selected value display;
- keyboard highlight/select;
- clear button where clearable.

Tests:

- filtering;
- no results;
- async loading;
- keyboard select;
- `aria-expanded`, `aria-controls`, and labelled input behavior.

### `Checkbox`

Purpose: boolean field or table row selection.

Variants:

- sizes: `sm`, `md`;
- indeterminate;
- label/description composition.

Tests:

- Space toggles;
- label click toggles;
- indeterminate visual and ARIA state;
- disabled prevents toggling.

### `RadioGroup`

Purpose: exclusive choices such as school type or grade-band presets.

Variants:

- vertical list;
- horizontal compact;
- card/segmented option.

Tests:

- arrow-key navigation where using roving focus;
- selection announced through `role="radio"` / native radio;
- invalid group message associated with the group.

### `Switch`

Purpose: setting toggle where on/off describes a persistent configuration.

Use for:

- workspace settings;
- school configuration toggles;
- feature/notification preferences.

Do not use for:

- one-off checkbox confirmation;
- multi-select choices.

Tests:

- click and keyboard toggle;
- label/description association;
- disabled state.

## Migration requirements

When migrating app code:

1. Remove page-local `inputClass`, `selectClass`, `labelClass`, `errorClass`, and `SELECT_CLASS`.
2. Replace native selects with `Select` or `Combobox`.
3. Replace hand-styled inputs with `Input`/`Textarea` or `@edforge/forms` adapters.
4. Replace raw checkboxes/radios/toggles with `Checkbox`/`RadioGroup`/`Switch`.
5. Keep business logic, validation schemas, API calls, and data transformations unchanged.
6. Add or update tests that prove the migrated controls still submit/update the same values.

## Examples

```tsx
<Field
  label="School name"
  required
  helperText="Use the legal or public-facing institution name."
  error={errors.name}
>
  <Input value={name} onChange={handleNameChange} />
</Field>
```

```tsx
<Select
  label="Calendar system"
  value={calendarSystem}
  onChange={setCalendarSystem}
  options={[
    { value: 'gregorian', label: 'Gregorian' },
    { value: 'bikram_sambat', label: 'Bikram Sambat' },
  ]}
/>
```

```tsx
<Combobox
  label="Parent district"
  value={parentLeaId}
  onChange={setParentLeaId}
  options={leaOptions}
  placeholder="Search districts"
  emptyMessage="No districts match that search."
/>
```

## Review checklist

- Does every changed field have a visible label?
- Does helper/error text connect through `aria-describedby`?
- Is the focus state visible in light and dark themes?
- Is the menu/popover readable in dark mode?
- Can a keyboard user complete the field?
- Is color semantic rather than palette-specific?
- Did the migration preserve submitted values and validation behavior?
