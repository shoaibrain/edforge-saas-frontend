/**
 * @edforge/forms utilities
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind merge support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get nested error from react-hook-form errors object
 * Supports paths like "address.city"
 */
export function getNestedError(
  errors: Record<string, any>,
  path: string
): { message?: string } | undefined {
  return path.split('.').reduce((acc: any, part) => acc?.[part], errors)
}

/**
 * Get nested touched field status
 */
export function getNestedTouched(
  touchedFields: Record<string, any>,
  path: string
): boolean {
  const result = path.split('.').reduce((acc: any, part) => acc?.[part], touchedFields)
  return !!result
}

/**
 * Get nested dirty field status
 */
export function getNestedDirty(
  dirtyFields: Record<string, any>,
  path: string
): boolean {
  const result = path.split('.').reduce((acc: any, part) => acc?.[part], dirtyFields)
  return !!result
}

