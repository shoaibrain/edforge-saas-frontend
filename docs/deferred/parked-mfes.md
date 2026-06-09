# Parked & removed prototype MFEs

This records the prototype micro-frontends that are **not part of the V1 ship**
and how to revive them. Done as part of the Epic F design-system migration: we
deliberately did **not** apply the `@edforge/ui` migration / `--v2-*` retirement
to dead code — that work must be (re)applied when/if these are revived.

## Removed (deleted from the tree)

`special-programs`, `edfi`, and `messages` were standalone prototype apps left
over from the initial build. They were **orphaned** — not registered as Module
Federation remotes in the shell, and not referenced by the shell's nav or
router — so the running platform never loaded them. They were deleted rather
than commented out (git history is the archive; dead in-tree dirs rot and carry
debt).

| App | Package | Status |
|-----|---------|--------|
| `apps/special-programs` | `@edforge/special-programs` | removed |
| `apps/edfi` | `@edforge/edfi` | removed |
| `apps/messages` | `@edforge/messages` | removed |

> Note: `types/packages/edfi-ts-models` (`@edforge/edfi-ts-models`) is a **real,
> in-use shared package** (Ed-Fi TS schema projections consumed by academics) and
> is **unrelated** to the removed `apps/edfi` MFE. It was not touched.

### Recovery anchor

The exact pre-removal state is preserved on the durable branch
**`archive/prototype-mfes-2026-06-09`** (commit `0e41b39`).

Revive a single app:

```bash
git checkout archive/prototype-mfes-2026-06-09 -- apps/edfi
# then re-wire: add the remote to apps/shell/rsbuild.config.ts,
# the lazy import + route to apps/shell/src/router.tsx, and the
# nav entry to apps/shell/src/config/sidebar-modules.ts
```

**On revival, apply the design-system migration** before shipping: native
`<select>`/`<input>` → `@edforge/ui` primitives, hand-rolled chips →
`StatusBadge`, retire any `var(--v2-*)` to semantic tokens, and fix any
malformed `]0` invisible-button classes (the patterns established across the
academics and finance MFEs).

## Parked (kept in-tree, dormant)

`apps/analytics` (`@edforge/analytics`) **is** intended to ship, but the adoption
dashboard currently fails with a backend **403** (see the "Adoption dashboard"
page). It is **parked**, not removed:

- Removed from the shell sidebar (not advertised to operators).
- The `/analytics/*` route renders a clean "parked" placeholder instead of
  loading the broken remote, and the `analytics` Module Federation remote is
  unregistered in the shell — so the 403 dashboard is unreachable.
- The `apps/analytics` code is **untouched** and **not yet migrated** to the
  design system.

### Un-park checklist (when the backend 403 is fixed)

1. Re-register the `analytics` remote in `apps/shell/rsbuild.config.ts`.
2. Restore the `AnalyticsModule` lazy import + the real `/analytics/*` route
   component in `apps/shell/src/router.tsx` (replace the parked placeholder).
3. Restore the Analytics nav entry in `apps/shell/src/config/sidebar-modules.ts`.
4. Apply the design-system migration to `apps/analytics` (see the revival note
   above) before shipping.
