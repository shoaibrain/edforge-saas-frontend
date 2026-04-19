import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'

/**
 * LandingButton — primary CTA primitive for the marketing landing surface.
 *
 * This is intentionally landing-local (NOT in @edforge/ui). The shared
 * Button primitive already serves the authed portal with its own visual
 * language; extending it with landing variants would ripple through every
 * consumer (see ADR 001 caveat). Keeping LandingButton local contains the
 * blast radius to this surface.
 *
 * Variants mirror the design bundle's `.btn-*` classes:
 *   primary — orange/crimson pill, white text
 *   ghost   — transparent, bordered
 *   dark    — near-black pill, white text
 *   light   — white pill, ink text (used on dark/gradient surfaces)
 */

type LandingButtonVariant = 'primary' | 'ghost' | 'dark' | 'light'
type LandingButtonSize = 'sm' | 'md' | 'lg'

type CommonProps = {
  variant?: LandingButtonVariant
  size?: LandingButtonSize
  children?: ReactNode
  className?: string
}

type LandingButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    as?: 'button'
    type?: 'button' | 'submit' | 'reset'
    href?: never
  }

type LandingButtonAsAnchor = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    as: 'a'
    href: string
  }

export type LandingButtonProps = LandingButtonAsButton | LandingButtonAsAnchor

const BASE_STYLES =
  'lp-btn inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200'

const VARIANT_STYLES: Record<LandingButtonVariant, string> = {
  primary: 'lp-btn--primary',
  ghost: 'lp-btn--ghost',
  dark: 'lp-btn--dark',
  light: 'lp-btn--light',
}

const SIZE_STYLES: Record<LandingButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-3 text-[14.5px]',
  lg: 'px-6 py-3.5 text-[15px]',
}

function composeClassName(
  variant: LandingButtonVariant,
  size: LandingButtonSize,
  extra?: string
) {
  return [BASE_STYLES, VARIANT_STYLES[variant], SIZE_STYLES[size], extra]
    .filter(Boolean)
    .join(' ')
}

export const LandingButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  LandingButtonProps
>((props, ref) => {
  const { variant = 'primary', size = 'md', className, children } = props

  if (props.as === 'a') {
    const { as: _as, href, variant: _v, size: _s, className: _c, children: _ch, ...rest } = props
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={composeClassName(variant, size, className)}
        {...rest}
      >
        {children}
      </a>
    )
  }

  const { variant: _v, size: _s, className: _c, children: _ch, as: _as, type = 'button', ...rest } = props as LandingButtonAsButton
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={composeClassName(variant, size, className)}
      {...rest}
    >
      {children}
    </button>
  )
})
LandingButton.displayName = 'LandingButton'
