/**
 * AlertsRow — V2 Alert Bars
 *
 * Critical/warning alerts with horizontal layout, CTA buttons,
 * slide-in stagger animation, and V2 token-based styling.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ClipboardCheck,
  DollarSign,
} from 'lucide-react'
import type { HomeAlert } from '../../hooks/useHomeData'
import { useTranslation } from '@edforge/i18n'

const SEVERITY_CONFIG = {
  critical: {
    bg: 'rgb(var(--state-danger-bg))',
    border: 'rgb(var(--state-danger-border))',
    ctaBorder: 'rgba(226, 75, 74, 0.30)',
    ctaBg: 'rgb(var(--state-danger-bg))',
    titleColor: 'rgb(var(--state-danger-fg))',
    ctaColor: 'rgb(var(--state-danger-fg))',
    icon: AlertTriangle,
    iconBg: 'rgb(var(--state-danger-bg))',
    iconColor: 'rgb(var(--state-danger-fg))',
  },
  warning: {
    bg: 'rgb(var(--state-warning-bg))',
    border: 'rgb(var(--state-warning-border))',
    ctaBorder: 'rgba(239, 159, 39, 0.30)',
    ctaBg: 'rgb(var(--state-warning-bg))',
    titleColor: 'rgb(var(--state-warning-fg))',
    ctaColor: 'rgb(var(--state-warning-fg))',
    icon: AlertTriangle,
    iconBg: 'rgb(var(--state-warning-bg))',
    iconColor: 'rgb(var(--state-warning-fg))',
  },
}

const MODULE_ICONS = {
  academics: ClipboardCheck,
  finance: DollarSign,
}

interface AlertsRowProps {
  alerts: HomeAlert[]
  loading?: boolean
}

function AlertSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-[10px] border"
      style={{
        padding: '11px 14px',
        background: 'rgb(var(--background-secondary))',
        borderColor: 'rgb(var(--border-primary) / 0.35)',
      }}
    >
      <div
        className="w-7 h-7 rounded-[7px] flex-shrink-0 v2-skeleton-pulse"
        style={{ background: 'rgb(var(--background-tertiary))' }}
      />
      <div className="flex-1 space-y-1.5">
        <div
          className="h-3.5 w-64 rounded v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
        <div
          className="h-3 w-44 rounded v2-skeleton-pulse"
          style={{ background: 'rgb(var(--background-tertiary))' }}
        />
      </div>
      <div
        className="h-6 w-20 rounded-md flex-shrink-0 v2-skeleton-pulse"
        style={{ background: 'rgb(var(--background-tertiary))' }}
      />
    </div>
  )
}

export function AlertsRow({ alerts, loading }: AlertsRowProps) {
  const { t } = useTranslation('dashboard')
  if (loading) {
    return (
      <div className="flex flex-col gap-1.5">
        <AlertSkeleton />
        <AlertSkeleton />
      </div>
    )
  }

  return (
    <AnimatePresence mode="sync">
      {alerts.length > 0 && (
        <motion.ul
          role="list"
          aria-label="Alerts"
          className="flex flex-col gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
        >
          {alerts.map((alert, index) => {
            const config = SEVERITY_CONFIG[alert.severity]
            const ModuleIcon = MODULE_ICONS[alert.module]

            return (
              <motion.li
                key={alert.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
              >
                <div
                  className="flex items-center gap-3 rounded-[10px] border"
                  style={{
                    padding: '11px 14px',
                    background: config.bg,
                    borderColor: config.border,
                  }}
                  role="alert"
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: config.iconBg,
                    }}
                  >
                    <ModuleIcon className="w-3.5 h-3.5" style={{ color: config.iconColor }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: config.titleColor }}
                    >
                      {alert.title}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: 'rgb(var(--text-disabled))' }}
                    >
                      {alert.description}
                    </p>
                  </div>

                  {/* CTA button */}
                  <Link
                    to={alert.href as any}
                    className="text-xs font-medium px-2.5 py-1 rounded-md border whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-80"
                    style={{
                      color: config.ctaColor,
                      borderColor: config.ctaBorder,
                      background: config.ctaBg,
                    }}
                  >
                    {alert.module === 'finance' ? t('homeV2.alerts.reviewBilling') : t('homeV2.alerts.viewStudents')}
                  </Link>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </AnimatePresence>
  )
}
