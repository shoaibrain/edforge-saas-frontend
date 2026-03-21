/**
 * HR Administration Module
 *
 * Full HR functionality (payroll, professional development, performance reviews)
 * is not available in the initial production release. Staff and user management
 * remain accessible through the People module's Staff section.
 */

import { BriefcaseBusiness, Users } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export function HRAdminModule() {
  const navigate = useNavigate()

  return (
    <div data-v2 className="p-6 space-y-5">
      {/* V2 Page Header */}
      <div className="flex items-center justify-between" style={{ minHeight: 44 }}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-[7px] flex items-center justify-center"
              style={{ background: 'rgba(216, 90, 48, 0.10)' }}
            >
              <BriefcaseBusiness className="w-4 h-4" style={{ color: '#D85A30' }} />
            </div>
            <h1
              className="text-[14px] font-semibold"
              style={{ color: 'var(--v2-text-primary)' }}
            >
              HR Admin
            </h1>
          </div>
          <p className="text-[11px]" style={{ color: 'var(--v2-text-hint)' }}>
            Compensation, professional development, and performance management
          </p>
        </div>
      </div>

      {/* Context line */}
      <p className="text-[12px]" style={{ color: 'var(--v2-text-muted)' }}>
        HR administration tools are in development. Staff records are managed in{' '}
        <button
          type="button"
          onClick={() => navigate({ to: '/staff' as string })}
          className="underline hover:opacity-80 transition-opacity"
          style={{ color: 'var(--v2-info)' }}
        >
          Staff Directory
        </button>.
      </p>

      {/* V2 Purposeful Empty State */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          textAlign: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            background: 'rgba(216, 90, 48, 0.08)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}
        >
          <BriefcaseBusiness
            className="w-6 h-6"
            style={{ color: 'var(--v2-text-hint)' }}
          />
        </div>

        <h3
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--v2-text-secondary)',
            letterSpacing: '-0.2px',
          }}
        >
          HR Administration coming soon
        </h3>

        <p
          style={{
            fontSize: '12px',
            color: 'var(--v2-text-hint)',
            maxWidth: '340px',
            lineHeight: '1.6',
          }}
        >
          Payroll, performance reviews, and contract management are in development.
          For now, manage staff records and access from Staff Directory.
        </p>

        <button
          type="button"
          onClick={() => navigate({ to: '/staff' as string })}
          className="transition-colors hover:opacity-80"
          style={{
            marginTop: '8px',
            height: '34px',
            background: 'rgba(216, 90, 48, 0.10)',
            border: '1px solid rgba(216, 90, 48, 0.20)',
            borderRadius: '8px',
            padding: '0 16px',
            fontSize: '12px',
            fontWeight: 500,
            color: '#D85A30',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <Users className="w-3 h-3" />
          Go to Staff Directory
        </button>
      </div>
    </div>
  )
}

export default HRAdminModule
