/**
 * Connections Step
 *
 * Step 3: Hierarchy connections — SEA, ESC, Parent LEA.
 * Shows a mini visual hierarchy preview.
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Landmark, Building2, MapPin, Network, Info, ArrowDown } from 'lucide-react'
import { Tooltip } from '@edforge/ui'
import type { WizardStepProps } from '@edforge/wizard'
import {
  useStateEducationAgency,
  useEducationServiceCenters,
  useLocalEducationAgencies,
} from '@/hooks/useEducationOrgs'

const selectClass =
  'w-full px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors'
const labelClass = 'block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5'

export function ConnectionsStep({ data, updateData, clearError }: WizardStepProps) {
  const { data: sea } = useStateEducationAgency()
  const { data: escsData } = useEducationServiceCenters()
  const { data: leasData } = useLocalEducationAgencies()

  const escs = escsData?.items || []
  const leas = leasData?.items || []

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateData({ [field]: e.target.value })
      clearError(field)
    }

  const seaName = sea?.nameOfInstitution || 'No SEA configured'
  const districtName = (data.nameOfInstitution as string) || 'New District'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Mini Hierarchy Preview */}
      <div className="p-4 rounded-xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-secondary))]">
        <p className="text-xs font-medium text-[rgb(var(--text-tertiary))] uppercase tracking-wider mb-3">
          Hierarchy Preview
        </p>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Landmark className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{seaName}</span>
          </div>
          <ArrowDown className="w-3.5 h-3.5 text-[rgb(var(--text-tertiary))]" />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-teal-500/10 border-2 border-teal-500 text-teal-600 dark:text-teal-400">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">{districtName}</span>
            <span className="text-[10px] bg-teal-500/20 px-1.5 py-0.5 rounded-full">NEW</span>
          </div>
        </div>
      </div>

      {/* Hierarchy Selectors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Network className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))]">
            Reporting Hierarchy
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className={labelClass}>
              State Education Agency
              <Tooltip content="The SEA this district reports to. Pre-selected if one exists." side="top">
                <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
              </Tooltip>
            </label>
            <select
              value={(data.stateEducationAgencyId as string) || ''}
              onChange={handleChange('stateEducationAgencyId')}
              className={selectClass}
            >
              <option value="">None</option>
              {sea && <option value={sea.id}>{sea.nameOfInstitution}</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Education Service Center</label>
              <select
                value={(data.educationServiceCenterId as string) || ''}
                onChange={handleChange('educationServiceCenterId')}
                className={selectClass}
              >
                <option value="">None</option>
                {escs.map((esc) => (
                  <option key={esc.id} value={esc.id}>
                    {esc.nameOfInstitution}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Parent LEA
                <Tooltip
                  content="Optional. Only needed if this district reports through another district (e.g., charter networks)."
                  side="top"
                >
                  <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
                </Tooltip>
              </label>
              <select
                value={(data.parentLocalEducationAgencyId as string) || ''}
                onChange={handleChange('parentLocalEducationAgencyId')}
                className={selectClass}
              >
                <option value="">None</option>
                {leas.map((lea) => (
                  <option key={lea.id} value={lea.id}>
                    {lea.nameOfInstitution}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
