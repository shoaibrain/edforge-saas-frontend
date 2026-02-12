/**
 * Review Step
 *
 * Step 4: Summary of all fields before submission.
 */

import { motion } from 'framer-motion'
import { Building2, Network, Tag, CheckCircle2 } from 'lucide-react'
import type { WizardStepProps } from '@edforge/wizard'
import {
  LEA_CATEGORY_DESCRIPTORS,
  OPERATIONAL_STATUS_DESCRIPTORS,
  CHARTER_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'
import {
  useStateEducationAgency,
  useEducationServiceCenters,
  useLocalEducationAgencies,
} from '@/hooks/useEducationOrgs'

function ReviewRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start py-1.5">
      <span className="text-xs text-[rgb(var(--text-tertiary))]">{label}</span>
      <span className="text-sm font-medium text-[rgb(var(--text-primary))] text-right max-w-[60%]">
        {value}
      </span>
    </div>
  )
}

function findLabel(descriptors: readonly { value: string; label: string }[], value?: string) {
  if (!value) return undefined
  return descriptors.find((d) => d.value === value)?.label || value
}

export function ReviewStep({ data }: WizardStepProps) {
  const { data: sea } = useStateEducationAgency()
  const { data: escsData } = useEducationServiceCenters()
  const { data: leasData } = useLocalEducationAgencies()

  const escs = escsData?.items || []
  const leas = leasData?.items || []

  const seaId = data.stateEducationAgencyId as string
  const escId = data.educationServiceCenterId as string
  const parentLeaId = data.parentLocalEducationAgencyId as string

  const seaName = seaId && sea?.id === seaId ? sea.nameOfInstitution : undefined
  const escName = escId ? escs.find((e) => e.id === escId)?.nameOfInstitution : undefined
  const parentLeaName = parentLeaId
    ? leas.find((l) => l.id === parentLeaId)?.nameOfInstitution
    : undefined

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
        <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
        <p className="text-sm text-[rgb(var(--text-secondary))]">
          Review the details below, then click <strong>Create District</strong> to finish.
        </p>
      </div>

      {/* Organization Details */}
      <div className="rounded-xl border border-[rgb(var(--border-primary))] divide-y divide-[rgb(var(--border-primary))]">
        <div className="px-4 py-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Organization Details
          </span>
        </div>
        <div className="px-4 py-2 space-y-0.5">
          <ReviewRow label="Name" value={data.nameOfInstitution as string} />
          <ReviewRow label="Short Name" value={data.shortNameOfInstitution as string} />
          <ReviewRow label="Ed-Fi ID" value={data.localEducationAgencyId as number} />
          <ReviewRow label="Website" value={data.webSite as string} />
          <ReviewRow
            label="LEA Category"
            value={findLabel(LEA_CATEGORY_DESCRIPTORS, data.leaCategoryDescriptor as string)}
          />
          <ReviewRow
            label="Operational Status"
            value={findLabel(
              OPERATIONAL_STATUS_DESCRIPTORS,
              data.operationalStatusDescriptor as string,
            )}
          />
          {data.charterStatusDescriptor && (
            <ReviewRow
              label="Charter Status"
              value={findLabel(
                CHARTER_STATUS_DESCRIPTORS,
                data.charterStatusDescriptor as string,
              )}
            />
          )}
        </div>
      </div>

      {/* Hierarchy */}
      {(seaName || escName || parentLeaName) && (
        <div className="rounded-xl border border-[rgb(var(--border-primary))] divide-y divide-[rgb(var(--border-primary))]">
          <div className="px-4 py-3 flex items-center gap-2">
            <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
            <span className="text-sm font-semibold text-[rgb(var(--text-primary))]">
              Hierarchy
            </span>
          </div>
          <div className="px-4 py-2 space-y-0.5">
            <ReviewRow label="State Education Agency" value={seaName} />
            <ReviewRow label="Education Service Center" value={escName} />
            <ReviewRow label="Parent LEA" value={parentLeaName} />
          </div>
        </div>
      )}
    </motion.div>
  )
}
