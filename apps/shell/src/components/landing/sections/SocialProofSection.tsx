import { Shield, Link2, Brain, Zap, Lock } from 'lucide-react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'

const capabilities = [
  { icon: Shield, label: 'FERPA Compliant' },
  { icon: Link2, label: 'Interoperable' },
  { icon: Brain, label: 'Intelligent' },
  { icon: Zap, label: 'Real-time' },
  { icon: Lock, label: 'Zero-trust' },
]

const EASE_OUT_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)'

export function SocialProofSection() {
  const [ref, isInView] = useInView('100px')
  const prefersReducedMotion = useReducedMotion()
  const show = prefersReducedMotion || isInView

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden"
      style={{
        height: 'clamp(8rem, 12vw, 12rem)',
        background: 'rgb(var(--surface-primary))',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '600px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(226,232,240,0.4), transparent)',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          maxWidth: '600px',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(226,232,240,0.4), transparent)',
        }}
      />

      <div
        className="flex h-full items-center justify-center gap-8 sm:gap-12 md:gap-16 px-6 overflow-x-auto scrollbar-hide"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(12px)',
          transition: prefersReducedMotion ? 'none' : `opacity 0.8s ${EASE_OUT_EXPO} 0.1s, transform 0.8s ${EASE_OUT_EXPO} 0.1s`,
        }}
      >
        {capabilities.map((cap, i) => {
          const Icon = cap.icon
          return (
            <div
              key={cap.label}
              className="flex shrink-0 items-center gap-2"
              style={{
                opacity: show ? 1 : 0,
                transform: show ? 'translateY(0)' : 'translateY(8px)',
                transition: prefersReducedMotion ? 'none' : `opacity 0.6s ${EASE_OUT_EXPO} ${0.15 + i * 0.08}s, transform 0.6s ${EASE_OUT_EXPO} ${0.15 + i * 0.08}s`,
              }}
            >
              <Icon
                size={20}
                style={{ color: 'rgb(var(--text-secondary))', opacity: 0.6 }}
                aria-hidden="true"
              />
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgb(var(--text-tertiary))',
                }}
              >
                {cap.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
