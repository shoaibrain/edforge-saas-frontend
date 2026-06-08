import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '../../utils'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

export interface ErrorStateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  action?: ReactNode
  size?: 'inline' | 'card' | 'page'
}

const sizeClasses = {
  inline: 'px-4 py-6',
  card: 'px-6 py-10',
  page: 'px-6 py-16',
} satisfies Record<NonNullable<ErrorStateProps['size']>, string>

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      className,
      title = 'Something went wrong',
      description = 'The content could not be loaded. Try again or contact support if the issue continues.',
      action,
      size = 'card',
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      role="alert"
      className={cn('flex flex-col items-center justify-center text-center', sizeClasses[size], className)}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgb(var(--state-danger-border)/0.40)] bg-[rgb(var(--state-danger-bg)/0.45)] text-[rgb(var(--state-danger-fg))]">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
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

ErrorState.displayName = 'ErrorState'
