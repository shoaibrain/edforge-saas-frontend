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
            ? 'glass'
            : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary))] shadow-sm hover:shadow-md',
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

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> { }

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-b border-[rgb(var(--border-secondary))]',
        className
      )}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> { }

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> { }

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'px-6 py-4 border-t border-[rgb(var(--border-secondary))]',
        className
      )}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

