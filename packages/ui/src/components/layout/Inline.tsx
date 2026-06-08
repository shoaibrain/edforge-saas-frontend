import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const inlineVariants = cva('flex flex-row flex-wrap', {
  variants: {
    gap: {
      none: 'gap-0',
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
    },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
  },
  defaultVariants: {
    gap: 'md',
    align: 'center',
    justify: 'start',
  },
})

export interface InlineProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof inlineVariants> {}

export const Inline = forwardRef<HTMLDivElement, InlineProps>(
  ({ className, gap, align, justify, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(inlineVariants({ gap, align, justify }), className)}
      {...props}
    />
  )
)

Inline.displayName = 'Inline'

export { inlineVariants }
