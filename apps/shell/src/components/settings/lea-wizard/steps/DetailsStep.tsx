/**
 * Details Step
 *
 * Step 2: Name, Ed-Fi ID, short name, website, operational status.
 * Conditionally shows charter status when leaCategoryDescriptor === 'CharterLEA'.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Tooltip } from '@edforge/ui'
import type { WizardStepProps } from '@edforge/wizard'
import {
  OPERATIONAL_STATUS_DESCRIPTORS,
  CHARTER_STATUS_DESCRIPTORS,
} from '@aibrains/shared-types'

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-tertiary))] text-sm text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-colors'
const selectClass = inputClass
const labelClass = 'block text-sm font-medium text-[rgb(var(--text-secondary))] mb-1.5'
const errorClass = 'mt-1 text-xs text-red-500'

export function DetailsStep({ data, updateData, errors, clearError }: WizardStepProps) {
  const isCharter = data.leaCategoryDescriptor === 'CharterLEA'

  const handleChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateData({ [field]: e.target.value })
      clearError(field)
    }

  const handleNumberChange =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      updateData({ [field]: val === '' ? undefined : Number(val) })
      clearError(field)
    }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>
            Ed-Fi ID <span className="text-red-500">*</span>
            <Tooltip
              content="The unique numeric code assigned by the state. If you don't have one, enter any positive integer as a placeholder."
              side="top"
            >
              <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
            </Tooltip>
          </label>
          <input
            type="number"
            value={(data.localEducationAgencyId as number) ?? ''}
            onChange={handleNumberChange('localEducationAgencyId')}
            placeholder="e.g., 101912"
            className={inputClass}
          />
          {errors.localEducationAgencyId && (
            <p className={errorClass}>{errors.localEducationAgencyId}</p>
          )}
        </div>
        <div>
          <label className={labelClass}>
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={(data.nameOfInstitution as string) || ''}
            onChange={handleChange('nameOfInstitution')}
            placeholder="e.g., Austin Independent School District"
            className={inputClass}
          />
          {errors.nameOfInstitution && (
            <p className={errorClass}>{errors.nameOfInstitution}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Short Name</label>
          <input
            type="text"
            value={(data.shortNameOfInstitution as string) || ''}
            onChange={handleChange('shortNameOfInstitution')}
            placeholder="e.g., Austin ISD"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Website</label>
          <input
            type="url"
            value={(data.webSite as string) || ''}
            onChange={handleChange('webSite')}
            placeholder="https://www.austinisd.org"
            className={inputClass}
          />
          {errors.webSite && <p className={errorClass}>{errors.webSite}</p>}
        </div>
      </div>

      <div className={`grid ${isCharter ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        <div className="w-48">
          <label className={labelClass}>
            Operational Status
            <Tooltip
              content="Current operating status of this organization per Ed-Fi standards."
              side="top"
            >
              <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
            </Tooltip>
          </label>
          <select
            value={(data.operationalStatusDescriptor as string) || 'Active'}
            onChange={handleChange('operationalStatusDescriptor')}
            className={selectClass}
          >
            {OPERATIONAL_STATUS_DESCRIPTORS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {isCharter && (
          <div className="w-48">
            <label className={labelClass}>
              Charter Status
              <Tooltip content="Only applies to charter-type organizations." side="top">
                <Info className="inline w-3.5 h-3.5 ml-1 text-[rgb(var(--text-tertiary))] cursor-help align-text-bottom" />
              </Tooltip>
            </label>
            <select
              value={(data.charterStatusDescriptor as string) || ''}
              onChange={handleChange('charterStatusDescriptor')}
              className={selectClass}
            >
              <option value="">Select...</option>
              {CHARTER_STATUS_DESCRIPTORS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </motion.div>
  )
}
