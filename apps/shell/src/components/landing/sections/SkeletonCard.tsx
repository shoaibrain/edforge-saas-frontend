import type React from 'react'

interface SkeletonCardProps {
  badge?: string
  title: string
  description: string
  className?: string
  icon?: React.ElementType
  accentColor?: string
  accentBg?: string
}

export function SkeletonCard({ badge, title, description, className = '', icon: Icon, accentColor, accentBg }: SkeletonCardProps) {
  const pillBg = accentBg || 'rgba(249, 115, 22, 0.06)'
  const pillColor = accentColor || '#EA580C'
  const pillBorder = accentColor ? `1px solid ${accentColor}25` : '1px solid rgba(249, 115, 22, 0.15)'

  return (
    <div
      className={`lp-card-shimmer lp-dashboard-card backdrop-blur-sm ${className}`}
      style={{
        border: '1px solid rgba(226, 232, 240, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 'var(--lp-radius-lg)',
        boxShadow: 'var(--lp-shadow-card)',
      }}
    >
      {accentColor && (
        <div
          style={{
            height: '3px',
            borderRadius: 'var(--lp-radius-lg) var(--lp-radius-lg) 0 0',
            background: `linear-gradient(90deg, ${accentColor}20, ${accentColor}40, ${accentColor}20)`,
          }}
        />
      )}
      <div className="relative z-10" style={{ padding: 'var(--lp-card-padding-lg)' }}>
        {badge && (
          <div
            className="mb-4 inline-flex items-center gap-2 tracking-wider uppercase"
            style={{
              fontSize: 'var(--lp-font-label)',
              fontWeight: 'var(--lp-weight-label)',
              borderRadius: 'var(--lp-radius-pill)',
              padding: '0.25rem 0.75rem',
              backgroundColor: pillBg,
              color: pillColor,
              border: pillBorder,
            }}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {badge}
          </div>
        )}
        <h3
          className="lp-feature-title mb-4 text-balance tracking-tight"
          style={{ fontFamily: 'var(--lp-font-subheading)', fontSize: 'var(--lp-font-feature-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
        >
          {title}
        </h3>
        <p
          className="text-pretty leading-relaxed"
          style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', lineHeight: 'var(--lp-line-height-body)', color: 'rgb(var(--text-secondary))' }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
