/**
 * FamilyGroupPanel — the billing "family group" section on the student profile.
 *
 * FB-1.8. Distinct from the guardians/emergency-contacts sections in FamilyTab:
 * a family group links siblings under one primary contact for consolidated
 * billing. Shows the linked family (name + primary contact + siblings), an
 * empty state with a "Link to family" flow (search an existing family OR
 * create one inline), and an "Unlink" action.
 *
 * Consumes the M0 foundation: useStudentFamily / useFamilies / useCreateFamily
 * / useAddFamilyMember / useRemoveFamilyMember (query-key invalidation already
 * wired in the hooks). Read-only for viewers; write affordances gated on
 * `canEdit`.
 */

import { useState } from 'react'
import {
  AlertTriangle,
  HeartHandshake,
  Link2,
  Loader2,
  Plus,
  Search,
  Unlink,
  Users2,
} from 'lucide-react'
import {
  Button,
  Field,
  Input,
  Modal,
  ModalFooter,
  SegmentedControl,
  StatusBadge,
  type StatusTone,
} from '@edforge/ui'
import { UuidBadge } from '@edforge/archetype'
import { useTranslation } from '@edforge/i18n'
import type { FamilyResponse, FamilySibling } from '@edforge/types'
import {
  useStudentFamily,
  useFamilies,
  useCreateFamily,
  useAddFamilyMember,
  useRemoveFamilyMember,
} from '../../../hooks/useFamily'

// ============================================================================
// TYPES
// ============================================================================

export interface FamilyGroupPanelProps {
  studentId: string
  schoolId?: string
  canEdit?: boolean
}

type LinkMode = 'existing' | 'create'

// ============================================================================
// SIBLING ROW
// ============================================================================

const STATUS_TONE: Record<string, StatusTone> = {
  active: 'success',
  enrolled: 'success',
  withdrawn: 'neutral',
  transferred: 'neutral',
  graduated: 'info',
  inactive: 'neutral',
}

function SiblingRow({
  sibling,
  isSubject,
}: {
  sibling: FamilySibling
  isSubject: boolean
}) {
  const { t } = useTranslation('academics')
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border-tertiary last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary truncate">
          {sibling.studentName}
          {isSubject && (
            <span className="text-xs text-text-tertiary font-normal ml-1.5">
              ({t('family.group.you')})
            </span>
          )}
        </p>
        {sibling.gradeLevel && (
          <p className="text-xs text-text-secondary mt-0.5">
            {t('family.siblings.inGrade', { grade: sibling.gradeLevel })}
          </p>
        )}
      </div>
      {sibling.status && (
        <StatusBadge tone={STATUS_TONE[sibling.status] ?? 'neutral'} size="sm" dot>
          {t(`status.${sibling.status}`, { defaultValue: sibling.status })}
        </StatusBadge>
      )}
    </div>
  )
}

// ============================================================================
// LINK MODAL
// ============================================================================

function LinkFamilyModal({
  open,
  onClose,
  studentId,
  schoolId,
}: {
  open: boolean
  onClose: () => void
  studentId: string
  schoolId: string
}) {
  const { t } = useTranslation('academics')
  const [mode, setMode] = useState<LinkMode>('existing')

  // Existing-family search
  const [query, setQuery] = useState('')
  const trimmed = query.trim()
  const canSearch = trimmed.length >= 2
  const families = useFamilies(
    schoolId,
    { namePrefix: trimmed, limit: 20 },
    { enabled: open && mode === 'existing' && canSearch },
  )

  // Create-family form
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const createFamily = useCreateFamily(schoolId)
  const addMember = useAddFamilyMember(schoolId)

  // The family row whose Link is in-flight — so only that row spins, not all.
  const [linkingId, setLinkingId] = useState<string | null>(null)

  const busy = createFamily.isPending || addMember.isPending

  const reset = () => {
    setMode('existing')
    setQuery('')
    setName('')
    setContactName('')
    setContactPhone('')
    setLinkingId(null)
  }

  const handleClose = () => {
    if (busy) return
    reset()
    onClose()
  }

  const linkExisting = (familyId: string) => {
    setLinkingId(familyId)
    addMember.mutate(
      { familyId, data: { studentId } },
      {
        onSuccess: handleClose,
        onSettled: () => setLinkingId(null),
      },
    )
  }

  const createAndLink = () => {
    if (!name.trim() || !contactName.trim()) return
    createFamily.mutate(
      {
        schoolId,
        name: name.trim(),
        primaryContact: {
          name: contactName.trim(),
          ...(contactPhone.trim() ? { phone: contactPhone.trim() } : {}),
        },
      },
      {
        onSuccess: (family) =>
          addMember.mutate(
            { familyId: family.id, data: { studentId } },
            { onSuccess: handleClose },
          ),
      },
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('family.group.linkAction')} size="md">
      <div className="space-y-4">
        <SegmentedControl
          value={mode}
          onChange={(v) => setMode(v as LinkMode)}
          tabs={[
            { id: 'existing', label: t('family.group.linkExisting') },
            { id: 'create', label: t('family.group.createNew') },
          ]}
        />

        {mode === 'existing' ? (
          <div className="space-y-3">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('family.group.searchPlaceholder')}
              prefix={<Search className="w-4 h-4" />}
              isLoading={families.isFetching}
              autoFocus
            />
            {!canSearch ? (
              <p className="text-sm text-text-tertiary py-2">{t('family.group.searchHint')}</p>
            ) : families.isError ? (
              <div className="flex items-center justify-between gap-3 py-2">
                <p className="text-sm text-[rgb(var(--state-danger-fg))]">
                  {t('family.group.searchError')}
                </p>
                <Button variant="outline" size="sm" onClick={() => void families.refetch()}>
                  {t('error.retry')}
                </Button>
              </div>
            ) : families.data && families.data.items.length === 0 ? (
              <p className="text-sm text-text-tertiary py-2">{t('family.group.noMatches')}</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto rounded-lg border border-border-secondary divide-y divide-border-tertiary">
                {(families.data?.items ?? []).map((family: FamilyResponse) => (
                  <li
                    key={family.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {family.name}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        {family.primaryContact.name}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => linkExisting(family.id)}
                      disabled={busy}
                    >
                      {linkingId === family.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Link2 className="w-3.5 h-3.5 mr-1" />
                      )}
                      {t('family.group.linkSelected')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Field label={t('family.group.familyNameLabel')}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('family.group.familyNamePlaceholder')}
                autoFocus
              />
            </Field>
            <Field label={t('family.group.contactNameLabel')}>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('family.group.contactNamePlaceholder')}
              />
            </Field>
            <Field label={t('family.group.contactPhoneLabel')}>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={t('family.group.contactPhonePlaceholder')}
              />
            </Field>
          </div>
        )}
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={handleClose} disabled={busy}>
          {t('family.group.cancel')}
        </Button>
        {mode === 'create' && (
          <Button
            onClick={createAndLink}
            disabled={busy || !name.trim() || !contactName.trim()}
            isLoading={busy}
          >
            {busy ? t('family.group.creating') : t('family.group.createAndLink')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

// ============================================================================
// UNLINK CONFIRM MODAL
// ============================================================================

function UnlinkConfirmModal({
  open,
  onClose,
  familyName,
  onConfirm,
  isPending,
}: {
  open: boolean
  onClose: () => void
  familyName: string
  onConfirm: () => void
  isPending: boolean
}) {
  const { t } = useTranslation('academics')
  return (
    <Modal
      open={open}
      onClose={isPending ? () => {} : onClose}
      title={t('family.group.unlinkTitle')}
      description={t('family.group.unlinkConfirm', { name: familyName })}
      size="sm"
    >
      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isPending}>
          {t('family.group.cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending} isLoading={isPending}>
          <Unlink className="w-4 h-4 mr-1.5" />
          {t('family.group.unlink')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

// ============================================================================
// MAIN PANEL
// ============================================================================

export function FamilyGroupPanel({ studentId, schoolId, canEdit = true }: FamilyGroupPanelProps) {
  const { t } = useTranslation('academics')
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkOpen, setUnlinkOpen] = useState(false)

  const { data, isLoading, isError, refetch } = useStudentFamily(studentId)
  const family = data?.family ?? null
  const siblings = data?.siblings ?? []

  const removeMember = useRemoveFamilyMember(schoolId ?? '')

  const handleUnlink = () => {
    if (!family || !schoolId) return
    removeMember.mutate(
      { familyId: family.id, studentId },
      { onSuccess: () => setUnlinkOpen(false) },
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
          {t('family.group.title')}
        </h3>
        {canEdit && family && schoolId && (
          <Button variant="ghost" size="sm" onClick={() => setUnlinkOpen(true)}>
            <Unlink className="w-3.5 h-3.5 mr-1" />
            {t('family.group.unlink')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-5 w-40 bg-surface-tertiary rounded animate-pulse" />
          <div className="h-4 w-28 bg-surface-tertiary rounded animate-pulse" />
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <AlertTriangle className="w-9 h-9 text-[rgb(var(--state-danger-fg))] mx-auto mb-3" />
          <p className="text-text-secondary font-medium">{t('family.group.loadError')}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-4">
            {t('error.retry')}
          </Button>
        </div>
      ) : !family ? (
        <div className="text-center py-8">
          <Users2 className="w-9 h-9 text-text-tertiary mx-auto mb-3" />
          <p className="text-text-secondary font-medium">{t('family.group.notLinked')}</p>
          <p className="text-sm text-text-tertiary mt-1">
            {t('family.group.notLinkedDescription')}
          </p>
          {canEdit && schoolId && (
            <Button variant="outline" size="sm" onClick={() => setLinkOpen(true)} className="mt-4">
              <Plus className="w-4 h-4 mr-1.5" />
              {t('family.group.linkAction')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-text-primary">{family.name}</p>
              <p className="text-sm text-text-secondary mt-0.5">
                {t('family.primaryContact')}: {family.primaryContact.name}
                {family.primaryContact.phone && (
                  <span className="text-text-tertiary ml-1">
                    ({family.primaryContact.phone})
                  </span>
                )}
              </p>
            </div>
            <UuidBadge value={family.id} />
          </div>

          <div>
            <p className="text-xs text-text-tertiary uppercase tracking-wide mb-1">
              {t('family.group.siblingsTitle')}
            </p>
            {siblings.length === 0 ? (
              <p className="text-sm text-text-tertiary py-2">{t('family.group.noSiblings')}</p>
            ) : (
              <div>
                {siblings.map((sibling) => (
                  <SiblingRow
                    key={sibling.studentId}
                    sibling={sibling}
                    isSubject={sibling.studentId === studentId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {canEdit && schoolId && (
        <>
          <LinkFamilyModal
            open={linkOpen}
            onClose={() => setLinkOpen(false)}
            studentId={studentId}
            schoolId={schoolId}
          />
          {family && (
            <UnlinkConfirmModal
              open={unlinkOpen}
              onClose={() => setUnlinkOpen(false)}
              familyName={family.name}
              onConfirm={handleUnlink}
              isPending={removeMember.isPending}
            />
          )}
        </>
      )}
    </section>
  )
}
