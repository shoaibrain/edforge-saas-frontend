/**
 * DiceBear Avatar Utility
 * Generates consistent, beautiful avatars using DiceBear API
 * https://www.dicebear.com/
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

const DEFAULT_STYLE: AvatarStyle = 'lorelei'
const DEFAULT_SIZE = 128

/**
 * Generate a DiceBear avatar URL
 */
export function getAvatarUrl(options: AvatarOptions): string {
  const {
    seed,
    style = DEFAULT_STYLE,
    size = DEFAULT_SIZE,
    backgroundColor = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
    radius = 50,
  } = options

  const params = new URLSearchParams({
    seed: seed,
    size: size.toString(),
    radius: radius.toString(),
  })

  // Add background colors
  backgroundColor.forEach((color) => {
    params.append('backgroundColor', color)
  })

  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`
}

/**
 * Get avatar URL for a user (by name or email)
 */
export function getUserAvatar(
  nameOrEmail: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>
): string {
  return getAvatarUrl({
    seed: nameOrEmail,
    style: 'lorelei',
    ...options,
  })
}

/**
 * Get avatar URL for a student
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

/**
 * Get avatar URL for a staff member
 */
export function getStaffAvatar(
  identifier: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>
): string {
  return getAvatarUrl({
    seed: identifier,
    style: 'lorelei',
    ...options,
  })
}

/**
 * Get avatar URL for a school/organization
 */
export function getSchoolAvatar(
  name: string,
  options?: Partial<Omit<AvatarOptions, 'seed'>>
): string {
  return getAvatarUrl({
    seed: name,
    style: 'bottts',
    backgroundColor: ['0074c5', '015c9f', '064f83', '0b426d'],
    ...options,
  })
}

/**
 * Avatar component props helper
 */
export function avatarProps(
  src: string,
  alt: string,
  className?: string
): { src: string; alt: string; className?: string } {
  return { src, alt, className }
}

