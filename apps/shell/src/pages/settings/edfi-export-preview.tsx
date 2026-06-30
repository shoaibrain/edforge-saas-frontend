/**
 * Ed-Fi Export Preview Dashboard
 *
 * Preview/validate Ed-Fi export data for education organizations and staff.
 * Split view: EdForge data ↔ Ed-Fi JSON output using shared-types mappers.
 */

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  FileJson2,
  Building2,
  Landmark,
  School,
  Users,
  Network,
  Copy,
  Download,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Button, Select } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { toast } from 'sonner'
import type { TFunction } from 'i18next'
import {
  toEdFiStateEducationAgency,
  toEdFiLocalEducationAgency,
  toEdFiEducationServiceCenter,
  toEdFiEducationOrganizationNetwork,
} from '@aibrains/shared-types'
import type { SeaResponseDto, LeaResponseDto, EscResponseDto, NetworkResponseDto } from '@aibrains/shared-types'
import {
  useStateEducationAgency,
  useLocalEducationAgencies,
  useEducationServiceCenters,
  useNetworks,
} from '@/hooks/useEducationOrgs'
import { SettingsPageHeader, fadeInUp, staggerChildren } from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES
// ============================================================================

type EntityType = 'sea' | 'lea' | 'esc' | 'network' | 'staff'

interface EntityOption {
  type: EntityType
  labelKey: string
  icon: typeof Building2
}

const ENTITY_OPTIONS: EntityOption[] = [
  {
    type: 'sea',
    labelKey: 'organization.entities.stateEducationAgency',
    icon: Landmark,
  },
  {
    type: 'lea',
    labelKey: 'organization.entities.localEducationAgency',
    icon: Building2,
  },
  {
    type: 'esc',
    labelKey: 'organization.entities.educationServiceCenter',
    icon: School,
  },
  {
    type: 'network',
    labelKey: 'organization.edfiExport.entities.network',
    icon: Network,
  },
  {
    type: 'staff',
    labelKey: 'organization.edfiExport.entities.staff',
    icon: Users,
  },
]

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  field: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

function validateEdFiOutput(
  json: Record<string, unknown>,
  entityType: EntityType,
  t: TFunction<'settings'>,
): ValidationResult[] {
  const results: ValidationResult[] = []

  // Common required fields
  const requiredCommon = ['nameOfInstitution']
  if (entityType !== 'staff') {
    for (const field of requiredCommon) {
      if (json[field]) {
        results.push({ field, status: 'pass', message: t('organization.edfiExport.validation.isSet', { field }) })
      } else {
        results.push({ field, status: 'fail', message: t('organization.edfiExport.validation.isMissing', { field }) })
      }
    }
  }

  // Entity-specific checks
  switch (entityType) {
    case 'sea':
      checkField(results, json, 'stateEducationAgencyId', 'required', t)
      checkField(results, json, 'categories', 'required', t)
      checkField(results, json, 'addresses', 'optional', t)
      break
    case 'lea':
      checkField(results, json, 'localEducationAgencyId', 'required', t)
      checkField(results, json, 'localEducationAgencyCategoryDescriptor', 'required', t)
      checkField(results, json, 'categories', 'required', t)
      checkField(results, json, 'charterStatusDescriptor', 'optional', t)
      break
    case 'esc':
      checkField(results, json, 'educationServiceCenterId', 'required', t)
      checkField(results, json, 'categories', 'required', t)
      break
    case 'network':
      checkField(results, json, 'educationOrganizationNetworkId', 'required', t)
      checkField(results, json, 'networkPurposeDescriptor', 'required', t)
      break
    case 'staff':
      checkField(results, json, 'staffUniqueId', 'required', t)
      checkField(results, json, 'firstName', 'required', t)
      checkField(results, json, 'lastSurname', 'required', t)
      checkField(results, json, 'electronicMails', 'optional', t)
      break
  }

  return results
}

function checkField(
  results: ValidationResult[],
  json: Record<string, unknown>,
  field: string,
  requirement: 'required' | 'optional',
  t: TFunction<'settings'>,
) {
  const value = json[field]
  const hasValue = value !== undefined && value !== null && value !== ''
  const isArray = Array.isArray(value)

  if (hasValue && (!isArray || value.length > 0)) {
    results.push({ field, status: 'pass', message: t('organization.edfiExport.validation.isSet', { field }) })
  } else if (requirement === 'required') {
    results.push({ field, status: 'fail', message: t('organization.edfiExport.validation.requiredMissing', { field }) })
  } else {
    results.push({ field, status: 'warn', message: t('organization.edfiExport.validation.optionalUnset', { field }) })
  }
}

// ============================================================================
// ENTITY SELECTOR
// ============================================================================

function EntitySelector({ selected, onSelect }: { selected: EntityType; onSelect: (type: EntityType) => void }) {
  const { t } = useTranslation('settings')

  return (
    <div className="flex flex-wrap gap-2">
      {ENTITY_OPTIONS.map(({ type, labelKey, icon: Icon }) => {
        const label = t(labelKey)
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            aria-pressed={selected === type}
            aria-label={t('organization.edfiExport.previewEntityAria', { label })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selected === type
                ? 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]  ring-1 ring-[rgb(var(--border-focus))]/30'
                : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ============================================================================
// ENTITY PICKER (which entity within the type)
// ============================================================================

function EntityPicker<T>({
  items,
  selectedId,
  onSelect,
  getLabel,
  getId,
  isLoading,
}: {
  items: T[]
  selectedId: string | null
  onSelect: (id: string) => void
  getLabel: (item: T) => string
  getId: (item: T) => string
  isLoading: boolean
}) {
  const { t } = useTranslation('settings')

  if (isLoading) {
    return <div className="h-10 rounded-lg bg-[rgb(var(--background-tertiary))] animate-pulse" />
  }

  if (items.length === 0) {
    return <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">{t('organization.edfiExport.noEntities')}</p>
  }

  return (
    <Select
      aria-label={t('organization.edfiExport.selectEntityAria')}
      className="w-full"
      placeholder={t('organization.edfiExport.selectEntityPlaceholder')}
      value={selectedId || null}
      onChange={(v) => onSelect(v ?? '')}
      options={items.map((item) => ({ value: getId(item), label: getLabel(item) }))}
    />
  )
}

// ============================================================================
// JSON PREVIEW PANEL
// ============================================================================

function JsonPreviewPanel({ json, entityType }: { json: Record<string, unknown> | null; entityType: EntityType }) {
  const { t } = useTranslation('settings')

  if (!json) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[rgb(var(--text-tertiary))]">
        {t('organization.edfiExport.emptyPreview')}
      </div>
    )
  }

  const jsonString = JSON.stringify(json, null, 2)
  const validation = validateEdFiOutput(json, entityType, t)
  const passCount = validation.filter((v) => v.status === 'pass').length
  const failCount = validation.filter((v) => v.status === 'fail').length
  const warnCount = validation.filter((v) => v.status === 'warn').length

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    toast.success(t('organization.edfiExport.toasts.copied'))
  }

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edfi-${entityType}-export.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              failCount === 0
                ? 'bg-[rgb(var(--state-success-bg)/0.18)] text-[rgb(var(--state-success-fg))] '
                : 'bg-[rgb(var(--state-danger-bg)/0.18)]0/10 text-[rgb(var(--state-danger-fg))] dark:text-[rgb(var(--state-danger-fg))]'
            }`}
          >
            {failCount === 0 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {t('organization.edfiExport.validation.summary', { passCount, warnCount, failCount })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={handleCopy}
            aria-label={t('organization.edfiExport.actions.copyAria')}
          >
            <Copy className="w-3.5 h-3.5" />
            {t('organization.edfiExport.actions.copy')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5"
            onClick={handleDownload}
            aria-label={t('organization.edfiExport.actions.downloadAria')}
          >
            <Download className="w-3.5 h-3.5" />
            {t('organization.edfiExport.actions.download')}
          </Button>
        </div>
      </div>

      {/* JSON */}
      <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-tertiary))] overflow-hidden">
        <pre className="p-4 text-xs font-mono text-[rgb(var(--text-secondary))] overflow-x-auto max-h-[50vh] overflow-y-auto">
          {jsonString}
        </pre>
      </div>

      {/* Validation Details */}
      <div className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] p-4">
        <h4 className="text-xs font-semibold text-[rgb(var(--text-primary))] uppercase tracking-wider mb-3">
          {t('organization.edfiExport.validation.title')}
        </h4>
        <div className="space-y-1.5">
          {validation.map((v) => (
            <div key={v.field} className="flex items-center gap-2 text-xs">
              {v.status === 'pass' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[rgb(var(--state-success-fg))] shrink-0" />
              ) : v.status === 'warn' ? (
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-[rgb(var(--state-danger-fg))] shrink-0" />
              )}
              <span className="font-mono text-[rgb(var(--text-tertiary))]">{v.field}</span>
              <span className="text-[rgb(var(--text-secondary))]">{v.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function EdFiExportPreviewPage() {
  const { t } = useTranslation('settings')
  const [entityType, setEntityType] = useState<EntityType>('sea')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Fetch data for each entity type
  const { data: sea } = useStateEducationAgency()
  const { data: leas, isLoading: leasLoading } = useLocalEducationAgencies()
  const { data: escs, isLoading: escsLoading } = useEducationServiceCenters()
  const { data: networks, isLoading: networksLoading } = useNetworks()

  // Reset selection when entity type changes
  const handleTypeChange = (type: EntityType) => {
    setEntityType(type)
    setSelectedId(null)
  }

  // Build the Ed-Fi JSON for the selected entity
  const edFiJson = useMemo(() => {
    if (!selectedId && entityType !== 'sea') return null

    switch (entityType) {
      case 'sea': {
        if (!sea) return null
        return toEdFiStateEducationAgency(sea as SeaResponseDto) as unknown as Record<string, unknown>
      }
      case 'lea': {
        const lea = leas?.items?.find((l) => l.id === selectedId)
        if (!lea) return null
        return toEdFiLocalEducationAgency(lea as LeaResponseDto) as unknown as Record<string, unknown>
      }
      case 'esc': {
        const esc = escs?.items?.find((e) => e.id === selectedId)
        if (!esc) return null
        return toEdFiEducationServiceCenter(esc as EscResponseDto) as unknown as Record<string, unknown>
      }
      case 'network': {
        const network = networks?.items?.find((n) => n.id === selectedId)
        if (!network) return null
        return toEdFiEducationOrganizationNetwork(network as NetworkResponseDto) as unknown as Record<string, unknown>
      }
      case 'staff': {
        // Staff data would need a separate hook; placeholder for now
        return null
      }
      default:
        return null
    }
  }, [entityType, selectedId, sea, leas, escs, networks])

  // For SEA, auto-select since it's a singleton
  const effectiveJson = entityType === 'sea' && sea ? edFiJson : edFiJson

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <motion.div initial="hidden" animate="visible" variants={staggerChildren} className="space-y-8">
        <SettingsPageHeader
          title={t('organization.edfiExport.title')}
          description={t('organization.edfiExport.description')}
          icon={FileJson2}
        />

        {/* Entity Type Selector */}
        <motion.div variants={fadeInUp}>
          <EntitySelector selected={entityType} onSelect={handleTypeChange} />
        </motion.div>

        {/* Entity Picker (not shown for SEA which is singleton) */}
        <motion.div variants={fadeInUp}>
          {entityType === 'sea' ? (
            sea ? (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))]">
                <Landmark className="w-5 h-5 text-[rgb(var(--state-info-fg))] " />
                <div>
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">{sea.nameOfInstitution}</p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    {t('organization.edfiExport.singletonSea')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">{t('organization.edfiExport.noSea')}</p>
            )
          ) : entityType === 'lea' ? (
            <EntityPicker
              items={leas?.items || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              getLabel={(l) => l.nameOfInstitution}
              getId={(l) => l.id}
              isLoading={leasLoading}
            />
          ) : entityType === 'esc' ? (
            <EntityPicker
              items={escs?.items || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              getLabel={(e) => e.nameOfInstitution}
              getId={(e) => e.id}
              isLoading={escsLoading}
            />
          ) : entityType === 'network' ? (
            <EntityPicker
              items={networks?.items || []}
              selectedId={selectedId}
              onSelect={setSelectedId}
              getLabel={(n) => n.nameOfInstitution}
              getId={(n) => n.id}
              isLoading={networksLoading}
            />
          ) : entityType === 'staff' ? (
            <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">
              {t('organization.edfiExport.staffUnavailable')}
            </p>
          ) : null}
        </motion.div>

        {/* JSON Preview */}
        <motion.div variants={fadeInUp}>
          <JsonPreviewPanel json={effectiveJson} entityType={entityType} />
        </motion.div>
      </motion.div>
    </div>
  )
}
