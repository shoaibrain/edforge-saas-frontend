import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  breadcrumbs?: ReactNode
}

export const PageHeader = forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ className, title, description, actions, breadcrumbs, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-3', className)} {...props}>
      {breadcrumbs ? <div className="text-sm text-[rgb(var(--text-tertiary))]">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Heading level={1} variant="page">
            {title}
          </Heading>
          {description ? (
            <Text variant="secondary" className="max-w-3xl">
              {description}
            </Text>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
)

PageHeader.displayName = 'PageHeader'
