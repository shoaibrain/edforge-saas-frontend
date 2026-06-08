import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const stackVariants = cva('flex flex-col', {
  variants: {
    space: {
      none: 'gap-0',
      xs: 'gap-2',
      sm: 'gap-3',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
    align: {
      stretch: 'items-stretch',
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
    },
  },
  defaultVariants: {
    space: 'md',
    align: 'stretch',
  },
})

export interface StackProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stackVariants> {}

export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ className, space, align, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(stackVariants({ space, align }), className)}
      {...props}
    />
  )
)

Stack.displayName = 'Stack'

export { stackVariants }
