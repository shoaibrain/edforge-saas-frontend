/**
 * Coming Soon Components
 *
 * Reusable "Coming Soon" UI elements for features not yet available.
 * Includes a small inline badge and a larger banner with SVG illustration.
 *
 * Design: Enterprise-grade, approachable, vibrant with EdForge teal/cyan palette.
 *
 * COMING_SOON: When a feature ships, remove its ComingSoonBanner/ComingSoonBadge
 * usage and restore the original interactive components. Search for "COMING_SOON:"
 * comments across the codebase to find all suppressed features.
 */

import { useId, type ReactNode } from 'react'

// ============================================================================
// SVG ILLUSTRATION — Vibrant geometric "building/launching" motif
// ============================================================================

/**
 * Professional SVG illustration for "Coming Soon" states.
 * Features geometric shapes, construction elements, and the EdForge palette.
 * Uses useId() to generate unique SVG IDs, avoiding collisions when
 * multiple banners render on the same page.
 */
function ComingSoonIllustration({
  variant = 'default',
  className = '',
}: {
  variant?: 'default' | 'security' | 'communication' | 'admin'
  className?: string
}) {
  const uid = useId()
  const gradTeal = `cs-teal-${uid}`
  const gradAccent = `cs-accent-${uid}`

  return (
    <svg
      viewBox="0 0 280 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[280px] ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradTeal} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#005f73" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0a9396" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id={gradAccent} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0a9396" />
          <stop offset="100%" stopColor="#94d2bd" />
        </linearGradient>
      </defs>

      {/* Soft background shape */}
      <rect x="40" y="20" width="200" height="140" rx="70" fill={`url(#${gradTeal})`} />

      {/* Decorative circles — constellation pattern */}
      <circle cx="60" cy="40" r="3" fill="#0a9396" opacity="0.3" />
      <circle cx="220" cy="35" r="2.5" fill="#0a9396" opacity="0.25" />
      <circle cx="240" cy="110" r="2" fill="#0a9396" opacity="0.2" />
      <circle cx="45" cy="140" r="2" fill="#0a9396" opacity="0.2" />
      <circle cx="190" cy="25" r="1.5" fill="#94d2bd" opacity="0.3" />
      <circle cx="80" cy="160" r="1.5" fill="#94d2bd" opacity="0.25" />

      {/* Dotted arc — journey */}
      <path
        d="M 80 130 Q 140 50, 200 130"
        stroke="#0a9396"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        fill="none"
        opacity="0.25"
      />

      {variant === 'default' && (
        <>
          {/* Central rocket/launch element */}
          <g transform="translate(140, 90)">
            <rect x="-30" y="20" width="60" height="6" rx="3" fill="#005f73" opacity="0.15" />
            <rect x="-8" y="-30" width="16" height="40" rx="8" fill={`url(#${gradAccent})`} />
            <path d="M -8 -30 L 0 -48 L 8 -30" fill="#005f73" />
            <circle cx="0" cy="-18" r="4" fill="#e9f6f2" />
            <circle cx="0" cy="-18" r="2.5" fill="#005f73" opacity="0.3" />
            <path d="M -8 5 L -16 15 L -8 10 Z" fill="#0a9396" opacity="0.7" />
            <path d="M 8 5 L 16 15 L 8 10 Z" fill="#0a9396" opacity="0.7" />
            <circle cx="-3" cy="18" r="3" fill="#ee9b00" opacity="0.5" />
            <circle cx="3" cy="22" r="2.5" fill="#ee9b00" opacity="0.35" />
            <circle cx="0" cy="28" r="2" fill="#d9bc66" opacity="0.2" />
          </g>
          <g fill="#0a9396" opacity="0.5">
            <path d="M 95 55 l 2 5 2 -5 -5 2 5 2 z" />
            <path d="M 185 62 l 1.5 4 1.5 -4 -4 1.5 4 1.5 z" />
            <path d="M 110 115 l 1 3 1 -3 -3 1 3 1 z" />
          </g>
        </>
      )}

      {variant === 'security' && (
        <>
          <g transform="translate(140, 85)">
            <path
              d="M 0 -40 L 28 -28 L 28 5 Q 28 30 0 42 Q -28 30 -28 5 L -28 -28 Z"
              fill={`url(#${gradAccent})`}
              opacity="0.9"
            />
            <path
              d="M 0 -32 L 22 -22 L 22 3 Q 22 24 0 34 Q -22 24 -22 3 L -22 -22 Z"
              fill="#001219"
              opacity="0.15"
            />
            <rect x="-8" y="-6" width="16" height="14" rx="3" fill="#e9f6f2" opacity="0.9" />
            <path d="M -5 -6 L -5 -12 Q -5 -20 0 -20 Q 5 -20 5 -12 L 5 -6" stroke="#e9f6f2" strokeWidth="2.5" fill="none" opacity="0.9" />
            <circle cx="0" cy="3" r="2" fill="#005f73" />
          </g>
          <g fill="#ee9b00" opacity="0.5">
            <path d="M 95 50 l 2 5 2 -5 -5 2 5 2 z" />
            <path d="M 185 55 l 1.5 4 1.5 -4 -4 1.5 4 1.5 z" />
          </g>
        </>
      )}

      {variant === 'communication' && (
        <>
          <g transform="translate(140, 85)">
            <rect x="-35" y="-30" width="50" height="35" rx="10" fill={`url(#${gradAccent})`} />
            <path d="M -10 5 L -5 15 L 0 5" fill="#0a9396" />
            <rect x="5" y="-10" width="35" height="25" rx="8" fill="#005f73" opacity="0.6" />
            <path d="M 25 15 L 30 23 L 35 15" fill="#005f73" opacity="0.6" />
            <rect x="-28" y="-22" width="20" height="2.5" rx="1" fill="#e9f6f2" opacity="0.7" />
            <rect x="-28" y="-16" width="30" height="2.5" rx="1" fill="#e9f6f2" opacity="0.5" />
            <rect x="-28" y="-10" width="15" height="2.5" rx="1" fill="#e9f6f2" opacity="0.4" />
            <rect x="12" y="-3" width="18" height="2" rx="1" fill="#e9f6f2" opacity="0.5" />
            <rect x="12" y="3" width="12" height="2" rx="1" fill="#e9f6f2" opacity="0.4" />
          </g>
          <g fill="#ee9b00" opacity="0.5">
            <path d="M 85 55 l 2 5 2 -5 -5 2 5 2 z" />
            <path d="M 200 60 l 1.5 4 1.5 -4 -4 1.5 4 1.5 z" />
            <path d="M 170 40 l 1 3 1 -3 -3 1 3 1 z" />
          </g>
        </>
      )}

      {variant === 'admin' && (
        <>
          <g transform="translate(140, 80)">
            <rect x="-28" y="-8" width="56" height="38" rx="6" fill={`url(#${gradAccent})`} />
            <path d="M -10 -8 L -10 -18 Q -10 -24 -4 -24 L 4 -24 Q 10 -24 10 -18 L 10 -8" stroke="#005f73" strokeWidth="3" fill="none" />
            <rect x="-28" y="4" width="56" height="3" fill="#005f73" opacity="0.3" />
            <circle cx="0" cy="18" r="8" stroke="#e9f6f2" strokeWidth="2" fill="none" opacity="0.7" />
            <circle cx="0" cy="18" r="3" fill="#e9f6f2" opacity="0.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = (angle * Math.PI) / 180
              const x1 = Math.cos(rad) * 7
              const y1 = Math.sin(rad) * 7
              const x2 = Math.cos(rad) * 10
              const y2 = Math.sin(rad) * 10
              return (
                <line
                  key={angle}
                  x1={x1}
                  y1={y1 + 18}
                  x2={x2}
                  y2={y2 + 18}
                  stroke="#e9f6f2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.5"
                />
              )
            })}
          </g>
          <rect x="60" y="120" width="16" height="16" rx="3" fill="#0a9396" opacity="0.2" />
          <rect x="80" y="128" width="12" height="12" rx="2" fill="#0a9396" opacity="0.15" />
          <rect x="190" y="118" width="14" height="14" rx="3" fill="#005f73" opacity="0.15" />
          <g fill="#ee9b00" opacity="0.5">
            <path d="M 90 45 l 2 5 2 -5 -5 2 5 2 z" />
            <path d="M 195 50 l 1.5 4 1.5 -4 -4 1.5 4 1.5 z" />
          </g>
        </>
      )}
    </svg>
  )
}

// ============================================================================
// COMING SOON BADGE — Small inline chip
// ============================================================================

export interface ComingSoonBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md'
  /** Custom label text (for i18n) */
  label?: string
  /** Additional class names */
  className?: string
}

/**
 * Small inline "Coming Soon" badge/chip.
 * Use to annotate individual features or UI elements.
 */
export function ComingSoonBadge({
  size = 'sm',
  label = 'Coming Soon',
  className = '',
}: ComingSoonBadgeProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  }

  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full
        bg-amber-500/10 text-amber-700 dark:text-amber-400
        border border-amber-500/20
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      {label}
    </span>
  )
}

// ============================================================================
// COMING SOON BANNER — Section-level feature announcement
// ============================================================================

export interface ComingSoonBannerProps {
  /** Headline text */
  title: string
  /** Description of what's coming */
  description: string
  /** SVG illustration variant */
  variant?: 'default' | 'security' | 'communication' | 'admin'
  /** Optional list of planned features */
  features?: string[]
  /** Optional action slot (e.g. "Go Back" button) */
  action?: ReactNode
  /** Additional class names */
  className?: string
  /** Whether to use compact layout (no illustration) */
  compact?: boolean
}

/**
 * Prominent "Coming Soon" banner with SVG illustration.
 * Use for tab content areas or full sections that are not yet available.
 */
export function ComingSoonBanner({
  title,
  description,
  variant = 'default',
  features,
  action,
  className = '',
  compact = false,
}: ComingSoonBannerProps) {
  return (
    <div
      className={`
        flex flex-col items-center text-center
        p-8 rounded-2xl
        border border-[rgb(var(--border-primary))]
        bg-[rgb(var(--surface-secondary))]
        ${className}
      `}
    >
      {!compact && (
        <ComingSoonIllustration variant={variant} className="mb-6" />
      )}

      <ComingSoonBadge size="md" className="mb-4" />

      <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[rgb(var(--text-secondary))] max-w-md mb-4 leading-relaxed">
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="w-full max-w-sm space-y-2 mb-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-2 text-sm text-[rgb(var(--text-secondary))] text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ============================================================================
// COMING SOON OVERLAY — Semi-transparent overlay for disabled sections
// ============================================================================

export interface ComingSoonOverlayProps {
  /** The content to overlay */
  children: ReactNode
  /** Label to show on the overlay */
  label?: string
  /** Additional class names */
  className?: string
}

/**
 * Wraps a UI element with a semi-transparent overlay and "Coming Soon" badge.
 * The underlying content is visible but not interactive.
 */
export function ComingSoonOverlay({
  children,
  label = 'Coming Soon',
  className = '',
}: ComingSoonOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none opacity-40 select-none" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          {label}
        </span>
      </div>
    </div>
  )
}
