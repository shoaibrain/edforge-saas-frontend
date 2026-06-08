import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../../utils'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  size?: 'inline' | 'card' | 'page'
}

const sizeClasses = {
  inline: 'px-4 py-6',
  card: 'px-6 py-10',
  page: 'px-6 py-16',
} satisfies Record<NonNullable<EmptyStateProps['size']>, string>

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, title, description, action, icon, size = 'card', ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size], className)}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]">
        {icon ?? <Inbox className="h-6 w-6" aria-hidden="true" />}
      </div>
      <Heading level={size === 'page' ? 2 : 3} variant={size === 'page' ? 'section' : 'subsection'}>
        {title}
      </Heading>
      {description ? (
        <Text variant="secondary" className="mt-1 max-w-md">
          {description}
        </Text>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
)

EmptyState.displayName = 'EmptyState'
