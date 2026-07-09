/**
 * Landing V2 configuration.
 *
 * Asset hosting: videos and poster images resolve via resolveAssetUrl().
 * Default is the shell's public/landing/ folder (served by Vercel static
 * hosting). Override with VITE_LANDING_ASSETS_URL to swap to a CDN without
 * code changes — ADR 001 documents the rationale.
 */

const RAW_BASE =
  (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_LANDING_ASSETS_URL?.trim() ?? '/landing'

const ASSET_BASE = RAW_BASE.replace(/\/+$/, '')

export function resolveAssetUrl(filename: string): string {
  const clean = filename.replace(/^\/+/, '')
  return `${ASSET_BASE}/${clean}`
}

/**
 * Canonical asset filenames used across landing sections. platform-overview
 * (hero laptop loop) and district (School Leaders DemoVideo) are real product
 * screen recordings, captured via scripts/record-landing.mjs against a
 * synthetic-data demo tenant. task-router is the legacy stock clip still
 * referenced by the dormant Teachers/Students video paths.
 */
export const LANDING_VIDEOS = {
  platformOverview: 'platform-overview.mp4',
  district: 'district.mp4',
  taskRouter: 'task-router.mp4',
} as const

export type LandingVideoKey = keyof typeof LANDING_VIDEOS
