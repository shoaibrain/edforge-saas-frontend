import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'
import { Text } from '../typography/Text'

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode
  size?: 'inline' | 'card' | 'page'
}

const sizeClasses = {
  inline: 'px-4 py-4',
  card: 'px-6 py-10',
  page: 'px-6 py-16',
} satisfies Record<NonNullable<LoadingStateProps['size']>, string>

export const LoadingState = forwardRef<HTMLDivElement, LoadingStateProps>(
  ({ className, label = 'Loading…', size = 'card', ...props }, ref) => (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size], className)}
      {...props}
    >
      <span
        className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[rgb(var(--border-secondary))] border-t-[rgb(var(--border-focus))]"
        aria-hidden="true"
      />
      <Text variant="caption">{label}</Text>
    </div>
  )
)

LoadingState.displayName = 'LoadingState'
