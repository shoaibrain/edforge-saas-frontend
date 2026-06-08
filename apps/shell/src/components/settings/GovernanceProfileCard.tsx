/**
 * Governance Profile Card (GF3.4 / GF3.5)
 *
 * Read-only panel that surfaces the *resolved* governance profile for the
 * tenant and the regional defaults the governance body locks. It answers the
 * operator's "why can't I change the currency?" question that the constrained
 * Regional Settings dropdowns below (GF3.2) otherwise leave implicit.
 *
 * The archetype shown is the *resolved* one from `getArchetypeProfile`, not the
 * raw tenant field: a Nepal tenant with a missing/unknown archetype still
 * resolves to PABSON, and that is what the operator sees here. Each locked
 * default is read from the GF3.1 feature matrix (`allowedValuesFor`): a single
 * allowed value renders as a locked chip; `null` (unconstrained) renders as
 * "Operator's choice". Adding a governance body that locks more controls is a
 * data change in the registry — this panel needs no edit.
 *
 * GF3.5 — all operator-facing strings are i18n keys under the `settings`
 * namespace (`workspace.governanceProfile.*`) with English `defaultValue`
 * fallbacks, so the panel reads in `ne` on a Nepali tenant and never renders a
 * bare key if a translation is ever missing.
 */

import { motion } from 'framer-motion'
import { ShieldCheck, Lock } from 'lucide-react'
import { useTranslation } from '@edforge/i18n'
import { getArchetypeProfile, allowedValuesFor } from '@edforge/archetype'

interface GovernanceProfileCardProps {
  archetype: string | null
  country: string | null
}

type Control = 'currency' | 'timezone' | 'calendarSystem'

// English fallbacks — only used if the i18n key is missing (the parity test in
// @edforge/i18n keeps en/ne in lockstep, so in practice the key always resolves).
const ARCHETYPE_LABEL_FALLBACK: Record<string, string> = {
  PABSON: 'PABSON — Private & Boarding Schools, Nepal',
  GENERIC: 'Generic',
}

const CALENDAR_LABEL_FALLBACK: Record<string, string> = {
  gregorian: 'Gregorian',
  bikram_sambat: 'Bikram Sambat (BS)',
}

function GovernanceField({
  label,
  valueText,
  locked,
  lockedLabel,
}: {
  label: string
  valueText: string
  locked: boolean
  lockedLabel: string
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-tertiary))] last:border-b-0">
      <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {locked && (
          <Lock className="w-3 h-3 text-[rgb(var(--text-tertiary))]" aria-label={lockedLabel} />
        )}
        {valueText}
      </span>
    </div>
  )
}

export function GovernanceProfileCard({ archetype, country }: GovernanceProfileCardProps) {
  const { t } = useTranslation('settings')
  const profile = getArchetypeProfile(archetype, country)
  const resolved = profile.archetype

  const archetypeLabel = t(`workspace.governanceProfile.archetype.${resolved}`, {
    defaultValue: ARCHETYPE_LABEL_FALLBACK[resolved] ?? resolved,
  })
  const operatorChoice = t('workspace.governanceProfile.operatorChoice', {
    defaultValue: "Operator's choice",
  })
  const lockedLabel = t('workspace.governanceProfile.locked', {
    defaultValue: 'Locked by governance body',
  })

  const formatValue = (control: Control, raw: string): string =>
    control === 'calendarSystem'
      ? t(`workspace.governanceProfile.calendarValue.${raw}`, {
          defaultValue: CALENDAR_LABEL_FALLBACK[raw] ?? raw,
        })
      : raw

  const valueFor = (control: Control): { locked: boolean; valueText: string } => {
    const allowed = allowedValuesFor(control, archetype, country)
    const locked = allowed !== null && allowed.length === 1
    const valueText = locked
      ? formatValue(control, allowed[0])
      : allowed === null
        ? operatorChoice
        : allowed.map((v) => formatValue(control, v)).join(', ')
    return { locked, valueText }
  }

  const rows: { label: string; control: Control }[] = [
    { label: t('workspace.governanceProfile.currency', { defaultValue: 'Currency' }), control: 'currency' },
    { label: t('workspace.governanceProfile.timezone', { defaultValue: 'Timezone' }), control: 'timezone' },
    { label: t('workspace.governanceProfile.calendar', { defaultValue: 'Calendar' }), control: 'calendarSystem' },
  ]

  return (
    <motion.div variants={fadeInUpFallback}>
      <div
        data-testid="governance-profile-card"
        className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <ShieldCheck className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {t('workspace.governanceProfile.title', { defaultValue: 'Governance Profile' })}
            </h2>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              {t('workspace.governanceProfile.subtitle', {
                defaultValue:
                  'Regional defaults your governance body locks. Set at provisioning, applied tenant-wide.',
              })}
            </p>
          </div>
        </div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-tertiary))]">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
              {t('workspace.governanceProfile.governanceBody', { defaultValue: 'Governance Body' })}
            </span>
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {archetypeLabel}
            </span>
          </div>
          {rows.map(({ label, control }) => {
            const { locked, valueText } = valueFor(control)
            return (
              <GovernanceField
                key={control}
                label={label}
                valueText={valueText}
                locked={locked}
                lockedLabel={lockedLabel}
              />
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// Local fallback variant so the card animates in step with the rest of the
// page's stagger without importing the page's private motion constants.
const fadeInUpFallback = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}
