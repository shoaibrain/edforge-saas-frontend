/**
 * ToggleField Component
 * 
 * A composable toggle/switch field that integrates with react-hook-form.
 * Features animated state transitions and accessibility.
 */

import { useFormContext, type RegisterOptions } from 'react-hook-form'
import { useSpring, animated, config } from '@react-spring/web'
import { cn } from '@/lib/utils'

export interface ToggleFieldProps {
  name: string
  label?: string
  description?: string
  disabled?: boolean
  className?: string
  rules?: RegisterOptions
  size?: 'sm' | 'md' | 'lg'
}

export function ToggleField({
  name,
  label,
  description,
  disabled = false,
  className,
  rules,
  size = 'md',
}: ToggleFieldProps) {
  const { register, watch } = useFormContext()
  const isChecked = watch(name)

  const sizeClasses = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 16 },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 20 },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 28 },
  }[size]

  // Animation springs
  const trackSpring = useSpring({
    backgroundColor: isChecked 
      ? 'rgb(20, 184, 166)' 
      : 'rgb(var(--surface-tertiary))',
    config: config.gentle,
  })

  const thumbSpring = useSpring({
    x: isChecked ? sizeClasses.translate : 0,
    scale: isChecked ? 1 : 0.95,
    config: { tension: 400, friction: 30 },
  })

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* Toggle Switch */}
      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
        <input
          {...register(name, rules)}
          type="checkbox"
          className="sr-only peer"
          disabled={disabled}
          aria-describedby={description ? `${name}-description` : undefined}
        />
        
        {/* Track */}
        <animated.div
          style={trackSpring}
          className={cn(
            sizeClasses.track,
            'rounded-full transition-colors',
            'peer-focus:ring-4 peer-focus:ring-teal-500/20',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        />
        
        {/* Thumb */}
        <animated.div
          style={{
            transform: thumbSpring.x.to((x) => `translateX(${x}px) scale(${thumbSpring.scale.get()})`),
          }}
          className={cn(
            sizeClasses.thumb,
            'absolute left-0.5 top-0.5 bg-white rounded-full shadow-sm',
            'pointer-events-none'
          )}
        />
      </label>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              htmlFor={name}
              className={cn(
                'block text-sm font-medium text-[rgb(var(--text-primary))]',
                disabled && 'opacity-60'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={`${name}-description`}
              className={cn(
                'text-xs text-[rgb(var(--text-tertiary))] mt-0.5',
                disabled && 'opacity-60'
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

