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
 * Canonical asset filenames used across landing sections. Referenced by
 * Hero (platform-overview) and the three use-case DemoVideo mounts
 * (task-router for all three, seeked to per-section chapter ranges).
 */
export const LANDING_VIDEOS = {
  platformOverview: 'platform-overview.mp4',
  taskRouter: 'task-router.mp4',
} as const

export type LandingVideoKey = keyof typeof LANDING_VIDEOS
