import {
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'
import { cn, focusRing } from '../utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Apply glass morphism effect */
  glass?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, children, onClick, onKeyDown, tabIndex, role, ...props }, ref) => {
    const isInteractive = typeof onClick === 'function' || role === 'button' || role === 'link'

    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event)
      if (event.defaultPrevented || !isInteractive) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.currentTarget.click()
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-base ease-standard',
          glass
            ? 'glass'
            : 'bg-[rgb(var(--surface-secondary))] border-[rgb(var(--border-primary)/0.6)] shadow-raised hover:shadow-overlay',
          isInteractive && ['cursor-pointer', focusRing],
          className
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role={role}
        tabIndex={isInteractive ? (tabIndex ?? 0) : tabIndex}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>

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

export type CardContentProps = HTMLAttributes<HTMLDivElement>

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
)

CardContent.displayName = 'CardContent'

export type CardFooterProps = HTMLAttributes<HTMLDivElement>

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

