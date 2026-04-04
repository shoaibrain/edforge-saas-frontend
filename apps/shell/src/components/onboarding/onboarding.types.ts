/**
 * Onboarding Flow Types
 */

export interface OnboardingStepConfig {
  id: string
  name: string
  skippable: boolean
  skipWarning?: string
}

export interface OnboardingData {
  /** Step 1: Identity */
  firstName?: string
  lastName?: string
  displayName?: string

  /** Step 3: School */
  schoolId?: string
  schoolName?: string

  /** Step 4: Academic Year */
  academicYearId?: string
  academicYearName?: string

  /** Step 5: Invitees */
  invitees?: Array<{ email: string; firstName: string; lastName: string; globalRole: string }>
}

export interface OnboardingStepProps {
  data: OnboardingData
  setData: (updater: (prev: OnboardingData) => OnboardingData) => void
  onNext: () => void
  onBack: () => void
  onSkip?: () => void
}

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  { id: 'welcome', name: 'Welcome', skippable: false },
  { id: 'identity', name: 'Your Profile', skippable: true },
  { id: 'workspace', name: 'Workspace Settings', skippable: false },
  { id: 'school', name: 'First School', skippable: true, skipWarning: 'Finance and Academics won\'t work until at least one school is created.' },
  { id: 'academic-year', name: 'Academic Year', skippable: true, skipWarning: 'Academics features require an active academic year.' },
  { id: 'invite', name: 'Invite Team', skippable: true },
  { id: 'complete', name: 'All Done', skippable: false },
]

export const PROGRESS_VALUES = [0, 14, 28, 44, 58, 74, 90, 100]
