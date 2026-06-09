/**
 * Avatar utility for the Academics module.
 *
 * D-8: avatars are generated **locally** via @dicebear/core + @dicebear/collection
 * and returned as `data:` URIs — no runtime dependency on the third-party
 * `api.dicebear.com` HTTP API. This makes the roster resilient on filtered /
 * offline school networks (common in-market) and removes ~80 avatar fetches per
 * 20-row page. Students use 'adventurer', staff/guardians use 'lorelei'.
 *
 * @see https://www.dicebear.com/
 */

import { createAvatar } from '@dicebear/core'
import { adventurer, lorelei } from '@dicebear/collection'

export type AvatarStyle =
  | 'adventurer'
  | 'avataaars'
  | 'bottts'
  | 'lorelei'
  | 'micah'
  | 'notionists'
  | 'open-peeps'
  | 'personas'
  | 'pixel-art'
  | 'thumbs'
  | 'initials'

interface AvatarOptions {
  seed: string
  style?: AvatarStyle
  size?: number
  backgroundColor?: string[]
  radius?: number
}

const DEFAULT_SIZE = 64
const DEFAULT_BG = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']

// Only the two styles the academics module actually uses are bundled; any other
// AvatarStyle falls back to 'adventurer'. Each style has its own Options type,
// so createAvatar must be called with a concrete style (a union doesn't satisfy
// Style<Options>) — hence the explicit branch rather than a lookup map.
type LocalStyle = 'adventurer' | 'lorelei'

// Avatars are deterministic per (style, seed, size); the roster re-renders
// often, so cache the generated data URIs to avoid recomputing SVGs per row.
const cache = new Map<string, string>()

/**
 * Generate a DiceBear avatar as a `data:` URI (rendered client-side, no network).
 */
export function getAvatarUrl(options: AvatarOptions): string {
  const { seed, style = 'adventurer', size = DEFAULT_SIZE, backgroundColor = DEFAULT_BG, radius = 50 } = options
  const local: LocalStyle = style === 'lorelei' ? 'lorelei' : 'adventurer'
  const key = `${local}|${seed}|${size}`
  const hit = cache.get(key)
  if (hit) return hit

  const uri =
    local === 'lorelei'
      ? createAvatar(lorelei, { seed, size, radius, backgroundColor }).toDataUri()
      : createAvatar(adventurer, { seed, size, radius, backgroundColor }).toDataUri()
  cache.set(key, uri)
  return uri
}

/**
 * Avatar for a student — 'adventurer', seeded by student id (or name).
 */
export function getStudentAvatar(
  identifier: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>,
): string {
  return getAvatarUrl({ seed: identifier, style: 'adventurer', ...options })
}

/**
 * Avatar for a staff member / instructor / guardian — 'lorelei', seeded by the
 * supplied identifier. Pass a stable, collision-resistant seed (e.g. a
 * guardianId, or `firstName|lastName|relationship`) rather than a bare name.
 */
export function getStaffAvatar(
  identifier: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>,
): string {
  return getAvatarUrl({ seed: identifier, style: 'lorelei', ...options })
}
