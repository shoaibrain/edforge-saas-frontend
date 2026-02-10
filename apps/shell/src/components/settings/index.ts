/**
 * Settings Components Index
 * 
 * Export all settings-related components.
 */

// Shared components
export {
  SettingsSection,
  SettingsCard,
  SettingsAlert,
  staggerChildren,
  fadeInUp,
} from './SettingsShared'

// School configuration components
export { SchoolDaysSelector, formatSchoolDays } from './SchoolDaysSelector'
export { TimeRangePicker, formatTime, formatTimeRange } from './TimeRangePicker'
export { GradingScaleEditor, type GradeLevelConfig } from './GradingScaleEditor'
export { FeatureToggles, DEFAULT_FEATURES, type SchoolFeatures } from './FeatureToggles'
export { HolidayManager } from './HolidayManager'

// Education Organization components
export { OrganizationHierarchyTree } from './OrganizationHierarchyTree'
export type { TreeNodeAction } from './OrganizationHierarchyTree'
export { OrphanedSchoolsBanner } from './OrphanedSchoolsBanner'
export { SEASetupForm } from './SEASetupForm'
export { LEAForm } from './LEAForm'
export { ESCForm } from './ESCForm'
