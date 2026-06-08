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
 * Shared semantic focus ring for interactive primitives.
 *
 * Uses the current theme token (`--interactive-focus`) so components stop
 * baking raw teal utilities into their focus-visible state. Stream 2 can
 * alias this token to `--border-focus` without changing primitive code.
 */
export const focusRing = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-[rgb(var(--interactive-focus))]',
  'focus-visible:ring-offset-2',
  'focus-visible:ring-offset-[rgb(var(--surface-primary))]',
].join(' ')

/**
 * Compact focus treatment for dense controls that cannot afford ring offset.
 */
export const focusRingInset = [
  'focus-visible:outline-none',
  'focus-visible:ring-2',
  'focus-visible:ring-inset',
  'focus-visible:ring-[rgb(var(--interactive-focus))]',
].join(' ')

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

