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
        border: '1px solid rgba(42,157,143,0.1)',
        backgroundColor: 'rgba(16,38,48,0.6)',
      }}
    >
      <div className="relative z-10 p-5 sm:p-6 md:p-8">
        {badge && (
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wider uppercase"
            style={{
              border: '1px solid rgba(42,157,143,0.2)',
              backgroundColor: 'rgba(42,157,143,0.08)',
              color: '#5ec4b6',
            }}
          >
            {badge}
          </div>
        )}
        <h3 className="mb-4 text-balance font-sans text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl" style={{ color: '#e8edf0' }}>
          {title}
        </h3>
        <p className="text-pretty text-base leading-relaxed sm:text-lg" style={{ color: '#8aafbf' }}>
          {description}
        </p>
      </div>
    </div>
  )
}
