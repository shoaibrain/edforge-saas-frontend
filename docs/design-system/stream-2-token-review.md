# Stream 2 Token Review — Proposed `base.css` Diff

**Status:** implemented; retained as the Stream 2 decision record.  
**Reason:** `packages/theme/src/base.css` is the blast-radius file; no token PR should start until this proposal is approved.

## Goals

1. Preserve current palette families: ink, teal, cyan, aqua, vanilla, golden, caramel, rust.
2. Add a semantic token layer and migrate consumers away from legacy token names.
3. Fix the WCAG failures captured by `packages/ui/src/components/__tests__/contrast.test.ts`.
4. Avoid breaking existing utilities during the migration window.

## Proposed semantic aliases

Add these aliases inside `:root` after current semantic RGB tokens:

```css
--background-primary: var(--surface-primary);
--background-secondary: var(--surface-secondary);
--background-tertiary: var(--surface-tertiary);
--background-elevated: var(--surface-elevated);
--background-overlay: 0 18 25;
--background-inverse: 0 18 25;

--text-muted: var(--text-tertiary);
--text-disabled: 148 163 184;
--text-on-accent: 251 249 245;

--border-subtle: var(--border-secondary);
--border-default: var(--border-primary);
--border-strong: var(--border-tertiary);
--border-focus: var(--interactive-focus);

--action-primary-bg: var(--brand-primary);
--action-primary-bg-hover: 0 78 94;
--action-primary-bg-active: 0 59 70;
--action-primary-fg: var(--text-on-accent);
--action-secondary-bg: var(--surface-tertiary);
--action-secondary-fg: var(--text-secondary);
--action-danger-bg: 174 32 18;
--action-danger-fg: var(--text-on-accent);

--state-success-bg: 232 246 242;
--state-success-fg: 0 95 73;
--state-success-border: 63 151 122;
--state-warning-bg: 255 236 201;
--state-warning-fg: 127 67 0;
--state-warning-border: 192 125 0;
--state-danger-bg: 249 202 198;
--state-danger-fg: 105 19 11;
--state-danger-border: 174 32 18;
--state-info-bg: 189 250 251;
--state-info-fg: 0 95 115;
--state-info-border: 0 122 147;
```

Add dark equivalents inside `.dark`:

```css
--background-primary: var(--surface-primary);
--background-secondary: var(--surface-secondary);
--background-tertiary: var(--surface-tertiary);
--background-elevated: var(--surface-elevated);
--background-overlay: 0 0 0;
--background-inverse: 251 249 245;

--text-muted: var(--text-tertiary);
--text-disabled: 100 116 139;
--text-on-accent: 251 249 245;

--border-subtle: var(--border-secondary);
--border-default: var(--border-primary);
--border-strong: var(--border-tertiary);
--border-focus: var(--interactive-focus);

--action-primary-bg: 0 95 115;
--action-primary-bg-hover: 0 122 147;
--action-primary-bg-active: 0 78 94;
--action-primary-fg: var(--text-on-accent);
--action-secondary-bg: var(--surface-tertiary);
--action-secondary-fg: var(--text-secondary);
--action-danger-bg: 174 32 18;
--action-danger-fg: var(--text-on-accent);

--state-success-bg: 6 88 89;
--state-success-fg: 110 231 183;
--state-success-border: 63 151 122;
--state-warning-bg: 96 62 0;
--state-warning-fg: 253 208 77;
--state-warning-border: 192 125 0;
--state-danger-bg: 105 19 11;
--state-danger-fg: 252 165 165;
--state-danger-border: 174 32 18;
--state-info-bg: 0 78 94;
--state-info-fg: 125 244 247;
--state-info-border: 0 122 147;
```

## Proposed contrast fixes to existing tokens

### Light theme

```css
--border-primary: 127 103 32;      /* vanilla-700; 5.17:1 on surface-primary */
--border-secondary: 63 151 122;    /* aqua-700; 3.37:1 on surface-primary */
--border-tertiary: 0 122 147;      /* teal-400; 4.75:1 on surface-primary */
--interactive-focus: 0 95 115;     /* teal-500; 6.92:1 on surface-primary */
```

### Dark theme

```css
--border-primary: 97 189 158;      /* aqua-600; 8.43:1 on surface-primary */
--border-secondary: 58 122 138;    /* teal/cyan mix; 3.94:1 on surface-primary */
--border-tertiary: 10 179 182;     /* cyan-400; 7.39:1 on surface-primary */
--interactive-focus: 10 179 182;   /* cyan-400; 3.61:1 on surface-elevated */
--brand-primary: 0 95 115;         /* teal-500; white text 7.28:1 */
```

## Test updates expected in the token PR

1. Update `contrast.test.ts` so it asserts the fixed matrix is empty rather than snapshotting the current failures.
2. Replace direct `white on brand-*` checks with action foreground checks:
   - `action-primary-fg on action-primary-bg`
   - `action-danger-fg on action-danger-bg`
   - `text-primary/text-secondary/text-tertiary` on supported surfaces
   - border/focus tokens on supported surfaces
3. After consumer migration is complete, remove deprecated alias definitions from `base.css`.

## Known visual drift

- Borders will become more visible in both themes. This is expected and should mirror Google Admin’s thin-divider rhythm.
- Dark primary action color becomes darker teal so white text passes AA.
- Warm vanilla borders may feel heavier in light mode; visual regression should confirm whether `border-primary` should be reserved for strong boundaries and `border-secondary` for default separators.

## Approval requested

Approve this exact token direction before the Stream 2 PR touches `packages/theme/src/base.css`.
