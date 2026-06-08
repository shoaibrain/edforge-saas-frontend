import { forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const pageShellVariants = cva('min-w-0', {
  variants: {
    variant: {
      default: 'mx-auto w-full px-6 py-8',
      settings: 'mx-auto w-full px-6 py-8',
      dataTable: 'mx-auto w-full px-4 py-6 sm:px-6',
      detail: 'mx-auto w-full px-6 py-8',
      wizard: 'mx-auto w-full px-6 py-8',
      overview: 'mx-auto w-full px-6 py-8',
    },
    width: {
      narrow: 'max-w-3xl',
      default: 'max-w-5xl',
      wide: 'max-w-7xl',
      full: 'max-w-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    width: 'default',
  },
})

const defaultWidthByVariant: Record<NonNullable<PageShellProps['variant']>, NonNullable<PageShellProps['width']>> = {
  default: 'default',
  settings: 'wide',
  dataTable: 'full',
  detail: 'wide',
  wizard: 'narrow',
  overview: 'wide',
}

export interface PageShellProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof pageShellVariants> {
  as?: 'main' | 'section' | 'div'
}

export const PageShell = forwardRef<HTMLElement, PageShellProps>(
  ({ as: Component = 'main', className, variant = 'default', width, ...props }, ref) => {
    const resolvedWidth = width ?? defaultWidthByVariant[variant ?? 'default']

    return (
      <Component
        ref={ref as never}
        className={cn(pageShellVariants({ variant, width: resolvedWidth }), className)}
        {...props}
      />
    )
  }
)

PageShell.displayName = 'PageShell'

export { pageShellVariants }
