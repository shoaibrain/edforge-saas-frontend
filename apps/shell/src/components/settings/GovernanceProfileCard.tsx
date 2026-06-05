/**
 * Governance Profile Card (GF3.4)
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
 */

import { motion } from 'framer-motion'
import { ShieldCheck, Lock } from 'lucide-react'
import { getArchetypeProfile, allowedValuesFor } from '@edforge/archetype'

interface GovernanceProfileCardProps {
  archetype: string | null
  country: string | null
}

const ARCHETYPE_LABELS: Record<string, string> = {
  PABSON: 'PABSON — Private & Boarding Schools, Nepal',
  GENERIC: 'Generic',
}

const CALENDAR_LABELS: Record<string, string> = {
  gregorian: 'Gregorian',
  bikram_sambat: 'Bikram Sambat (BS)',
}

function displayValue(control: 'currency' | 'timezone' | 'calendarSystem', raw: string): string {
  if (control === 'calendarSystem') return CALENDAR_LABELS[raw] ?? raw
  return raw
}

function GovernanceField({
  label,
  control,
  archetype,
  country,
}: {
  label: string
  control: 'currency' | 'timezone' | 'calendarSystem'
  archetype: string | null
  country: string | null
}) {
  const allowed = allowedValuesFor(control, archetype, country)
  const locked = allowed !== null && allowed.length === 1
  const valueText = locked
    ? displayValue(control, allowed[0])
    : allowed === null
      ? "Operator's choice"
      : allowed.map((v) => displayValue(control, v)).join(', ')

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-tertiary))] last:border-b-0">
      <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
        {label}
      </span>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[rgb(var(--text-primary))]">
        {locked && (
          <Lock
            className="w-3 h-3 text-[rgb(var(--text-tertiary))]"
            aria-label="Locked by governance body"
          />
        )}
        {valueText}
      </span>
    </div>
  )
}

export function GovernanceProfileCard({ archetype, country }: GovernanceProfileCardProps) {
  const profile = getArchetypeProfile(archetype, country)
  const resolved = profile.archetype
  const archetypeLabel = ARCHETYPE_LABELS[resolved] ?? resolved

  return (
    <motion.div variants={fadeInUpFallback}>
      <div
        data-testid="governance-profile-card"
        className="rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))] p-4"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-[rgb(var(--surface-tertiary))]">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Governance Profile
            </h2>
            <p className="text-xs text-[rgb(var(--text-tertiary))] mt-0.5">
              Regional defaults your governance body locks. Set at provisioning, applied tenant-wide.
            </p>
          </div>
        </div>
        <div className="space-y-0">
          <div className="flex items-center justify-between py-2.5 border-b border-[rgb(var(--border-tertiary))]">
            <span className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wide">
              Governance Body
            </span>
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              {archetypeLabel}
            </span>
          </div>
          <GovernanceField label="Currency" control="currency" archetype={archetype} country={country} />
          <GovernanceField label="Timezone" control="timezone" archetype={archetype} country={country} />
          <GovernanceField label="Calendar" control="calendarSystem" archetype={archetype} country={country} />
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
