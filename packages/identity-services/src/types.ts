/**
 * @edforge/identity-services — local type mirrors.
 *
 * Why these are inlined here (not imported from `@aibrains/shared-types`):
 *
 * The plan's M0.9 ticket promotes `BrandingResponse` + supporting types
 * from the backend's `identity` service into `@aibrains/shared-types` and
 * publishes a new npm version. As of Sprint M2 (Branding read), M0.9 has
 * NOT shipped — the current published shared-types (v0.61.0) does not
 * export these types, and the frontend pins are still on v0.40.0
 * (M0.4 pin-sweep also deferred per the 2026-05-26 PM decision).
 *
 * Until M0.9 lands these types are inlined here, mirroring the server
 * contract at:
 *   - `server/application/microservices/identity/src/branding/branding.types.ts`
 *   - `packages/shared-types/src/schemas/identity/school-branding.schema.ts`
 *
 * Drift risk is bounded:
 *   - Read-only consumption (M2). Field additions on the server are
 *     forward-compatible — we just ignore them.
 *   - Field removals on the server would surface as test failures + a
 *     visible UI gap, not as runtime crashes.
 *   - When M0.9 ships, replace this file with type re-exports from
 *     `@aibrains/shared-types` and delete the local definitions.
 */

// ============================================================================
// SchoolBrandingDto (mirror of schoolBrandingSchema)
// ============================================================================

/** `#RRGGBB` hex color string. Server validates with regex `/^#[0-9A-Fa-f]{6}$/`. */
export type HexColor = string

/** Brand color palette. Primary + accent both required when palette is set. */
export interface ColorPaletteDto {
  primary: HexColor
  accent: HexColor
}

/**
 * Full school branding shape as stored in DynamoDB + returned by the
 * backend at `GET /schools/:schoolId/branding`.
 *
 * All fields optional — a school may have no branding configured yet
 * (the wrapper response handles that case via `branding: null`).
 */
export interface SchoolBrandingDto {
  /** Long-form school name for letterheads. Falls back to `School.name` when absent. */
  formalName?: string
  /** Up to 4 letterhead address lines. Max 120 chars each. */
  addressLines?: string[]
  /** Display phone (letterhead-specific; may differ from `School.phone`). */
  phone?: string
  /** Display email (letterhead-specific). */
  email?: string
  /** S3 key for the school logo — render endpoint resolves to a Buffer at PDF time. */
  logoS3Key?: string
  /** S3 key for the principal's signature image. */
  principalSignatureS3Key?: string
  /** S3 key for a full-page letterhead background image. */
  letterheadBackgroundS3Key?: string
  /** Brand color palette. */
  colorPalette?: ColorPaletteDto
  /** Nepal Permanent Account Number (tax registration). */
  panNumber?: string
  /** Nepal VAT registration number. */
  vatNumber?: string
  /** Tagline / motto shown under the school name on PDFs. */
  tagline?: string
  /**
   * Opaque UUID that changes whenever any branding field is updated.
   * PDF render endpoints capture this on issued documents so a later
   * branding change doesn't visually mutate historical PDFs.
   */
  brandingVersionId?: string
}

// ============================================================================
// BrandingAssetUrls (Sprint C.0-followup C.0-fu.2)
// ============================================================================

/**
 * Per-asset signed GET URLs minted by the server for the three S3-backed
 * branding assets. Present when `branding != null` and ≥1 S3 key is set.
 * TTL is 10 min server-side; React Query's staleTime aligns at 60s so
 * we refetch well before expiry under continuous use.
 *
 * Frontends consume these directly to render previews — no second
 * presign hop needed per asset.
 */
export interface BrandingAssetUrls {
  /** Signed GET URL for the logo image (when `logoS3Key` is set). */
  logo?: string
  /** Signed GET URL for the principal's signature image. */
  principalSignature?: string
  /** Signed GET URL for the letterhead background image / PDF. */
  letterheadBackground?: string
}

// ============================================================================
// BrandingResponse (wrapper returned by GET /schools/:schoolId/branding)
// ============================================================================

/**
 * Response shape from `GET /schools/:schoolId/branding`.
 *
 * `branding` is `null` when the school has no branding row yet — a fresh
 * tenant or one that hasn't opened the Branding settings page. UIs MUST
 * render the empty state cleanly in that case (don't crash on
 * `branding.formalName` access).
 *
 * `urls` is absent when `branding` is null, AND absent on a non-null
 * branding row where every `*S3Key` is unset.
 */
export interface BrandingResponse {
  branding: SchoolBrandingDto | null
  urls?: BrandingAssetUrls
}

// ============================================================================
// UpdateBrandingRequest (PATCH /schools/:schoolId/branding)
// ============================================================================

/**
 * Body for `PATCH /schools/:schoolId/branding` (Sprint M3 — Branding write).
 *
 * Server schema: `schoolBrandingSchema.omit({ brandingVersionId: true }).partial()`
 * — every field is optional (partial update); `brandingVersionId` is
 * server-generated and cannot be set by the client.
 */
export type UpdateBrandingRequest = Partial<Omit<SchoolBrandingDto, 'brandingVersionId'>>

// ============================================================================
// Asset upload types (Sprint M3 phase 2)
// ============================================================================

/**
 * The three branding asset slots a school can populate. Naming intentionally
 * differs from the schema fields they ultimately populate:
 *   'logo'       → `logoS3Key`
 *   'signature'  → `principalSignatureS3Key`
 *   'letterhead' → `letterheadBackgroundS3Key`
 * This mirrors the server-side `BRANDING_ASSET_TYPES` enum at
 * `server/.../identity/src/branding/branding.types.ts:13`.
 */
export const BRANDING_ASSET_TYPES = ['logo', 'signature', 'letterhead'] as const
export type BrandingAssetType = (typeof BRANDING_ASSET_TYPES)[number]

/**
 * Per-asset-type MIME allowlist. Mirrored from server `ASSET_MIME_ALLOWLIST`.
 *
 * Client-side validation is a UX fail-fast, NOT a security boundary —
 * the server re-enforces the allowlist on the presign request + S3 enforces
 * the signed `Content-Type` header on the actual PUT. Keep this in sync with
 * the server map; a divergence here just means the operator gets the error
 * later (after the round-trip) instead of synchronously at the file picker.
 */
export const BRANDING_ASSET_MIME_ALLOWLIST: Record<
  BrandingAssetType,
  readonly string[]
> = {
  logo: ['image/png', 'image/jpeg', 'image/svg+xml'],
  signature: ['image/png', 'image/jpeg'],
  letterhead: ['image/png', 'image/jpeg', 'application/pdf'],
}

/**
 * Per-asset-type byte ceiling. Mirrored from server `ASSET_MAX_BYTES`.
 */
export const BRANDING_ASSET_MAX_BYTES: Record<BrandingAssetType, number> = {
  logo: 2 * 1024 * 1024,
  signature: 1 * 1024 * 1024,
  letterhead: 5 * 1024 * 1024,
}

/** Body for `POST /schools/:schoolId/branding/assets/upload-url`. */
export interface PresignedUploadRequest {
  assetType: BrandingAssetType
  contentType: string
  contentLength: number
}

/** Response from `POST /schools/:schoolId/branding/assets/upload-url`. */
export interface PresignedUploadResponse {
  /** Short-lived signed PUT URL the browser uploads to directly. */
  uploadUrl: string
  /** S3 key the operator should assign to the matching `*S3Key` schema field. */
  key: string
  /** TTL (informational; the browser doesn't enforce, S3 rejects expired). */
  expiresInSeconds: number
}
