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
    bg: 'var(--v2-danger-bg)',
    border: 'var(--v2-danger-border)',
    ctaBorder: 'rgba(226, 75, 74, 0.30)',
    ctaBg: 'var(--v2-danger-bg)',
    titleColor: 'var(--v2-danger)',
    ctaColor: 'var(--v2-danger)',
    icon: AlertTriangle,
    iconBg: 'var(--v2-danger-bg)',
    iconColor: 'var(--v2-danger)',
  },
  warning: {
    bg: 'var(--v2-warning-bg)',
    border: 'var(--v2-warning-border)',
    ctaBorder: 'rgba(239, 159, 39, 0.30)',
    ctaBg: 'var(--v2-warning-bg)',
    titleColor: 'var(--v2-warning)',
    ctaColor: 'var(--v2-warning)',
    icon: AlertTriangle,
    iconBg: 'var(--v2-warning-bg)',
    iconColor: 'var(--v2-warning)',
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
        background: 'var(--v2-bg-surface)',
        borderColor: 'var(--v2-border-default)',
      }}
    >
      <div
        className="w-7 h-7 rounded-[7px] flex-shrink-0 v2-skeleton-pulse"
        style={{ background: 'var(--v2-bg-elevated)' }}
      />
      <div className="flex-1 space-y-1.5">
        <div
          className="h-3.5 w-64 rounded v2-skeleton-pulse"
          style={{ background: 'var(--v2-bg-elevated)' }}
        />
        <div
          className="h-3 w-44 rounded v2-skeleton-pulse"
          style={{ background: 'var(--v2-bg-elevated)' }}
        />
      </div>
      <div
        className="h-6 w-20 rounded-md flex-shrink-0 v2-skeleton-pulse"
        style={{ background: 'var(--v2-bg-elevated)' }}
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
                      style={{ color: 'var(--v2-text-faint)' }}
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
