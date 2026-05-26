/**
 * @edforge/identity-services
 *
 * Identity-domain frontend service layer: branding + (forthcoming)
 * PDF-templates + (forthcoming) PDF jobs. Symmetric in shape to
 * `@edforge/finance-services` (services + React Query hooks).
 *
 * **MF singleton stance:** This package is NOT registered as a Module
 * Federation singleton (unlike `@edforge/config` / `@edforge/i18n` /
 * etc.). That matches the precedent set by `@edforge/finance-services`,
 * which also ships as a per-consumer bundle. The rationale: all
 * exports are STATELESS — pure async services + React Query hooks
 * that read from / write to TanStack Query's own singleton cache,
 * which IS shared via the `@tanstack/react-query` singleton.
 *
 * If a future addition (e.g., an in-memory event bus, a registry
 * with module-level mutable state) introduces shared mutable state,
 * it MUST be moved into a singleton-marked workspace package OR this
 * package promoted to a singleton in `packages/config/src/mf-shared.ts`.
 * See [[edforge-mf-shared-singleton-rule]] (memory) for the trap to
 * avoid.
 */

// Types — local mirrors until M0.9 promotes them to @aibrains/shared-types
export type {
  HexColor,
  ColorPaletteDto,
  SchoolBrandingDto,
  BrandingAssetUrls,
  BrandingResponse,
} from './types'

// Services
export { getBranding } from './services/branding.service'

// Hooks
export { brandingKeys, useSchoolBranding } from './hooks/useBranding'
