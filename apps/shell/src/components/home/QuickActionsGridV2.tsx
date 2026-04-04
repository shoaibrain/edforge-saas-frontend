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
    iconBg: 'var(--v2-accent-enrollment)',
    iconColor: 'var(--v2-brand-primary)',
  },
  {
    id: 'attendance',
    label: 'Attendance',
    description: 'Mark daily attendance',
    icon: ClipboardCheck,
    href: '/academics/classrooms?tab=attendance',
    iconBg: 'var(--v2-accent-academics)',
    iconColor: 'var(--v2-info)',
  },
  {
    id: 'generate-invoice',
    label: 'Generate invoice',
    description: 'Bill enrolled students',
    icon: Receipt,
    href: '/finance/billing/invoices',
    iconBg: 'var(--v2-accent-attendance)',
    iconColor: 'var(--v2-warning)',
  },
  {
    id: 'view-reports',
    label: 'View reports',
    description: 'Analytics & insights',
    icon: Monitor,
    href: '/academics',
    iconBg: 'var(--v2-accent-reports)',
    iconColor: 'var(--v2-accent-purple)',
  },
  {
    id: 'manage-staff',
    label: 'Manage staff',
    description: 'People & HR',
    icon: Users,
    href: '/people/staff',
    iconBg: 'var(--v2-accent-staff)',
    iconColor: 'var(--v2-coral)',
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Configure school',
    icon: Settings,
    href: '/settings',
    iconBg: 'var(--v2-accent-settings)',
    iconColor: 'var(--v2-text-hint)',
  },
]

export function QuickActionsGridV2() {
  return (
    <div
      className="rounded-xl border"
      style={{
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
        padding: 18,
      }}
    >
      {/* Header */}
      <div className="mb-3.5">
        <span
          className="text-[13px] font-medium"
          style={{ color: 'var(--v2-text-secondary)' }}
        >
          Quick actions
        </span>
      </div>

      {/* 2×3 grid */}
      <div className="grid grid-cols-2 gap-[7px]">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.id}
            to={action.href as any}
            className="flex flex-col gap-1.5 rounded-[9px] border p-3 no-underline"
            style={{
              background: 'var(--v2-bg-app)',
              borderColor: 'var(--v2-border-default)',
              transition: 'background var(--v2-transition-fast), border-color var(--v2-transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--v2-bg-surface)'
              e.currentTarget.style.borderColor = 'var(--v2-border-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--v2-bg-app)'
              e.currentTarget.style.borderColor = 'var(--v2-border-default)'
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
              <action.icon className="w-[13px] h-[13px]" style={{ color: action.iconColor }} />
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--v2-text-secondary)' }}
            >
              {action.label}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--v2-text-faint)' }}>
              {action.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
