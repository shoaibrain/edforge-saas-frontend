/**
 * Time-based Greeting Utility
 *
 * Provides personalized greetings based on the time of day,
 * inspired by Notion's elegant "Good morning/afternoon/evening" approach.
 * Supports i18n via an optional translation function parameter.
 */

import type { TFunction } from 'i18next'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Get the current time of day based on the hour
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Get a time-based greeting message.
 * When a translation function is provided, uses i18n keys from the dashboard namespace.
 */
export function getGreeting(firstName?: string, t?: TFunction): string {
  const timeOfDay = getTimeOfDay()
  const key = timeOfDay === 'night' ? 'evening' : timeOfDay

  let greeting: string
  if (t) {
    greeting = t(`greeting.${key}`)
  } else {
    const fallbacks: Record<TimeOfDay, string> = {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good evening',
    }
    greeting = fallbacks[timeOfDay]
  }

  return firstName ? `${greeting}, ${firstName}` : greeting
}

/**
 * Format current date in a friendly way.
 * Uses the provided locale for Intl formatting.
 */
export function formatCurrentDate(locale = 'en-US'): string {
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date relative to today.
 * When a translation function is provided, uses i18n keys for "Today"/"Tomorrow"/"Yesterday".
 */
export function formatRelativeDate(date: Date, t?: TFunction, locale = 'en-US'): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return t ? t('today') : 'Today'
  if (isTomorrow) return t ? t('tomorrow') : 'Tomorrow'
  if (isYesterday) return t ? t('yesterday') : 'Yesterday'

  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time in 12-hour format
 */
export function formatTime(date: Date, locale = 'en-US'): string {
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
