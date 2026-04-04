/**
 * HR Administration Module — V2
 *
 * Purposeful empty state with feature preview, notification toast,
 * and redirect to Staff Directory. Matches HR Admin V2 prototype exactly.
 */

import { useState } from 'react'
import { Briefcase, Bell, Check, DollarSign, FileText, BookOpen, ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export function HRAdminModule() {
  const navigate = useNavigate()
  const [notified, setNotified] = useState(false)

  const handleNotify = () => {
    setNotified(true)
    toast.success("You'll be notified when HR features are available.")
  }

  return (
    <div data-v2 style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      {/* PAGE HEADER */}
      <div style={{ padding: '24px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: 'rgba(127,119,221,0.10)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Briefcase style={{ width: 16, height: 16, color: '#7F77DD' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h1
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: '-0.3px',
                    color: 'var(--v2-text-primary, #e8eaf0)',
                    margin: 0,
                  }}
                >
                  HR Administration
                </h1>
                <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.10)', alignSelf: 'center' }} />
                <span style={{ fontSize: 12, color: 'var(--v2-text-muted, #7a8099)' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONTEXT BANNER */}
      <p style={{ fontSize: 11, color: 'var(--v2-text-muted, #7a8099)', padding: '0 28px 24px', margin: 0 }}>
        Full HR capabilities — <em style={{ fontStyle: 'normal', fontWeight: 500, color: '#7F77DD' }}>payroll, reviews, contracts</em> — are planned for EdForge v2.0.
      </p>

      {/* DIVIDER */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 28px' }} />

      {/* MAIN EMPTY STATE */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 28px',
        }}
      >
        <div style={{ maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          {/* ICON with version badge */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                background: 'rgba(127,119,221,0.12)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(127,119,221,0.15)',
              }}
            >
              <Briefcase style={{ width: 28, height: 28, color: '#7F77DD', strokeWidth: 1.5 }} />
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: -8,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                fontSize: 9,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 10,
                background: 'rgba(239,159,39,0.15)',
                border: '1px solid rgba(239,159,39,0.25)',
                color: '#EF9F27',
                whiteSpace: 'nowrap',
              }}
            >
              <Check style={{ width: 7, height: 7 }} />
              v2.0
            </span>
          </div>

          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--v2-text-primary, #e8eaf0)',
              marginBottom: 10,
              letterSpacing: '-0.2px',
            }}
          >
            HR administration is coming in EdForge v2.0
          </h2>

          <p
            style={{
              fontSize: 12,
              color: 'var(--v2-text-muted, #7a8099)',
              lineHeight: 1.7,
              maxWidth: 360,
              marginBottom: 20,
            }}
          >
            Full HR capabilities are being built for the next major release. In the meantime, you can{' '}
            <strong style={{ color: 'var(--v2-text-secondary, #c8ccd8)', fontWeight: 500 }}>
              manage staff profiles, roles, and system access
            </strong>{' '}
            from the Staff Directory.
          </p>

          {/* NOTIFY BUTTON */}
          <button
            type="button"
            onClick={notified ? undefined : handleNotify}
            style={{
              height: 34,
              background: notified ? 'rgba(29,158,117,0.08)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${notified ? 'rgba(29,158,117,0.20)' : 'rgba(255,255,255,0.09)'}`,
              borderRadius: 7,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 500,
              color: notified ? '#1D9E75' : '#9aa0b8',
              cursor: notified ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.12s',
            }}
          >
            {notified ? (
              <>
                <Check style={{ width: 13, height: 13 }} />
                Notification set
              </>
            ) : (
              <>
                <Bell style={{ width: 13, height: 13 }} />
                Notify me when available
              </>
            )}
          </button>

          {/* FEATURE PREVIEW */}
          <div style={{ width: '100%', maxWidth: 680, margin: '0 auto' }}>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '28px 0 20px' }} />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--v2-text-ghost, #2a3045)',
                textAlign: 'center',
                marginBottom: 14,
              }}
            >
              What's included in v2.0
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <FeatureCard
                icon={<DollarSign style={{ width: 13, height: 13, color: '#1D9E75', strokeWidth: 2 }} />}
                iconBg="rgba(29,158,117,0.10)"
                title="Payroll & Contracts"
                description="Manage compensation, salary, and employment contracts in one place."
              />
              <FeatureCard
                icon={<FileText style={{ width: 13, height: 13, color: '#378ADD', strokeWidth: 2 }} />}
                iconBg="rgba(55,138,221,0.10)"
                title="Performance Reviews"
                description="Structured review cycles, goal tracking, and performance history."
              />
              <FeatureCard
                icon={<BookOpen style={{ width: 13, height: 13, color: '#7F77DD', strokeWidth: 2 }} />}
                iconBg="rgba(127,119,221,0.10)"
                title="Professional Dev"
                description="Certifications, training logs, and professional development tracking."
              />
            </div>

            {/* REDIRECT SECTION */}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '28px 0 20px' }} />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--v2-text-secondary, #c8ccd8)',
                  marginBottom: 6,
                }}
              >
                What you can do right now
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--v2-text-muted, #7a8099)',
                  marginBottom: 10,
                }}
              >
                View staff profiles, assign roles, and manage system access.
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: '/staff' as string })}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#D85A30',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Go to Staff Directory
                <ChevronRight style={{ width: 11, height: 11 }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// FEATURE CARD
// ============================================================================

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
}) {
  return (
    <div
      style={{
        background: 'var(--v2-bg-surface, #161b27)',
        border: '1px solid var(--v2-border-default, rgba(255,255,255,0.06))',
        borderRadius: 10,
        padding: 14,
        opacity: 0.7,
        transition: 'opacity 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--v2-text-primary, #e8eaf0)' }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 10, color: 'var(--v2-text-muted, #7a8099)', lineHeight: 1.6, marginBottom: 8 }}>
        {description}
      </div>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontSize: 9,
          fontWeight: 500,
          padding: '2px 6px',
          borderRadius: 4,
          background: 'rgba(127,119,221,0.10)',
          color: '#7F77DD',
        }}
      >
        Planned
      </span>
    </div>
  )
}

export default HRAdminModule
