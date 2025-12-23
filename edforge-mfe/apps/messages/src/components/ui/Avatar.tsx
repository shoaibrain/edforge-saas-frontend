import { useState, type ImgHTMLAttributes } from 'react'
import { twMerge } from 'tailwind-merge'
import { cva, type VariantProps } from 'class-variance-authority'
import { getUserAvatar } from '@/lib/avatar'

const avatarVariants = cva(
  'inline-flex items-center justify-center overflow-hidden select-none ring-1 ring-[rgb(var(--border-primary))] transition-all duration-200',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-20 h-20 text-2xl',
        '3xl': 'w-24 h-24 text-3xl',
      },
      shape: {
        circle: 'rounded-full',
        rounded: 'rounded-xl',
        square: 'rounded-lg',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  }
)

export interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'>,
    VariantProps<typeof avatarVariants> {
  /** Name used to generate fallback initials and DiceBear avatar */
  name?: string
  /** Custom image source (overrides DiceBear generation) */
  src?: string
}

export function Avatar({
  name,
  src,
  size,
  shape,
  className,
  alt,
  ...props
}: AvatarProps) {
  const [hasError, setHasError] = useState(false)

  // Generate DiceBear URL if no src provided
  const imageSrc = src || (name ? getUserAvatar(name) : undefined)

  // Get initials for fallback
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div 
      className={twMerge(
        avatarVariants({ size, shape }), 
        'bg-[rgb(var(--surface-tertiary))]',
        className
      )}
    >
      {imageSrc && !hasError ? (
        <img
          src={imageSrc}
          alt={alt || name || 'Avatar'}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          {...props}
        />
      ) : (
        <span className="font-semibold text-teal-600 dark:text-cyan-400">{initials || '?'}</span>
      )}
    </div>
  )
}

export interface AvatarGroupProps {
  children: React.ReactNode
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
}

export function AvatarGroup({ children, max = 4, size = 'md' }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children]
  const visibleAvatars = childArray.slice(0, max)
  const remainingCount = childArray.length - max

  return (
    <div className="flex -space-x-2">
      {visibleAvatars}
      {remainingCount > 0 && (
        <div
          className={twMerge(
            avatarVariants({ size, shape: 'circle' }),
            'bg-teal-500/15 dark:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 font-semibold'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
