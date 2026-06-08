import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn, focusRing } from '../utils'

const buttonVariants = cva(
  // Base styles — use theme-aware focus ring
  cn(
    'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none',
    focusRing
  ),
  {
    variants: {
      variant: {
        primary:
          'bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] hover:bg-[rgb(var(--action-primary-bg-hover))] active:bg-[rgb(var(--action-primary-bg-active))] shadow-sm',
        secondary:
          'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-elevated))] active:opacity-80',
        outline:
          'border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--background-tertiary))] active:opacity-80',
        ghost:
          'text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] hover:text-[rgb(var(--text-primary))] active:opacity-80',
        danger:
          'bg-[rgb(var(--action-danger-bg))] text-[rgb(var(--action-danger-fg))] hover:brightness-95 active:brightness-90 shadow-sm',
        link: 'text-[rgb(var(--action-secondary-fg))] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2',
        lg: 'h-12 px-6 text-base rounded-xl gap-2',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { buttonVariants }

