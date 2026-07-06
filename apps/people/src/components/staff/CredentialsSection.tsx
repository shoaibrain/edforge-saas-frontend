/**
 * CredentialsSection Component
 *
 * Card-based layout for staff credentials with expiration color-coding.
 * Consumes existing backend endpoints (no new backend work).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useTranslation } from '@edforge/i18n'
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react'
import type { CredentialResponseDto } from '@aibrains/shared-types'
import { useStaffCredentials, useDeleteCredential } from '../../hooks'
import { CredentialModal } from './CredentialModal'
import { formatDate } from '../../lib/utils'

// ============================================================================
// CONSTANTS
// ============================================================================

const CREDENTIAL_TYPE_COLORS: Record<string, string> = {
  certification: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  license: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  endorsement: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  degree: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  registration: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  permit: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  clearance: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  training: 'bg-[rgb(var(--state-info-bg)/0.18)] text-[rgb(var(--state-info-fg))]',
  other: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
}

const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  verified: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  rejected: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
  expired: 'bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))]',
  revoked: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function getExpirationColor(credential: CredentialResponseDto): string {
  if (!credential.expirationDate) return 'text-[rgb(var(--text-tertiary))]'
  if (credential.isExpired) return 'text-[rgb(var(--state-danger-fg))]'
  if (credential.isExpiringSoon) return 'text-[rgb(var(--state-warning-fg))]'
  return 'text-[rgb(var(--state-success-fg))]'
}

function getExpirationLabel(credential: CredentialResponseDto, t: ReturnType<typeof useTranslation>['t']): string {
  if (!credential.expirationDate) return t('credentials.noExpiration')
  if (credential.isExpired) return t('credentials.expired')
  if (credential.daysUntilExpiration !== undefined && credential.daysUntilExpiration !== null) {
    if (credential.daysUntilExpiration <= 0) return t('credentials.expired')
    if (credential.daysUntilExpiration <= 90) return t('credentials.daysRemaining', { count: credential.daysUntilExpiration })
    return t('credentials.expiresOn', { date: formatDate(credential.expirationDate) })
  }
  return t('credentials.expiresOn', { date: formatDate(credential.expirationDate) })
}

function formatCredentialType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function formatFieldDescriptor(field: string): string {
  return field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CredentialsSection({ staffId }: { staffId: string }) {
  const { t } = useTranslation('people')
  const { data: credentials, isLoading } = useStaffCredentials(staffId)
  const deleteCredential = useDeleteCredential()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<CredentialResponseDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleEdit = (credential: CredentialResponseDto) => {
    setEditingCredential(credential)
    setModalOpen(true)
  }

  const handleAdd = () => {
    setEditingCredential(null)
    setModalOpen(true)
  }

  const handleDelete = async (credentialId: string) => {
    const confirmed = window.confirm(
      t('credentials.deleteConfirm')
    )
    if (!confirmed) return

    setDeletingId(credentialId)
    try {
      await deleteCredential.mutateAsync({ staffId, credentialId })
      toast.success(t('credentials.toasts.deleted'))
    } catch {
      toast.error(t('credentials.toasts.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">{t('tabs.credentials')}</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            {t('credentials.description')}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3.5 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('actions.addCredential')}
        </button>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-[rgb(var(--background-secondary))] rounded-xl" />
            ))}
          </div>
        ) : !credentials || credentials.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--background-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <Award className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">{t('credentials.emptyTitle')}</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              {t('credentials.emptyDescription')}
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('credentials.addFirst')}
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {credentials.map((credential) => (
              <motion.div
                key={credential.credentialId}
                variants={fadeInUp}
                className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] hover:border-[rgb(var(--border-focus))] transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 min-w-0">
                    {/* Type Icon */}
                    <div className={`p-3 rounded-xl flex-shrink-0 ${CREDENTIAL_TYPE_COLORS[credential.credentialTypeDescriptor] || CREDENTIAL_TYPE_COLORS.other}`}>
                      <Award className="w-6 h-6" />
                    </div>

                    <div className="min-w-0">
                      {/* Name & ID */}
                      <h4 className="font-semibold text-[rgb(var(--text-primary))] truncate">
                        {credential.name}
                      </h4>
                      <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5 font-mono">
                        {credential.credentialIdentifier}
                      </p>

                      {/* Badges */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${CREDENTIAL_TYPE_COLORS[credential.credentialTypeDescriptor] || CREDENTIAL_TYPE_COLORS.other}`}>
                          {formatCredentialType(credential.credentialTypeDescriptor)}
                        </span>
                        {credential.credentialFieldDescriptor && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]">
                            {formatFieldDescriptor(credential.credentialFieldDescriptor)}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${VERIFICATION_STATUS_COLORS[credential.verificationStatus] || VERIFICATION_STATUS_COLORS.pending}`}>
                          <ShieldCheck className="w-3 h-3" />
                          {credential.verificationStatus.charAt(0).toUpperCase() + credential.verificationStatus.slice(1)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-[rgb(var(--text-tertiary))]">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {credential.issuingOrganization}
                        </span>
                        <span>{t('credentials.issued', { date: formatDate(credential.issuanceDate) })}</span>
                        {credential.expirationDate && (
                          <span className={`flex items-center gap-1 ${getExpirationColor(credential)}`}>
                            {credential.isExpired ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {getExpirationLabel(credential, t)}
                          </span>
                        )}
                        {credential.documentUrl && (
                          <a
                            href={credential.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[rgb(var(--action-secondary-fg))] hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t('credentials.document')}
                          </a>
                        )}
                      </div>

                      {/* Grade Levels */}
                      {credential.gradeLevels && credential.gradeLevels.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-xs text-[rgb(var(--text-tertiary))]">{t('credentials.grades')}</span>
                          {credential.gradeLevels.map((grade) => (
                            <span
                              key={grade}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-secondary))]"
                            >
                              {formatFieldDescriptor(grade)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ms-2">
                    <button
                      onClick={() => handleEdit(credential)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--background-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title={t('credentials.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(credential.credentialId)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                      title={t('credentials.delete')}
                      disabled={deletingId === credential.credentialId}
                    >
                      {deletingId === credential.credentialId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <CredentialModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCredential(null)
        }}
        staffId={staffId}
        credential={editingCredential}
      />
    </motion.div>
  )
}
