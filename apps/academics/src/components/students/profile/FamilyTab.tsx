/**
 * FamilyTab Component
 *
 * Displays guardians and emergency contacts in a clean layout.
 * No card wrappers — uses sections with subtle separators.
 */

import { useState } from 'react'
import {
  Users,
  Phone,
  Mail,
  Shield,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Plus,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Loader2,
} from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import type { StudentProfileResponseDto } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

export interface FamilyTabProps {
  student: StudentProfileResponseDto
  onAddGuardian?: () => void
  onEditGuardian?: (guardianId: string) => void
  onGrantPortalAccess?: (guardian: NonNullable<StudentProfileResponseDto['guardians']>[number]) => void
  isGrantingAccess?: boolean
  canEdit?: boolean
}

type Guardian = NonNullable<StudentProfileResponseDto['guardians']>[number]
type EmergencyContact = NonNullable<StudentProfileResponseDto['emergencyContacts']>[number]

// ============================================================================
// GUARDIAN ROW
// ============================================================================

function GuardianRow({
  guardian,
  onEdit,
  onGrantAccess,
  isGrantingAccess,
  canEdit,
}: {
  guardian: Guardian
  onEdit?: () => void
  onGrantAccess?: () => void
  isGrantingAccess?: boolean
  canEdit?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation('academics')

  // Map relationship keys to i18n keys (backend uses "guardian", i18n uses "legalGuardian")
  const relationshipKey = guardian.relationship === 'guardian' ? 'legalGuardian' : guardian.relationship

  return (
    <div className="py-4 first:pt-0 last:pb-0 border-b border-border-tertiary last:border-0">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Name + relationship */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-text-primary">
              {guardian.firstName} {guardian.lastName}
            </p>
            {guardian.isPrimary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--action-secondary-fg))] rounded-full">
                <Shield className="w-3 h-3" />
                {t('guardian.primary')}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {t(`relationships.${relationshipKey}`, { defaultValue: guardian.relationship })}
          </p>

          {/* Permission tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {guardian.hasPortalAccess && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))] rounded-full">
                <UserCheck className="w-3 h-3" />
                {t('guardian.portalAccess')}
              </span>
            )}
            {guardian.canPickup && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] rounded-full">
                <UserCheck className="w-3 h-3" />
                {t('guardian.pickupAuth')}
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick contact + expand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {guardian.phone && (
            <a
              href={`tel:${guardian.phone}`}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title={guardian.phone}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
          {guardian.email && (
            <a
              href={`mailto:${guardian.email}`}
              className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              title={guardian.email}
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-3 ms-0 ps-0 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {guardian.phone && (
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide">{t('fields.phone')}</span>
              <p className="text-text-primary mt-0.5">
                {guardian.phone}
                {guardian.phoneType && (
                  <span className="text-text-tertiary capitalize ms-1">({guardian.phoneType})</span>
                )}
              </p>
            </div>
          )}
          {guardian.alternatePhone && (
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide">{t('fields.altPhone')}</span>
              <p className="text-text-primary mt-0.5">{guardian.alternatePhone}</p>
            </div>
          )}
          {guardian.email && (
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide">{t('fields.email')}</span>
              <p className="text-text-primary mt-0.5 truncate">{guardian.email}</p>
            </div>
          )}
          {(guardian.occupation || guardian.employer) && (
            <div>
              <span className="text-xs text-text-tertiary uppercase tracking-wide">{t('fields.occupation')}</span>
              <p className="text-text-primary mt-0.5 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-text-tertiary" />
                {guardian.occupation}
                {guardian.employer && (
                  <span className="text-text-secondary">
                    {t('guardian.atEmployer', { employer: guardian.employer })}
                  </span>
                )}
              </p>
            </div>
          )}
          {canEdit && (
            <div className="sm:col-span-2 flex items-center gap-2 mt-1">
              {onEdit && (
                <Button variant="ghost" size="sm" onClick={onEdit}>
                  {t('actions.editGuardian')}
                </Button>
              )}
              {onGrantAccess && !guardian.hasPortalAccess && guardian.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onGrantAccess}
                  disabled={isGrantingAccess}
                >
                  {isGrantingAccess ? (
                    <Loader2 className="w-3.5 h-3.5 me-1 animate-spin" />
                  ) : (
                    <KeyRound className="w-3.5 h-3.5 me-1" />
                  )}
                  {t('actions.grantPortalAccess')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// EMERGENCY CONTACT ROW
// ============================================================================

function EmergencyContactRow({ contact, index }: { contact: EmergencyContact; index: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-tertiary last:border-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[rgb(var(--state-danger-bg)/0.18)] flex items-center justify-center text-xs font-semibold text-[rgb(var(--state-danger-fg))]">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{contact.name}</p>
        <p className="text-xs text-text-secondary">{contact.relationship}</p>
      </div>
      <a
        href={`tel:${contact.phone}`}
        className="text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1.5"
      >
        <Phone className="w-3.5 h-3.5" />
        {contact.phone}
      </a>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FamilyTab({
  student,
  onAddGuardian,
  onEditGuardian,
  onGrantPortalAccess,
  isGrantingAccess,
  canEdit = true,
}: FamilyTabProps) {
  const { t } = useTranslation('academics')
  const guardians = student.guardians || []
  const emergencyContacts = student.emergencyContacts || []

  const sortedGuardians = [...guardians].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1
    if (!a.isPrimary && b.isPrimary) return 1
    return 0
  })

  const sortedEmergencyContacts = [...emergencyContacts].sort(
    (a, b) => (a.priority || 1) - (b.priority || 1)
  )

  return (
    <div className="space-y-8">
      {/* Guardians Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-[rgb(var(--state-info-fg))]" />
            {t('sections.guardians')}
            {guardians.length > 0 && (
              <span className="text-xs text-text-tertiary font-normal ms-1">
                ({guardians.length})
              </span>
            )}
          </h3>
          {canEdit && onAddGuardian && (
            <Button variant="ghost" size="sm" onClick={onAddGuardian}>
              <Plus className="w-3.5 h-3.5 me-1" />
              {t('actions.add')}
            </Button>
          )}
        </div>

        {sortedGuardians.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary font-medium">{t('empty.noGuardians')}</p>
            <p className="text-sm text-text-tertiary mt-1">
              {t('empty.addGuardianDescription')}
            </p>
            {canEdit && onAddGuardian && (
              <Button variant="outline" size="sm" onClick={onAddGuardian} className="mt-4">
                <Plus className="w-4 h-4 me-1.5" />
                {t('actions.addGuardian')}
              </Button>
            )}
          </div>
        ) : (
          <div>
            {sortedGuardians.map((guardian, index) => (
              <GuardianRow
                key={guardian.guardianId || index}
                guardian={guardian}
                onEdit={
                  guardian.guardianId
                    ? () => onEditGuardian?.(guardian.guardianId!)
                    : undefined
                }
                onGrantAccess={
                  onGrantPortalAccess
                    ? () => onGrantPortalAccess(guardian)
                    : undefined
                }
                isGrantingAccess={isGrantingAccess}
                canEdit={canEdit}
              />
            ))}
          </div>
        )}
      </section>

      {/* Emergency Contacts Section */}
      <section>
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-[rgb(var(--state-danger-fg))]" />
          {t('sections.emergencyContacts')}
          {emergencyContacts.length > 0 && (
            <span className="text-xs text-text-tertiary font-normal ms-1">
              ({emergencyContacts.length})
            </span>
          )}
        </h3>

        {sortedEmergencyContacts.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">{t('empty.noEmergencyContacts')}</p>
          </div>
        ) : (
          <div>
            {sortedEmergencyContacts.map((contact, index) => (
              <EmergencyContactRow key={index} contact={contact} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ============================================================================
// SKELETON
// ============================================================================

export function FamilyTabSkeleton() {
  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-surface-tertiary animate-pulse" />
          <div className="h-4 w-24 bg-surface-tertiary rounded animate-pulse" />
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="py-4 border-b border-border-tertiary">
            <div className="h-5 w-36 bg-surface-tertiary rounded animate-pulse mb-2" />
            <div className="h-4 w-20 bg-surface-tertiary rounded animate-pulse mb-2" />
            <div className="flex gap-2">
              <div className="h-5 w-20 bg-surface-tertiary rounded-full animate-pulse" />
              <div className="h-5 w-20 bg-surface-tertiary rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
