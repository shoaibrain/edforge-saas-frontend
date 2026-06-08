/**
 * FeatureToggles Component
 * 
 * Toggle switches for enabling/disabling school features.
 */

import { motion } from 'framer-motion'
import {
  ClipboardCheck,
  GraduationCap,
  UserPlus,
  BookOpen,
  Calendar,
  Sparkles,
  Users,
  UserCircle,
} from 'lucide-react'

export interface SchoolFeatures {
  attendance: boolean
  grades: boolean
  enrollment: boolean
  curriculum: boolean
  scheduling: boolean
  specialPrograms: boolean
  parentPortal: boolean
  studentPortal: boolean
}

interface FeatureTogglesProps {
  features: SchoolFeatures
  onChange: (features: SchoolFeatures) => void
  disabled?: boolean
}

const FEATURE_CONFIG = [
  {
    key: 'attendance' as keyof SchoolFeatures,
    label: 'Attendance Tracking',
    description: 'Track student attendance and generate reports',
    icon: ClipboardCheck,
  },
  {
    key: 'grades' as keyof SchoolFeatures,
    label: 'Grades & Report Cards',
    description: 'Manage grades, assignments, and generate report cards',
    icon: GraduationCap,
  },
  {
    key: 'enrollment' as keyof SchoolFeatures,
    label: 'Student Enrollment',
    description: 'Handle student enrollment and registration',
    icon: UserPlus,
  },
  {
    key: 'curriculum' as keyof SchoolFeatures,
    label: 'Curriculum Management',
    description: 'Manage courses, lesson plans, and learning materials',
    icon: BookOpen,
  },
  {
    key: 'scheduling' as keyof SchoolFeatures,
    label: 'Scheduling',
    description: 'Class scheduling and timetable management',
    icon: Calendar,
  },
  {
    key: 'specialPrograms' as keyof SchoolFeatures,
    label: 'Special Programs',
    description: 'IEP, 504 plans, and special education services',
    icon: Sparkles,
  },
  {
    key: 'parentPortal' as keyof SchoolFeatures,
    label: 'Parent Portal',
    description: 'Allow parents to view student information',
    icon: Users,
  },
  {
    key: 'studentPortal' as keyof SchoolFeatures,
    label: 'Student Portal',
    description: 'Allow students to access their own information',
    icon: UserCircle,
  },
]

export function FeatureToggles({ features, onChange, disabled }: FeatureTogglesProps) {
  const handleToggle = (key: keyof SchoolFeatures) => {
    if (disabled) return
    onChange({
      ...features,
      [key]: !features[key],
    })
  }

  return (
    <div className="space-y-3">
      {FEATURE_CONFIG.map((feature) => {
        const isEnabled = features[feature.key]
        const Icon = feature.icon
        
        return (
          <motion.div
            key={feature.key}
            className={`
              flex items-center justify-between p-4 rounded-xl
              border transition-colors
              ${isEnabled
                ? 'bg-[rgb(var(--action-primary-bg))]/5 border-[rgb(var(--border-focus)/0.35)]'
                : 'bg-[rgb(var(--background-secondary))] border-[rgb(var(--border-primary))]'
              }
              ${disabled ? 'opacity-60' : ''}
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-lg
                ${isEnabled
                  ? 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))] '
                  : 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]'
                }
              `}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm font-medium ${isEnabled ? 'text-[rgb(var(--text-primary))]' : 'text-[rgb(var(--text-secondary))]'}`}>
                  {feature.label}
                </h4>
                <p className="text-xs text-[rgb(var(--text-tertiary))]">
                  {feature.description}
                </p>
              </div>
            </div>
            
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => handleToggle(feature.key)}
              disabled={disabled}
              className={`
                relative w-11 h-6 rounded-full transition-colors
                ${isEnabled ? 'bg-[rgb(var(--action-primary-bg))]' : 'bg-[rgb(var(--background-tertiary))]'}
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-[rgb(var(--border-focus)/0.40)] focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-primary))]
              `}
              role="switch"
              aria-checked={isEnabled}
            >
              <motion.span
                className="absolute top-1 left-1 w-4 h-4 bg-[rgb(var(--background-secondary))] rounded-full shadow"
                animate={{ x: isEnabled ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}

// Default features configuration
export const DEFAULT_FEATURES: SchoolFeatures = {
  attendance: true,
  grades: true,
  enrollment: true,
  curriculum: true,
  scheduling: true,
  specialPrograms: false,
  parentPortal: false,
  studentPortal: false,
}
