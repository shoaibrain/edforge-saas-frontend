# Page Recipes and MFE Composition

EdForge is a modular MFE product, so page-level composition must be as standardized as component styling. A new page should feel native to EdForge even when built in a different remote.

This document defines approved recipes for settings pages, form overlays, wizard steps, data-table pages, and non-data states.

## Core rules

1. Use shared primitives before app-local layout.
2. Keep MFE-specific classes limited to data layout and responsive positioning.
3. Do not recreate page headers, section cards, tabs, empty states, or form controls locally.
4. Use semantic tokens and shared state primitives for alerts, loading, empty, and error states.
5. Preserve keyboard navigation and focus visibility across shell and remotes.

## Standard page shell

Use a page shell recipe for every top-level MFE page.

Default anatomy:

1. `PageShell`
2. `PageHeader`
3. Optional toolbar/tabs/filter row
4. Main content as `Stack`
5. `SectionCard` or table/content region

Expected variants:

- `settings`: comfortable width, section-card rhythm, form density.
- `data-table`: wide width, toolbar + table + state region.
- `detail`: header summary, tabs/sections, optional side drawer.
- `wizard`: centered width, progress, step title, field grid, footer.
- `overview`: module hero/header, metric cards, key workflows.

Example:

```tsx
<PageShell variant="settings">
  <PageHeader
    title="Organization structure"
    description="Manage districts, schools, and reporting hierarchy."
    actions={<Button>Add school</Button>}
  />
  <Stack space="lg">
    <SectionCard title="Districts" description="Local education agencies in this tenant.">
      {/* content */}
    </SectionCard>
  </Stack>
</PageShell>
```

## Settings page recipe

Settings pages optimize for Tenant Admin confidence, not dashboard density.

Use:

- `PageShell variant="settings"`;
- `PageHeader`;
- `SectionCard`;
- `Field`/`Input`/`Select`/`Switch`;
- `InlineAlert` for guidance;
- `EmptyState`/`LoadingState`/`ErrorState` for missing or failed data.

Avoid:

- multiple custom card styles on the same page;
- browser-native selects;
- row-level settings controls without labels;
- dense arbitrary spacing;
- warning colors that are not `state.warning.*`.

## Form drawer recipe

Use drawers for focused create/edit flows that do not require leaving the current context.

Anatomy:

1. `Drawer`
2. title + description
3. optional `InlineAlert`
4. `Stack` of `SectionCard` or field groups
5. `DrawerFooter` with secondary and primary actions

Behavior:

- focus moves into drawer on open;
- Escape and close button work unless guarded by dirty-state confirmation;
- footer actions remain visible when content scrolls;
- validation appears next to fields, not only in toasts.

## Modal form recipe

Use modals for short confirmation or compact forms. Prefer drawers for long settings forms.

Anatomy:

1. `Modal`
2. one short description;
3. a single form section or confirmation body;
4. `ModalFooter`.

Behavior:

- destructive actions use `Button variant="danger"`;
- cancel action is always available unless a blocking operation is running;
- error summary may appear at top, but field errors still belong beside fields.

## Wizard step recipe

Use for school creation, onboarding, or multi-step setup.

Anatomy:

1. Wizard shell/page
2. progress indicator
3. step title and description
4. form fields as a comfortable grid
5. optional contextual `InlineAlert`
6. footer navigation

Rules:

- Step transitions use tokenized motion and respect reduced motion.
- Do not use spring/wobbly interaction for enterprise form controls.
- Each step should be independently understandable.
- Optional/skippable steps must explain what happens if skipped.
- Review steps should summarize values using `SectionCard` and `Text` variants.

## Data-table page recipe

Use for operator list pages.

Anatomy:

1. `PageShell variant="data-table"`
2. `PageHeader`
3. toolbar/search/filter row
4. `DataTable`
5. table-specific loading/empty/error states

Rules:

- loading preserves table geometry where possible;
- empty states explain the next action;
- row hover, selected, and focus states are distinct;
- bulk actions must be keyboard reachable.

## State primitives

### `EmptyState`

Use when there is no data yet or filters return no matches.

Variants:

- `inline`: compact inside a table/card.
- `card`: centered inside a section.
- `page`: larger setup/onboarding empty state.

Required props:

- `title`
- `description`
- optional `action`
- optional `icon`

### `LoadingState`

Use when data or a form submission is pending.

Rules:

- preserve layout where possible;
- use skeletons for table/card regions;
- use button loading states for submission;
- avoid spinners that replace the entire page unless routing is blocked.

### `ErrorState`

Use when loading or saving fails.

Rules:

- state color is `state.danger.*`;
- include a retry action when possible;
- include support copy for non-retryable errors;
- keep technical details collapsible or secondary.

### `InlineAlert`

Use for guidance, warnings, or contextual errors.

Variants:

- `info`
- `success`
- `warning`
- `danger`

Rules:

- use semantic state tokens;
- include concise copy;
- do not use alert color for decorative emphasis.

## MFE import and theme requirements

Each MFE should:

- import the full shared theme once;
- avoid app-local semantic utility definitions after theme centralization;
- consume `@edforge/ui` from the workspace singleton;
- keep route-level components focused on composition and data wiring.

Disallowed MFE drift patterns:

- locally copied `ModuleOverviewPage` visual grammar after a shared recipe exists;
- local `TabButton` components when `Tabs`/`SegmentedControl` fits;
- local page-header components when `PageHeader` fits;
- local card section components when `SectionCard` fits;
- CSS classes that redefine `.bg-surface-*`, `.text-text-*`, or `.border-border-*`.

## Review checklist

- Does the page use a documented recipe?
- Are page title, description, actions, and breadcrumbs in `PageHeader`?
- Are sections grouped with `SectionCard`?
- Are form controls shared primitives or `@edforge/forms` adapters?
- Are empty/loading/error states shared primitives?
- Does light and dark mode use the same semantic roles?
- Are screenshots attached for presentation changes?
- Did lint violation counts stay flat or decrease?
