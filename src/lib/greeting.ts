/**
 * Time-based Greeting Utility
 * 
 * Provides personalized greetings based on the time of day,
 * inspired by Notion's elegant "Good morning/afternoon/evening" approach.
 */

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
 * Get a time-based greeting message
 */
export function getGreeting(firstName?: string): string {
  const timeOfDay = getTimeOfDay()
  
  const greetings: Record<TimeOfDay, string> = {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good evening', // We use "evening" for night too, like Notion
  }
  
  const greeting = greetings[timeOfDay]
  
  return firstName ? `${greeting}, ${firstName}` : greeting
}

/**
 * Format current date in a friendly way
 * e.g., "Tuesday, December 16"
 */
export function formatCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date relative to today
 * e.g., "Today", "Tomorrow", "Yesterday", or "Dec 16"
 */
export function formatRelativeDate(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const isToday = date.toDateString() === today.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  const isYesterday = date.toDateString() === yesterday.toDateString()
  
  if (isToday) return 'Today'
  if (isTomorrow) return 'Tomorrow'
  if (isYesterday) return 'Yesterday'
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format time in 12-hour format
 * e.g., "9:00 AM"
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

