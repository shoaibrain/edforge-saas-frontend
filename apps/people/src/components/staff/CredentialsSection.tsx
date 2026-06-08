/**
 * CredentialsSection Component
 *
 * Card-based layout for staff credentials with expiration color-coding.
 * Consumes existing backend endpoints (no new backend work).
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
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
  other: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
}

const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[rgb(var(--state-warning-bg)/0.18)] text-[rgb(var(--state-warning-fg))]',
  verified: 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))]',
  rejected: 'bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--state-danger-fg))]',
  expired: 'bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))]',
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

function getExpirationLabel(credential: CredentialResponseDto): string {
  if (!credential.expirationDate) return 'No expiration'
  if (credential.isExpired) return 'Expired'
  if (credential.daysUntilExpiration !== undefined && credential.daysUntilExpiration !== null) {
    if (credential.daysUntilExpiration <= 0) return 'Expired'
    if (credential.daysUntilExpiration === 1) return '1 day remaining'
    if (credential.daysUntilExpiration <= 90) return `${credential.daysUntilExpiration} days remaining`
    return `Expires ${formatDate(credential.expirationDate)}`
  }
  return `Expires ${formatDate(credential.expirationDate)}`
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
      'Are you sure you want to delete this credential? This action cannot be undone.'
    )
    if (!confirmed) return

    setDeletingId(credentialId)
    try {
      await deleteCredential.mutateAsync({ staffId, credentialId })
      toast.success('Credential deleted successfully')
    } catch {
      toast.error('Failed to delete credential')
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
          <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">Credentials</h3>
          <p className="text-sm text-[rgb(var(--text-tertiary))] mt-1">
            Teaching licenses, certifications, and professional credentials
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3.5 py-2 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))] rounded-lg hover:bg-[rgb(var(--action-primary-bg-hover))] transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Credential
        </button>
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeInUp}>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse h-32 bg-[rgb(var(--surface-secondary))] rounded-xl" />
            ))}
          </div>
        ) : !credentials || credentials.length === 0 ? (
          <div className="text-center py-16 bg-[rgb(var(--surface-secondary))] rounded-xl border-2 border-dashed border-[rgb(var(--border-secondary))]">
            <Award className="w-12 h-12 mx-auto mb-4 text-[rgb(var(--text-tertiary))] opacity-40" />
            <h4 className="font-medium text-[rgb(var(--text-secondary))] mb-2">No Credentials</h4>
            <p className="text-sm text-[rgb(var(--text-tertiary))] max-w-sm mx-auto">
              No credentials have been added for this staff member yet.
            </p>
            <button
              onClick={handleAdd}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[rgb(var(--action-secondary-fg))] hover:text-[rgb(var(--text-primary))] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Credential
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {credentials.map((credential) => (
              <motion.div
                key={credential.credentialId}
                variants={fadeInUp}
                className="p-5 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] hover:border-[rgb(var(--border-focus))] transition-all group"
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
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]">
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
                        <span>Issued {formatDate(credential.issuanceDate)}</span>
                        {credential.expirationDate && (
                          <span className={`flex items-center gap-1 ${getExpirationColor(credential)}`}>
                            {credential.isExpired ? (
                              <AlertTriangle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {getExpirationLabel(credential)}
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
                            Document
                          </a>
                        )}
                      </div>

                      {/* Grade Levels */}
                      {credential.gradeLevels && credential.gradeLevels.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-xs text-[rgb(var(--text-tertiary))]">Grades:</span>
                          {credential.gradeLevels.map((grade) => (
                            <span
                              key={grade}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-secondary))]"
                            >
                              {formatFieldDescriptor(grade)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleEdit(credential)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--surface-tertiary))] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      title="Edit credential"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(credential.credentialId)}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--state-danger-bg)/0.18)] text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--state-danger-fg))] transition-colors"
                      title="Delete credential"
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
