import { createElement, forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const headingVariants = cva('text-[rgb(var(--text-primary))]', {
  variants: {
    variant: {
      display: 'text-4xl font-semibold tracking-tight sm:text-5xl',
      page: 'text-2xl font-semibold tracking-tight sm:text-3xl',
      section: 'text-lg font-semibold tracking-tight',
      subsection: 'text-base font-semibold',
    },
  },
  defaultVariants: {
    variant: 'section',
  },
})

export interface HeadingProps
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, level = 2, variant, ...props }, ref) =>
    createElement(`h${level}`, {
      ref,
      className: cn(headingVariants({ variant }), className),
      ...props,
    })
)

Heading.displayName = 'Heading'

export { headingVariants }
