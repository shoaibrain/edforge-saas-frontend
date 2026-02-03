/**
 * Settings Shared Components
 * 
 * Reusable components for the Settings module with fluid animations
 * and consistent styling across all settings pages.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, 
  Check, 
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  type LucideIcon 
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { cn } from '@/lib/utils'

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const springTransition = { type: 'spring', stiffness: 300, damping: 25 }

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
}

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: springTransition,
  },
}

// ============================================================================
// SETTINGS PAGE HEADER
// ============================================================================

export interface SettingsPageHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}

export function SettingsPageHeader({ 
  title, 
  description, 
  icon: Icon,
  action,
  className 
}: SettingsPageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className={cn('flex items-center justify-between', className)}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20">
            <Icon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">{title}</h1>
          {description && (
            <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">{description}</p>
          )}
        </div>
      </div>
      {action}
    </motion.div>
  )
}

// ============================================================================
// SETTINGS SECTION (Collapsible)
// ============================================================================

export interface SettingsSectionProps {
  title: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  className?: string
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = true,
  collapsible = false,
  className,
}: SettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        'rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] overflow-hidden',
        className
      )}
    >
      {/* Section Header */}
      <div
        className={cn(
          'flex items-center gap-3 p-4',
          collapsible && 'cursor-pointer hover:bg-[rgb(var(--surface-tertiary))] transition-colors'
        )}
        onClick={() => collapsible && setIsOpen(!isOpen)}
      >
        {Icon && (
          <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <Icon className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h2>
          {description && (
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{description}</p>
          )}
        </div>
        {collapsible && (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={springTransition}
          >
            <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
        )}
      </div>

      {/* Section Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================================================
// SETTINGS CARD
// ============================================================================

export interface SettingsCardProps {
  title: string
  description: string
  children: ReactNode
  className?: string
}

export function SettingsCard({ 
  title, 
  description, 
  children,
  className 
}: SettingsCardProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl',
      'bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]',
      className
    )}>
      <div>
        <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
        <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// SETTINGS FORM CARD
// ============================================================================

export interface SettingsFormCardProps {
  title?: string
  description?: string
  icon?: LucideIcon
  children: ReactNode
  className?: string
}

export function SettingsFormCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: SettingsFormCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      className={cn(
        'p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]',
        className
      )}
    >
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />}
          {title && (
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">{title}</h3>
          )}
        </div>
      )}
      {description && (
        <p className="text-sm text-[rgb(var(--text-tertiary))] mb-4">{description}</p>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </motion.div>
  )
}

// ============================================================================
// SETTINGS ROW
// ============================================================================

export interface SettingsRowProps {
  icon: LucideIcon
  title: string
  description: string
  action: ReactNode
  className?: string
}

export function SettingsRow({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}: SettingsRowProps) {
  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl',
      'bg-[rgb(var(--surface-secondary))] border border-[rgb(var(--border-primary))]',
      'hover:border-[rgb(var(--border-secondary))] transition-colors',
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
          <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
        </div>
        <div>
          <p className="font-medium text-[rgb(var(--text-primary))]">{title}</p>
          <p className="text-sm text-[rgb(var(--text-tertiary))]">{description}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

// ============================================================================
// SETTINGS TOGGLE ROW
// ============================================================================

export interface SettingsToggleRowProps {
  icon?: LucideIcon
  title: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function SettingsToggleRow({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
  disabled = false,
  loading = false,
  className,
}: SettingsToggleRowProps) {
  const handleToggle = useCallback(() => {
    if (!disabled && !loading) {
      onChange(!checked)
    }
  }, [disabled, loading, checked, onChange])

  return (
    <div 
      className={cn(
        'flex items-center justify-between py-3 px-1',
        'border-b border-[rgb(var(--border-primary))] last:border-0',
        disabled && 'opacity-50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-1.5 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{title}</p>
          {description && (
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">{description}</p>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || loading}
        onClick={handleToggle}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
          'transition-colors duration-200 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          checked ? 'bg-teal-500' : 'bg-[rgb(var(--surface-tertiary))]'
        )}
      >
        <motion.span
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full shadow-lg ring-0',
            'bg-white'
          )}
        >
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-3 h-3 border-2 border-teal-500/30 border-t-teal-500 rounded-full" />
            </motion.div>
          )}
        </motion.span>
      </button>
    </div>
  )
}

// ============================================================================
// SETTINGS ALERT
// ============================================================================

export type AlertType = 'success' | 'error' | 'warning' | 'info'

export interface SettingsAlertProps {
  type: AlertType
  message: string
  onDismiss?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  className?: string
}

const alertConfig: Record<AlertType, { icon: LucideIcon; bg: string; border: string; text: string }> = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
  },
}

export function SettingsAlert({
  type,
  message,
  onDismiss,
  autoDismiss = false,
  autoDismissDelay = 5000,
  className,
}: SettingsAlertProps) {
  const { icon: Icon, bg, border, text } = alertConfig[type]

  useEffect(() => {
    if (autoDismiss && onDismiss) {
      const timer = setTimeout(onDismiss, autoDismissDelay)
      return () => clearTimeout(timer)
    }
  }, [autoDismiss, autoDismissDelay, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={springTransition}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border',
        bg, border, text,
        className
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-sm flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// ============================================================================
// SAVE BUTTON
// ============================================================================

export interface SaveButtonProps {
  isDirty: boolean
  isSaving: boolean
  saveSuccess: boolean
  className?: string
}

export function SaveButton({ isDirty, isSaving, saveSuccess, className }: SaveButtonProps) {
  return (
    <Button 
      type="submit" 
      disabled={!isDirty || isSaving} 
      className={cn('min-w-[110px]', className)}
    >
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.div 
            key="saving" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex items-center gap-2"
          >
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} 
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" 
            />
            Saving...
          </motion.div>
        ) : saveSuccess ? (
          <motion.div 
            key="success" 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Saved!
          </motion.div>
        ) : (
          <motion.div 
            key="default" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  )
}

// ============================================================================
// QUICK ACTION PILL
// ============================================================================

export interface QuickActionProps {
  label: string
  icon: LucideIcon
  href: string
  delay?: number
}

export function QuickActionPill({ label, icon: Icon, href, delay = 0 }: QuickActionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.05, duration: 0.3 }}
    >
      <Link to={href}>
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full',
            'border border-[rgb(var(--border-primary))]',
            'bg-[rgb(var(--surface-secondary))]',
            'hover:bg-[rgb(var(--surface-tertiary))] hover:border-teal-500/30',
            'transition-colors cursor-pointer'
          )}
        >
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <Icon className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">{label}</span>
        </motion.div>
      </Link>
    </motion.div>
  )
}

// ============================================================================
// SETTINGS SKELETON
// ============================================================================

export interface SettingsSkeletonProps {
  rows?: number
  showHeader?: boolean
  className?: string
}

export function SettingsSkeleton({ 
  rows = 4, 
  showHeader = true,
  className 
}: SettingsSkeletonProps) {
  return (
    <div className={cn('space-y-6 animate-pulse', className)}>
      {/* Header Skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-40 bg-[rgb(var(--surface-tertiary))] rounded" />
            <div className="h-4 w-56 bg-[rgb(var(--surface-tertiary))] rounded mt-2" />
          </div>
          <div className="h-10 w-24 bg-[rgb(var(--surface-tertiary))] rounded" />
        </div>
      )}

      {/* Content Skeleton */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div 
            key={i} 
            className="p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(var(--surface-tertiary))] rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-[rgb(var(--surface-tertiary))] rounded" />
                <div className="h-3 w-48 bg-[rgb(var(--surface-tertiary))] rounded" />
              </div>
              <div className="h-6 w-11 bg-[rgb(var(--surface-tertiary))] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// SETTINGS DIVIDER
// ============================================================================

export function SettingsDivider({ className }: { className?: string }) {
  return (
    <div className={cn('border-t border-[rgb(var(--border-primary))]', className)} />
  )
}

// ============================================================================
// SETTINGS EMPTY STATE
// ============================================================================

export interface SettingsEmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SettingsEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: SettingsEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('text-center py-12', className)}
    >
      <div className="inline-flex p-4 rounded-full bg-[rgb(var(--surface-tertiary))] mb-4">
        <Icon className="w-8 h-8 text-[rgb(var(--text-tertiary))]" />
      </div>
      <h3 className="text-lg font-medium text-[rgb(var(--text-primary))] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}

// ============================================================================
// EXPORT ANIMATION VARIANTS
// ============================================================================

export { staggerChildren, fadeInUp, springTransition }
