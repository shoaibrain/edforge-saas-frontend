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
 * Canonical asset filenames used across landing sections. All four are real
 * product screen recordings captured via scripts/record-landing.mjs against a
 * synthetic-data demo tenant: platform-overview is the hero laptop montage;
 * district/teachers/students back the three use-case DemoVideo sections.
 */
export const LANDING_VIDEOS = {
  platformOverview: 'platform-overview.mp4',
  district: 'district.mp4',
  teachers: 'teachers.mp4',
  students: 'students.mp4',
} as const

export type LandingVideoKey = keyof typeof LANDING_VIDEOS
