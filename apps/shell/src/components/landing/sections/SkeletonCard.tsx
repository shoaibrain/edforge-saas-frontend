interface SkeletonCardProps {
  badge?: string
  title: string
  description: string
  className?: string
}

export function SkeletonCard({ badge, title, description, className = '' }: SkeletonCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl backdrop-blur-sm transition-all duration-500 ${className}`}
      style={{
        border: '1px solid rgba(var(--brand-primary),0.1)',
        backgroundColor: 'rgba(var(--surface-secondary),0.6)',
      }}
    >
      <div className="relative z-10" style={{ padding: 'var(--lp-card-padding-lg)' }}>
        {badge && (
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 tracking-wider uppercase"
            style={{
              fontSize: 'var(--lp-font-label)',
              fontWeight: 'var(--lp-weight-label)',
              border: '1px solid rgba(var(--brand-primary),0.2)',
              backgroundColor: 'rgba(var(--brand-primary),0.08)',
              color: 'var(--lp-chart-secondary)',
            }}
          >
            {badge}
          </div>
        )}
        <h3
          className="mb-4 text-balance font-sans tracking-tight"
          style={{ fontSize: 'var(--lp-font-feature-title)', fontWeight: 'var(--lp-weight-heading)', color: 'rgb(var(--text-primary))' }}
        >
          {title}
        </h3>
        <p
          className="text-pretty leading-relaxed"
          style={{ fontSize: 'var(--lp-font-body)', fontWeight: 'var(--lp-weight-body)', lineHeight: '1.6', color: 'rgb(var(--text-secondary))' }}
        >
          {description}
        </p>
      </div>
    </div>
  )
}
