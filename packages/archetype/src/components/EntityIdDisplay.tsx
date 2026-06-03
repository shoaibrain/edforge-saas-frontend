import { useTranslation } from 'react-i18next'
import { useArchetypeIdentifier } from './useArchetypeIdentifier'
import { UuidBadge } from './UuidBadge'
import type { EntityKind } from '../types'

const SENSITIVE_MASK = '••••••••••••'

export interface EntityIdDisplayProps {
  entity: EntityKind
  data: Record<string, unknown> | null | undefined
  /** `inline` (value only) or `stacked` (label + value + secondary). */
  variant?: 'inline' | 'stacked'
  /**
   * When true AND the resolved identifier is government PII (`sensitive`),
   * mask the value. Wire this to the caller's existing sensitive-data toggle
   * (e.g. ProfileTab's `mask()`); non-sensitive identifiers ignore it.
   */
  masked?: boolean
}

/**
 * Drop-in, governance-aware identifier display. Resolves the right field for
 * the current tenant's archetype (e.g. PABSON student → EMIS id) and renders it
 * per the resolved format: `iemis`/`mono` as styled text, `uuid-short` via
 * `<UuidBadge>`, `plain` as text. Honors masking for sensitive (PII) ids and
 * shows the school-local secondary id (e.g. studentNumber) underneath.
 */
export function EntityIdDisplay({
  entity,
  data,
  variant = 'inline',
  masked = false,
}: EntityIdDisplayProps) {
  const resolved = useArchetypeIdentifier(entity, data)
  const { t } = useTranslation('identifiers')
  const label = t(resolved.labelKey)
  const hidden = masked && resolved.sensitive

  let valueNode
  if (hidden) {
    valueNode = (
      <span className="font-mono" aria-label={t('maskedIdentifier')}>
        {SENSITIVE_MASK}
      </span>
    )
  } else if (resolved.format === 'uuid-short') {
    valueNode = <UuidBadge value={resolved.value} />
  } else if (!resolved.value) {
    valueNode = <span className="text-muted-foreground">—</span>
  } else {
    const cls =
      resolved.format === 'iemis'
        ? 'font-mono font-medium'
        : resolved.format === 'mono'
          ? 'font-mono'
          : ''
    valueNode = <span className={cls}>{resolved.value}</span>
  }

  const secondaryNode =
    resolved.secondary && !hidden ? (
      <span className="text-xs text-muted-foreground" data-testid="entity-id-secondary">
        {resolved.secondary.value}
      </span>
    ) : null

  const ariaLabel = `${label}, ${hidden ? t('hidden') : resolved.value || t('none')}`

  if (variant === 'stacked') {
    return (
      <div data-testid="entity-id-display" aria-label={ariaLabel}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div>{valueNode}</div>
        {secondaryNode}
      </div>
    )
  }

  return (
    <span data-testid="entity-id-display" aria-label={ariaLabel}>
      {valueNode}
      {secondaryNode ? <> {secondaryNode}</> : null}
    </span>
  )
}
