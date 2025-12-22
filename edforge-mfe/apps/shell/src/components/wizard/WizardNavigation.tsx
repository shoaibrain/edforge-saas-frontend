/**
 * Wizard Navigation
 * 
 * Navigation buttons for wizard forms.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { useSpring, animated, config } from '@react-spring/web'
import { ArrowLeft, ArrowRight, Check, Loader2, SkipForward } from 'lucide-react'
import { useWizard } from './WizardContext'
import { cn } from '../../lib/utils'

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
}

function AnimatedButton({
  variant = 'primary',
  icon,
  iconPosition = 'right',
  loading,
  children,
  disabled,
  className,
  ...props
}: AnimatedButtonProps) {
  const [hovered, setHovered] = React.useState(false)

  const springProps = useSpring({
    scale: hovered && !disabled ? 1.02 : 1,
    y: hovered && !disabled ? -2 : 0,
    config: config.wobbly,
  })

  const variants = {
    primary: cn(
      'text-white brand-gradient-warm',
      'shadow-md shadow-golden-500/20',
      'hover:opacity-90 hover:shadow-lg hover:shadow-golden-500/30',
      'disabled:opacity-50 disabled:shadow-none'
    ),
    secondary: cn(
      'bg-[rgb(var(--surface-tertiary))]',
      'text-[rgb(var(--text-primary))]',
      'border border-[rgb(var(--border-primary))]',
      'hover:bg-[rgb(var(--interactive-hover))]',
      'disabled:opacity-50'
    ),
    ghost: cn(
      'text-[rgb(var(--text-secondary))]',
      'hover:bg-[rgb(var(--interactive-hover))]',
      'hover:text-[rgb(var(--text-primary))]',
      'disabled:opacity-50'
    ),
  }

  return (
    <animated.button
      {...props}
      disabled={disabled || loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        transform: springProps.scale.to(
          (s) => `scale(${s}) translateY(${springProps.y.get()}px)`
        ),
      }}
      className={cn(
        'flex items-center justify-center gap-2 px-5 py-2.5',
        'text-sm font-semibold rounded-xl',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-2',
        'disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </animated.button>
  )
}

export interface WizardNavigationProps {
  isLoading?: boolean
  submitText?: string
  onBack?: () => void
  onNext?: () => Promise<boolean> | boolean
  onSubmit?: () => void
  showSkip?: boolean
  onSkip?: () => void
  className?: string
}

export function WizardNavigation({
  isLoading = false,
  submitText = 'Submit',
  onBack,
  onNext,
  onSubmit,
  showSkip = false,
  onSkip,
  className,
}: WizardNavigationProps) {
  const { currentStep, steps, goToBack, goToNext, submit, currentStepData, isSubmitting } = useWizard()
  
  const isFirst = currentStep === 0
  const isLast = currentStep === steps.length - 1
  const isOptional = currentStepData?.isOptional

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      goToBack()
    }
  }

  const handleNext = async () => {
    if (onNext) {
      const shouldProceed = await onNext()
      if (shouldProceed) {
        await goToNext()
      }
    } else {
      await goToNext()
    }
  }

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit()
    } else {
      submit()
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      goToNext()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex items-center justify-between pt-6 border-t border-[rgb(var(--border-secondary))]',
        className
      )}
    >
      <div>
        {!isFirst && (
          <AnimatedButton
            type="button"
            variant="ghost"
            onClick={handleBack}
            icon={<ArrowLeft className="w-4 h-4" />}
            iconPosition="left"
          >
            Back
          </AnimatedButton>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSkip && isOptional && (
          <AnimatedButton
            type="button"
            variant="ghost"
            onClick={handleSkip}
            icon={<SkipForward className="w-4 h-4" />}
          >
            Skip
          </AnimatedButton>
        )}

        {isLast ? (
          <AnimatedButton
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={isSubmitting || isLoading}
            icon={<Check className="w-4 h-4" />}
          >
            {submitText}
          </AnimatedButton>
        ) : (
          <AnimatedButton
            type="button"
            variant="primary"
            onClick={handleNext}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Continue
          </AnimatedButton>
        )}
      </div>
    </motion.div>
  )
}

export interface WizardFooterProps extends WizardNavigationProps {
  fixed?: boolean
}

export function WizardFooter({ fixed = true, ...props }: WizardFooterProps) {
  return (
    <div
      className={cn(
        'bg-[rgb(var(--surface-secondary))] border-t border-[rgb(var(--border-primary))]',
        fixed && 'fixed bottom-0 left-0 right-0 z-40'
      )}
    >
      <div className="max-w-4xl mx-auto px-6 py-4">
        <WizardNavigation {...props} />
      </div>
    </div>
  )
}

