import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { twMerge } from 'tailwind-merge'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm',
        secondary:
          'bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300',
        outline:
          'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100',
        ghost:
          'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200',
        danger:
          'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
        link: 'text-brand-600 underline-offset-4 hover:underline',
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
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(buttonVariants({ variant, size }), className)}
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

