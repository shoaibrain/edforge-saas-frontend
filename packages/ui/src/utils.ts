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
export function getUserAvatar(name: string, style: string = 'lorelei'): string {
  const params = new URLSearchParams({
    seed: name,
    size: '128',
    radius: '50',
  })
  const bgColors = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf']
  bgColors.forEach((color) => params.append('backgroundColor', color))
  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`
}

