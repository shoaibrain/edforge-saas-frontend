import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const containerVariants = cva('mx-auto w-full', {
  variants: {
    size: {
      narrow: 'max-w-3xl',
      default: 'max-w-6xl',
      wide: 'max-w-7xl',
      prose: 'max-w-prose',
      full: 'max-w-none',
    },
    padding: {
      none: '',
      sm: 'px-4',
      md: 'px-4 sm:px-6',
      lg: 'px-4 sm:px-6 lg:px-8',
    },
  },
  defaultVariants: {
    size: 'default',
    padding: 'md',
  },
})

export interface ContainerProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof containerVariants> {}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(containerVariants({ size, padding }), className)}
      {...props}
    />
  )
)

Container.displayName = 'Container'

export { containerVariants }
