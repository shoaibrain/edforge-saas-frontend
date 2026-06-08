import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../utils'
import { Card, CardContent, CardHeader } from '../Card'
import { Heading } from '../typography/Heading'
import { Text } from '../typography/Text'

export interface SectionCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  contentClassName?: string
}

export const SectionCard = forwardRef<HTMLDivElement, SectionCardProps>(
  (
    {
      className,
      title,
      description,
      actions,
      children,
      contentClassName,
      ...props
    },
    ref
  ) => (
    <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
      {title || description || actions ? (
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            {title ? (
              <Heading level={2} variant="section">
                {title}
              </Heading>
            ) : null}
            {description ? <Text variant="secondary">{description}</Text> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  )
)

SectionCard.displayName = 'SectionCard'
