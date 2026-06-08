/**
 * Wizard Progress Indicator
 * 
 * Horizontal stepper showing wizard progress.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { Check, AlertCircle } from 'lucide-react'
import { useWizard } from './WizardContext'
import type { WizardStepStatus } from './types'
import { cn } from './utils'

interface StepIndicatorProps {
  index: number
  title: string
  icon: React.ComponentType<{ className?: string }>
  status: WizardStepStatus
  isLast: boolean
  onClick?: () => void
  isClickable: boolean
}

function StepIndicator({
  index,
  title,
  icon: Icon,
  status,
  isLast,
  onClick,
  isClickable,
}: StepIndicatorProps) {
  const [hovered, setHovered] = React.useState(false)

  const springProps = useSpring({
    scale: hovered && isClickable ? 1.1 : 1,
    y: hovered && isClickable ? -2 : 0,
    config: config.wobbly,
  })

  const getStatusColors = () => {
    switch (status) {
      case 'completed':
        return {
          bg: 'bg-teal-500 dark:bg-cyan-500',
          border: 'border-teal-500 dark:border-cyan-500',
          text: 'text-white',
          title: 'text-[rgb(var(--text-primary))]',
        }
      case 'current':
        return {
          bg: 'bg-gradient-to-br from-golden-500 to-caramel-500',
          border: 'border-golden-500',
          text: 'text-white',
          title: 'text-[rgb(var(--text-primary))]',
        }
      case 'error':
        return {
          bg: 'bg-rust-500',
          border: 'border-rust-500',
          text: 'text-white',
          title: 'text-rust-500',
        }
      default:
        return {
          bg: 'bg-[rgb(var(--background-tertiary))]',
          border: 'border-[rgb(var(--border-primary))]',
          text: 'text-[rgb(var(--text-tertiary))]',
          title: 'text-[rgb(var(--text-tertiary))]',
        }
    }
  }

  const colors = getStatusColors()

  return (
    <div className="flex items-center">
      <animated.button
        type="button"
        onClick={isClickable ? onClick : undefined}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          transform: springProps.scale.to(
            (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
          ),
        }}
        disabled={!isClickable}
        className={cn(
          'relative flex flex-col items-center group',
          isClickable && 'cursor-pointer',
          !isClickable && 'cursor-default'
        )}
        aria-current={status === 'current' ? 'step' : undefined}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
            colors.bg,
            colors.border,
            colors.text,
            'shadow-md',
            status === 'current' && 'ring-4 ring-golden-500/20 shadow-lg shadow-golden-500/30'
          )}
        >
          {status === 'completed' ? (
            <Check className="w-5 h-5" />
          ) : status === 'error' ? (
            <AlertCircle className="w-5 h-5" />
          ) : status === 'current' ? (
            <Icon className="w-5 h-5" />
          ) : (
            <span className="text-sm font-semibold">{index + 1}</span>
          )}
        </motion.div>

        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.1 }}
          className={cn(
            'mt-2 text-xs font-medium text-center max-w-[80px] truncate hidden sm:block',
            colors.title
          )}
        >
          {title}
        </motion.span>
      </animated.button>

      {!isLast && (
        <div className="flex-1 mx-2 sm:mx-4">
          <div className="relative h-0.5 bg-[rgb(var(--border-primary))] rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: status === 'completed' ? 1 : 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ originX: 0 }}
              className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export interface WizardProgressProps {
  className?: string
}

export function WizardProgress({ className }: WizardProgressProps) {
  const { steps, getStepStatus, goToStep, canGoToStep } = useWizard()

  return (
    <nav aria-label="Wizard progress" className={cn("w-full max-w-3xl mx-auto px-4", className)}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <StepIndicator
            key={step.id}
            index={index}
            title={step.title}
            icon={step.icon}
            status={getStepStatus(index)}
            isLast={index === steps.length - 1}
            onClick={() => goToStep(index)}
            isClickable={canGoToStep(index)}
          />
        ))}
      </div>
    </nav>
  )
}

export interface WizardProgressCompactProps {
  className?: string
}

export function WizardProgressCompact({ className }: WizardProgressCompactProps) {
  const { steps, currentStep, getStepStatus } = useWizard()

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {steps.map((_, index) => {
        const status = getStepStatus(index)
        return (
          <motion.div
            key={index}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'w-2 h-2 rounded-full transition-all duration-300',
              status === 'current' && 'w-6 bg-gradient-to-r from-golden-500 to-caramel-500',
              status === 'completed' && 'bg-teal-500 dark:bg-cyan-500',
              status === 'pending' && 'bg-[rgb(var(--border-primary))]',
              status === 'error' && 'bg-rust-500'
            )}
          />
        )
      })}
      <span className="ml-2 text-sm text-[rgb(var(--text-tertiary))]">
        Step {currentStep + 1} of {steps.length}
      </span>
    </div>
  )
}

