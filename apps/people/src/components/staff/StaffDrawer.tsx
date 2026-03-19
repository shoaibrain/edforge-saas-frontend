/**
 * StaffDrawer Component
 *
 * Quick-info slide-over drawer for staff records:
 * - DiceBear avatar + full name + staff ID
 * - Three-dot dropdown: View Full Profile, Edit, Delete
 * - Employment, contact, assignments in card sections
 * - "View Full Profile" CTA at bottom
 *
 * Follows the StudentDrawer pattern from the academics app.
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  BookOpen,
  Clock,
  ArrowRight,
  Key,
  School,
  Building2,
} from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import type { StaffResponseDto } from '@aibrains/shared-types'
import { StaffStatusBadge } from './StaffStatusBadge'
import { getRoleI18nKey } from './StaffRoleBadge'
import { getStaffAvatar } from '../../lib/avatar'
import { formatDate, formatEmploymentType } from '../../lib/utils'

// ============================================================================
// TYPES
// ============================================================================

interface StaffDrawerProps {
  open: boolean
  onClose: () => void
  staff: StaffResponseDto | null
  onEdit?: (staff: StaffResponseDto) => void
  onDelete?: (staff: StaffResponseDto) => void
}

// ============================================================================
// ACTIONS DROPDOWN
// ============================================================================

function ActionsDropdown({
  staff,
  onClose,
  onEdit,
  onDelete,
}: {
  staff: StaffResponseDto
  onClose: () => void
  onEdit?: (staff: StaffResponseDto) => void
  onDelete?: (staff: StaffResponseDto) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation('people')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors"
        aria-label="Actions"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-48 rounded-xl bg-surface-primary border border-border-primary shadow-xl py-1.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onClose()
                navigate({ to: '/staff/$staffId', params: { staffId: staff.staffId } })
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <Eye className="w-4 h-4" />
              {t('drawer.viewFullProfile')}
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onEdit(staff)
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
              >
                <Pencil className="w-4 h-4" />
                {t('drawer.editStaff')}
              </button>
            )}
            {onDelete && (
              <>
                <div className="border-t border-border-secondary mx-3 my-1.5" />
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    onDelete(staff)
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('drawer.deleteStaff')}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================================
// SECTION CARD
// ============================================================================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof User
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border-secondary bg-surface-secondary/50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border-secondary bg-surface-secondary/80">
        <Icon className="w-3.5 h-3.5 text-text-tertiary" />
        <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className="px-4 py-3.5">{children}</div>
    </div>
  )
}

// ============================================================================
// DETAIL FIELD
// ============================================================================

function DetailField({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: React.ReactNode
  icon?: typeof User
  accent?: string
}) {
  return (
    <div className="py-1">
      <dt className="text-[11px] font-medium text-text-tertiary uppercase tracking-wide mb-1 flex items-center gap-1.5">
        {Icon && <Icon className={`w-3 h-3 ${accent ?? 'text-text-tertiary'}`} />}
        {label}
      </dt>
      <dd className="text-sm font-medium text-text-primary">
        {value || <span className="text-text-tertiary">—</span>}
      </dd>
    </div>
  )
}

// ============================================================================
// STAFF DRAWER
// ============================================================================

export function StaffDrawer({
  open,
  onClose,
  staff,
  onEdit,
  onDelete,
}: StaffDrawerProps) {
  const { t } = useTranslation('people')
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleViewFullProfile = () => {
    if (!staff) return
    onClose()
    navigate({ to: '/staff/$staffId', params: { staffId: staff.staffId } })
  }

  const addressStr = staff?.addresses?.[0]
    ? [
        staff.addresses[0].streetNumberName,
        staff.addresses[0].city,
        staff.addresses[0].stateAbbreviationDescriptor,
        staff.addresses[0].postalCode,
      ]
        .filter(Boolean)
        .join(', ')
    : null

  return (
    <AnimatePresence>
      {open && staff && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-screen max-w-2xl h-full"
            >
              <div className="flex h-full flex-col bg-surface-primary shadow-xl border-l border-border-secondary">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border-secondary">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-text-primary">
                      {t('drawer.title')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ActionsDropdown
                      staff={staff}
                      onClose={onClose}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                  {/* Hero identity section */}
                  <div className="px-6 py-5 bg-surface-secondary/40 border-b border-border-secondary">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-surface-tertiary shadow-md ring-1 ring-white/10">
                        <img
                          src={getStaffAvatar(staff.staffId, { size: 80 })}
                          alt={`${staff.firstName} ${staff.lastSurname}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-text-primary truncate">
                          {staff.firstName} {staff.lastSurname}
                        </h3>
                        <p className="text-xs text-text-tertiary mt-0.5 truncate">
                          {staff.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="font-mono text-[11px] text-text-secondary bg-surface-tertiary px-2 py-0.5 rounded-md border border-border-secondary truncate max-w-[200px]">
                            #{staff.staffUniqueId}
                          </span>
                          <StaffStatusBadge status={staff.employmentStatus} />
                        </div>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mt-5">
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <Briefcase className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-text-primary truncate">
                          {t(`roles.${getRoleI18nKey(staff.role)}`, { defaultValue: staff.role })}
                        </p>
                        <p className="text-[11px] text-text-tertiary">{t('tableHeaders.role')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <BookOpen className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-text-primary truncate">
                          {staff.departmentName || '—'}
                        </p>
                        <p className="text-[11px] text-text-tertiary">{t('tableHeaders.department')}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-surface-primary border border-border-secondary text-center">
                        <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-sm font-bold text-text-primary truncate">
                          {formatEmploymentType(staff.employmentType)}
                        </p>
                        <p className="text-[11px] text-text-tertiary">{t('drawer.type')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section cards */}
                  <div className="px-6 py-5 space-y-4">
                    {/* Employment Info */}
                    <SectionCard icon={Briefcase} title={t('sections.employmentInfo')}>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <DetailField
                          icon={Calendar}
                          label={t('fields.hireDate')}
                          value={formatDate(staff.hireDate)}
                        />
                        <DetailField
                          icon={Clock}
                          label={t('fields.employmentType')}
                          value={formatEmploymentType(staff.employmentType)}
                        />
                        {staff.title && (
                          <DetailField
                            icon={Briefcase}
                            label={t('fields.title')}
                            accent="text-indigo-500"
                            value={staff.title}
                          />
                        )}
                        {staff.primarySchoolName && (
                          <DetailField
                            icon={School}
                            label={t('fields.primarySchool')}
                            value={staff.primarySchoolName}
                          />
                        )}
                      </div>
                    </SectionCard>

                    {/* Contact Information */}
                    <SectionCard icon={Mail} title={t('sections.contactInfo')}>
                      <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                        <DetailField
                          icon={Mail}
                          label={t('fields.email')}
                          accent="text-blue-500"
                          value={staff.email}
                        />
                        <DetailField
                          icon={Phone}
                          label={t('fields.phone')}
                          accent="text-green-500"
                          value={staff.phone}
                        />
                      </div>
                      {addressStr && (
                        <div className="mt-3 pt-3 border-t border-border-secondary">
                          <DetailField
                            icon={MapPin}
                            label={t('fields.address')}
                            value={addressStr}
                          />
                        </div>
                      )}
                    </SectionCard>

                    {/* School Assignments */}
                    {staff.schoolAssignments && staff.schoolAssignments.length > 0 && (
                      <SectionCard icon={Building2} title={t('sections.schoolAssignments')}>
                        <div className="space-y-3">
                          {staff.schoolAssignments.map((assignment, i) => (
                            <div
                              key={i}
                              className="p-4 bg-surface-primary rounded-xl border border-border-secondary"
                            >
                              <div className="flex items-center justify-between mb-2.5">
                                <p className="text-sm font-semibold text-text-primary">
                                  {t(`roles.${getRoleI18nKey(assignment.role)}`, { defaultValue: assignment.role })}
                                </p>
                                <div className="flex items-center gap-2">
                                  {assignment.departmentName && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-surface-tertiary text-text-secondary">
                                      {assignment.departmentName}
                                    </span>
                                  )}
                                  {assignment.isPrimary && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                      {t('drawer.primary')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs text-text-secondary">
                                {assignment.positionTitle && (
                                  <span className="flex items-center gap-1.5">
                                    <Briefcase className="w-3.5 h-3.5 text-text-tertiary" />
                                    {assignment.positionTitle}
                                  </span>
                                )}
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                                  {t('drawer.since', { date: formatDate(assignment.beginDate) })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </SectionCard>
                    )}

                    {/* System Access */}
                    <SectionCard icon={Key} title={t('sections.systemAccess')}>
                      <div className="flex items-center gap-3">
                        {staff.userId ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/10">
                              <Key className="w-3.5 h-3.5" />
                              {t('systemAccess.linkedAccount')}
                            </span>
                          </>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/10">
                            {t('systemAccess.noAccountLinked')}
                          </span>
                        )}
                      </div>
                    </SectionCard>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="px-6 py-4 border-t border-border-secondary bg-surface-secondary/30">
                  <button
                    type="button"
                    onClick={handleViewFullProfile}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-colors shadow-sm"
                  >
                    {t('drawer.viewFullProfile')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
