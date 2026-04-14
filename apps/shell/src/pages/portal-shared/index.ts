/**
 * Portal Shared — Re-exports for portal page consumption
 *
 * Primitives come from @edforge/ui (shared across the platform).
 * Composition components (GpaHeroSection, TodayTimeline, etc.) live here
 * and are added in Sprints 2–6 as they are built.
 */

// Re-export @edforge/ui primitives for convenient portal imports
export {
  ContentSection,
  DashedDivider,
  StatusPill,
  StatStrip,
  GpaRing,
  CategoryBar,
} from '@edforge/ui'

export type {
  ContentSectionProps,
  DashedDividerProps,
  StatusPillProps,
  StatusPillVariant,
  StatStripProps,
  StatStripItem,
  GpaRingProps,
  GpaRingSize,
  CategoryBarProps,
} from '@edforge/ui'

// Portal composition components
export { NoActiveChild } from './NoActiveChild'
export { HeroGreeting, type HeroGreetingProps } from './HeroGreeting'
export { TodayTimeline, type TodayTimelineProps } from './TodayTimeline'
export { AssignmentList, type AssignmentListProps } from './AssignmentList'
export { GradedItemTimeline, type GradedItemTimelineProps } from './GradedItemTimeline'
export { TermSwitcher, type TermSwitcherProps } from './TermSwitcher'
export { GpaHeroSection, type GpaHeroSectionProps } from './GpaHeroSection'
export { SignalBanner, type SignalBannerProps, type SignalLevel } from './SignalBanner'
export { AttendanceRateHero, type AttendanceRateHeroProps } from './AttendanceRateHero'
export { StatusTileGrid, type StatusTileGridProps } from './StatusTileGrid'
export { AttendanceRecordsList, type AttendanceRecordsListProps } from './AttendanceRecordsList'
