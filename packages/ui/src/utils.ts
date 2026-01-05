/**
 * Utility Functions for @edforge/ui
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a DiceBear avatar URL from a name
 */
export function getUserAvatar(name: string, style: string = 'initials'): string {
  const seed = encodeURIComponent(name)
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=0a9396,005f73,94d2bd&textColor=ffffff`
}

