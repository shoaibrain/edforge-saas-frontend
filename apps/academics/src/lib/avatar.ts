/**
 * DiceBear Avatar Utility for Academics Module
 *
 * Generates consistent, beautiful avatars using DiceBear API.
 * Students use the 'avataaars' style, seeded by name for consistency.
 *
 * @see https://www.dicebear.com/
 */

export type AvatarStyle =
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

const DEFAULT_SIZE = 128

/**
 * Generate a DiceBear avatar URL
 */
export function getAvatarUrl(options: AvatarOptions): string {
  const {
    seed,
    style = 'avataaars',
    size = DEFAULT_SIZE,
    backgroundColor = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    radius = 50,
  } = options

  const params = new URLSearchParams({
    seed,
    size: size.toString(),
    radius: radius.toString(),
  })

  backgroundColor.forEach((color) => {
    params.append('backgroundColor', color)
  })

  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`
}

/**
 * Get avatar URL for a student.
 * Uses 'avataaars' DiceBear style, seeded by student name or ID.
 */
export function getStudentAvatar(
  identifier: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>
): string {
  return getAvatarUrl({
    seed: identifier,
    style: 'avataaars',
    ...options,
  })
}
