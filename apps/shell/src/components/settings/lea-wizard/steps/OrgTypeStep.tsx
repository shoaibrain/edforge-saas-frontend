/**
 * Organization Type Step
 *
 * Step 1: Card-based selection for district type.
 * Auto-fills leaCategoryDescriptor and charterStatusDescriptor.
 */

import { motion } from 'framer-motion'
import { Building2, Scale, Layers } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import type { LucideIcon } from 'lucide-react'

const ORG_TYPE_OPTIONS: {
  value: string
  label: string
  description: string
  icon: LucideIcon
  color: string
  bgColor: string
}[] = [
  {
    value: 'Independent',
    label: 'Public District',
    description:
      'Standard independent school district (ISD). The most common type for public K-12 education.',
    icon: Building2,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-500/10',
  },
  {
    value: 'CharterLEA',
    label: 'Charter Network',
    description:
      'Charter school organization operating under a charter agreement with an authorizer.',
    icon: Scale,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    value: 'Other',
    label: 'Other',
    description:
      'Intermediate, supervisory union, private school system, or other organization type.',
    icon: Layers,
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-500/10',
  },
]

export function OrgTypeStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const selected = (data.leaCategoryDescriptor as string) || ''

  const handleSelect = (value: string) => {
    updateData({ leaCategoryDescriptor: value })
    clearError('leaCategoryDescriptor')

    // Clear charter status when switching away from Charter
    if (value !== 'CharterLEA') {
      updateData({ leaCategoryDescriptor: value, charterStatusDescriptor: undefined })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-[rgb(var(--text-primary))] mb-1">
          What type of district are you creating?
        </h3>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">
          This determines the Ed-Fi category and available configuration options.
        </p>
      </div>

      <div className="grid gap-3">
        {ORG_TYPE_OPTIONS.map((opt) => {
          const isActive = selected === opt.value
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelect(opt.value)}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                isActive
                  ? 'border-teal-500 bg-teal-500/5'
                  : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-tertiary))]'
              }`}
            >
              <div className={`p-2.5 rounded-lg ${opt.bgColor} shrink-0`}>
                <opt.icon className={`w-5 h-5 ${opt.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[rgb(var(--text-primary))]">
                  {opt.label}
                </p>
                <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5 leading-relaxed">
                  {opt.description}
                </p>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center shrink-0 mt-0.5"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {errors.leaCategoryDescriptor && (
        <p className="text-xs text-red-500">{errors.leaCategoryDescriptor}</p>
      )}
    </motion.div>
  )
}
