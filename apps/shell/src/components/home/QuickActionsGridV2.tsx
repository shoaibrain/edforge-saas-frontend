/**
 * QuickActionsGridV2
 *
 * 2×3 grid of quick action cards for the home page bottom row.
 * Each card has a module-colored icon, label, and description.
 */

import { Link } from '@tanstack/react-router'
import {
  Users,
  ClipboardCheck,
  Receipt,
  Monitor,
  Settings,
  UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  description: string
  icon: LucideIcon
  href: string
  iconBg: string
  iconColor: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'add-student',
    label: 'Add student',
    description: 'Enroll a new student',
    icon: UserPlus,
    href: '/academics/students',
    iconBg: 'rgb(var(--accent-enrollment) / 0.12)',
    iconColor: '#1D9E75',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    icon: ClipboardCheck,
    href: '/academics/classrooms?tab=attendance',
    iconBg: 'rgb(var(--accent-academics) / 0.12)',
    iconColor: 'rgb(var(--state-info-fg))',
  },
  {
    id: 'generate-invoice',
    label: 'Generate invoice',
    description: 'Bill enrolled students',
    icon: Receipt,
    href: '/finance/billing/invoices',
    iconBg: 'rgb(var(--accent-attendance) / 0.12)',
    iconColor: 'rgb(var(--state-warning-fg))',
  },
  {
    id: 'view-reports',
    label: 'View reports',
    description: 'Analytics & insights',
    icon: Monitor,
    href: '/academics',
    iconBg: 'rgb(var(--accent-reports) / 0.12)',
    iconColor: '#7F77DD',
  },
  {
    id: 'manage-staff',
    label: 'Manage staff',
    description: 'People & HR',
    icon: Users,
    href: '/people/staff',
    iconBg: 'rgb(var(--accent-coral) / 0.10)',
    iconColor: 'rgb(var(--accent-coral))',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure school',
    icon: Settings,
    href: '/settings',
    iconBg: 'rgb(var(--accent-settings) / 0.15)',
    iconColor: 'rgb(var(--text-tertiary))',
  },
]

export function QuickActionsGridV2() {
  return (
    <div
      className="rounded-xl border"
      style={{
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="mb-3.5">
        <span
          className="text-sm font-medium"
          style={{ color: 'rgb(var(--text-secondary))' }}
        >
          Quick actions
        </span>
      </div>

      {/* 2×3 grid */}
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.id}
            to={action.href as any}
            className="flex flex-col gap-1.5 rounded-[9px] border p-3 no-underline"
            style={{
              background: 'rgb(var(--background-primary))',
              borderColor: 'rgb(var(--border-primary) / 0.35)',
              transition: 'background 150ms ease, border-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgb(var(--background-secondary))'
              e.currentTarget.style.borderColor = 'rgb(var(--border-primary) / 0.5)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgb(var(--background-primary))'
              e.currentTarget.style.borderColor = 'rgb(var(--border-primary) / 0.35)'
            }}
          >
            <div
              className="flex items-center justify-center mb-0.5"
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: action.iconBg,
              }}
            >
              <action.icon className="w-3.5 h-3.5" style={{ color: action.iconColor }} />
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: 'rgb(var(--text-secondary))' }}
            >
              {action.label}
            </span>
            <span className="text-xs" style={{ color: 'rgb(var(--text-disabled))' }}>
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
