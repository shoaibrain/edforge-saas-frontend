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
import { toast } from 'sonner'
import {
  toEdFiStateEducationAgency,
  toEdFiLocalEducationAgency,
  toEdFiEducationServiceCenter,
  toEdFiEducationOrganizationNetwork,
} from '@aibrains/shared-types'
import type {
  SeaResponseDto,
  LeaResponseDto,
  EscResponseDto,
  NetworkResponseDto,
} from '@aibrains/shared-types'
import {
  useStateEducationAgency,
  useLocalEducationAgencies,
  useEducationServiceCenters,
  useNetworks,
} from '@/hooks/useEducationOrgs'
import {
  SettingsPageHeader,
  fadeInUp,
  staggerChildren,
} from '@/components/settings/SettingsShared'

// ============================================================================
// TYPES
// ============================================================================

type EntityType = 'sea' | 'lea' | 'esc' | 'network' | 'staff'

interface EntityOption {
  type: EntityType
  label: string
  icon: typeof Building2
  description: string
}

const ENTITY_OPTIONS: EntityOption[] = [
  { type: 'sea', label: 'State Education Agency', icon: Landmark, description: 'SEA root organization' },
  { type: 'lea', label: 'Local Education Agency', icon: Building2, description: 'School districts' },
  { type: 'esc', label: 'Education Service Center', icon: School, description: 'Regional service centers' },
  { type: 'network', label: 'Organization Network', icon: Network, description: 'EdOrg networks' },
  { type: 'staff', label: 'Staff', icon: Users, description: 'Staff members' },
]

// ============================================================================
// VALIDATION
// ============================================================================

interface ValidationResult {
  field: string
  status: 'pass' | 'warn' | 'fail'
  message: string
}

function validateEdFiOutput(json: Record<string, unknown>, entityType: EntityType): ValidationResult[] {
  const results: ValidationResult[] = []

  // Common required fields
  const requiredCommon = ['nameOfInstitution']
  if (entityType !== 'staff') {
    for (const field of requiredCommon) {
      if (json[field]) {
        results.push({ field, status: 'pass', message: `${field} is set` })
      } else {
        results.push({ field, status: 'fail', message: `${field} is missing` })
      }
    }
  }

  // Entity-specific checks
  switch (entityType) {
    case 'sea':
      checkField(results, json, 'stateEducationAgencyId', 'required')
      checkField(results, json, 'categories', 'required')
      checkField(results, json, 'addresses', 'optional')
      break
    case 'lea':
      checkField(results, json, 'localEducationAgencyId', 'required')
      checkField(results, json, 'localEducationAgencyCategoryDescriptor', 'required')
      checkField(results, json, 'categories', 'required')
      checkField(results, json, 'charterStatusDescriptor', 'optional')
      break
    case 'esc':
      checkField(results, json, 'educationServiceCenterId', 'required')
      checkField(results, json, 'categories', 'required')
      break
    case 'network':
      checkField(results, json, 'educationOrganizationNetworkId', 'required')
      checkField(results, json, 'networkPurposeDescriptor', 'required')
      break
    case 'staff':
      checkField(results, json, 'staffUniqueId', 'required')
      checkField(results, json, 'firstName', 'required')
      checkField(results, json, 'lastSurname', 'required')
      checkField(results, json, 'electronicMails', 'optional')
      break
  }

  return results
}

function checkField(
  results: ValidationResult[],
  json: Record<string, unknown>,
  field: string,
  requirement: 'required' | 'optional'
) {
  const value = json[field]
  const hasValue = value !== undefined && value !== null && value !== ''
  const isArray = Array.isArray(value)

  if (hasValue && (!isArray || value.length > 0)) {
    results.push({ field, status: 'pass', message: `${field} is set` })
  } else if (requirement === 'required') {
    results.push({ field, status: 'fail', message: `${field} is required but missing` })
  } else {
    results.push({ field, status: 'warn', message: `${field} is optional and not set` })
  }
}

// ============================================================================
// ENTITY SELECTOR
// ============================================================================

function EntitySelector({
  selected,
  onSelect,
}: {
  selected: EntityType
  onSelect: (type: EntityType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ENTITY_OPTIONS.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          aria-pressed={selected === type}
          aria-label={`Preview ${label}`}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === type
              ? 'bg-[rgb(var(--action-primary-bg))]/10 text-[rgb(var(--action-secondary-fg))]  ring-1 ring-[rgb(var(--border-focus))]/30'
              : 'text-[rgb(var(--text-tertiary))] hover:text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))]'
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
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
  if (isLoading) {
    return <div className="h-10 rounded-lg bg-[rgb(var(--background-tertiary))] animate-pulse" />
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">
        No entities found for this type.
      </p>
    )
  }

  return (
    <Select
      aria-label="Select an entity to preview"
      className="w-full"
      placeholder="Select an entity to preview..."
      value={selectedId || null}
      onChange={(v) => onSelect(v ?? '')}
      options={items.map((item) => ({ value: getId(item), label: getLabel(item) }))}
    />
  )
}

// ============================================================================
// JSON PREVIEW PANEL
// ============================================================================

function JsonPreviewPanel({
  json,
  entityType,
}: {
  json: Record<string, unknown> | null
  entityType: EntityType
}) {
  if (!json) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[rgb(var(--text-tertiary))]">
        Select an entity to preview its Ed-Fi JSON output
      </div>
    )
  }

  const jsonString = JSON.stringify(json, null, 2)
  const validation = validateEdFiOutput(json, entityType)
  const passCount = validation.filter((v) => v.status === 'pass').length
  const failCount = validation.filter((v) => v.status === 'fail').length
  const warnCount = validation.filter((v) => v.status === 'warn').length

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString)
    toast.success('JSON copied to clipboard')
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
            {failCount === 0 ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {passCount} pass, {warnCount} warn, {failCount} fail
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={handleCopy} aria-label="Copy JSON to clipboard">
            <Copy className="w-3.5 h-3.5" />
            Copy
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5" onClick={handleDownload} aria-label="Download JSON file">
            <Download className="w-3.5 h-3.5" />
            Download
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
          Validation
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
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerChildren}
        className="space-y-8"
      >
        <SettingsPageHeader
          title="Ed-Fi Export Preview"
          description="Preview and validate Ed-Fi Data Standard JSON output for your education organizations"
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
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    {sea.nameOfInstitution}
                  </p>
                  <p className="text-xs text-[rgb(var(--text-tertiary))]">
                    Singleton — one SEA per tenant
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[rgb(var(--text-tertiary))] py-2">
                No State Education Agency configured yet.
              </p>
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
              Staff export preview will be available from the People module.
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
