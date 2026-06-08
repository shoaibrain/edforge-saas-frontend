import { createElement, forwardRef, type HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-sm leading-6 text-[rgb(var(--text-primary))]',
      secondary: 'text-sm leading-6 text-[rgb(var(--text-secondary))]',
      caption: 'text-xs leading-5 text-[rgb(var(--text-tertiary))]',
      label: 'text-xs font-medium uppercase tracking-wide text-[rgb(var(--text-tertiary))]',
      code: 'font-mono text-xs text-[rgb(var(--text-primary))]',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
  },
  defaultVariants: {
    variant: 'body',
    weight: 'normal',
  },
})

export interface TextProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'p' | 'span' | 'div'
}

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ as = 'p', className, variant, weight, ...props }, ref) =>
    createElement(as, {
      ref,
      className: cn(textVariants({ variant, weight }), className),
      ...props,
    })
)

Text.displayName = 'Text'

export { textVariants }
