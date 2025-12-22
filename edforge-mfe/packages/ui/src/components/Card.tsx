import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply glass morphism effect */
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-200',
          glass
            ? 'backdrop-blur-xl shadow-lg bg-white/90 dark:bg-slate-900/90 border-white/50 dark:border-slate-700/50'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-b border-slate-100 dark:border-slate-800',
        className
      )}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-t border-slate-100 dark:border-slate-800',
        className
      )}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

