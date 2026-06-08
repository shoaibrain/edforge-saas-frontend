/**
 * Ed-Fi Preview Panel
 *
 * Collapsible panel showing real-time Ed-Fi JSON preview for education organization entities.
 * Uses the toEdFiSchool() mapper on watched form data to generate live preview.
 */

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Copy, Check, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { CreateSchoolDto, SchoolResponseDto } from '@aibrains/shared-types'
import { toEdFiSchool } from '@aibrains/shared-types'

// ============================================================================
// TYPES
// ============================================================================

interface EdFiPreviewProps {
  /** Current form data (partial — may have unfilled fields) */
  formData: Partial<CreateSchoolDto>
}

type ValidationLevel = 'valid' | 'partial' | 'minimal'

// ============================================================================
// JSON SYNTAX HIGHLIGHTING
// ============================================================================

function highlightJson(json: string): string {
  return json
    // String values (after colon)
    .replace(/"([^"]+)"(\s*:)/g, '<span class="text-[rgb(var(--text-primary))]">"$1"</span>$2')
    // String values
    .replace(/:\s*"([^"]+)"/g, ': <span class="text-[rgb(var(--action-secondary-fg))] ">"$1"</span>')
    // Numbers
    .replace(/:\s*(\d+)/g, ': <span class="text-amber-600 dark:text-amber-400">$1</span>')
    // Booleans & null
    .replace(/:\s*(true|false|null)/g, ': <span class="text-[rgb(var(--state-info-fg))] ">$1</span>')
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EdFiPreview({ formData }: EdFiPreviewProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Build a mock SchoolResponseDto from the partial form data
  const edfiJson = useMemo(() => {
    try {
      const mockResponse: SchoolResponseDto = {
        schoolId: '00000000-0000-0000-0000-000000000000',
        schoolCode: formData.schoolCode || 'DRAFT',
        name: formData.name || 'Draft School',
        shortName: formData.shortName,
        schoolType: formData.schoolType || 'high',
        gradeRange: formData.gradeRange || { start: '9', end: '12' },
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        principalName: formData.principalName,
        principalEmail: formData.principalEmail,
        status: 'active',
        timezone: formData.timezone || 'America/Chicago',
        locale: formData.locale || 'en-US',
        academicCalendarType: formData.academicCalendarType || 'semester',
        calendarSystem: formData.calendarSystem || 'gregorian',
        localEducationAgencyId: formData.localEducationAgencyId,
        schoolCategories: formData.schoolCategories,
        schoolTypeDescriptor: formData.schoolTypeDescriptor,
        gradeLevels: formData.gradeLevels,
        charterStatusDescriptor: formData.charterStatusDescriptor,
        administrativeFundingControlDescriptor: formData.administrativeFundingControlDescriptor,
        titleIPartASchoolDesignationDescriptor: formData.titleIPartASchoolDesignationDescriptor,
        identificationCodes: formData.identificationCodes,
        institutionTelephones: formData.institutionTelephones,
        accountabilityRatings: formData.accountabilityRatings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const edfi = toEdFiSchool(mockResponse)
      // Remove the _ext field for cleaner preview
      const { _ext, ...cleanEdfi } = edfi
      return JSON.stringify(cleanEdfi, null, 2)
    } catch {
      return '{ "error": "Unable to generate preview" }'
    }
  }, [formData])

  // Assess completeness
  const validation = useMemo((): { level: ValidationLevel; message: string; filled: number; total: number } => {
    const checks = [
      !!formData.name,
      !!formData.schoolCode,
      !!formData.schoolType,
      formData.schoolCategories && formData.schoolCategories.length > 0,
      formData.gradeLevels && formData.gradeLevels.length > 0,
      formData.identificationCodes && formData.identificationCodes.length > 0,
      !!formData.address,
      formData.institutionTelephones && formData.institutionTelephones.length > 0,
    ]
    const filled = checks.filter(Boolean).length
    const total = checks.length

    if (filled >= 6) return { level: 'valid', message: 'Good Ed-Fi compliance', filled, total }
    if (filled >= 3) return { level: 'partial', message: 'Partial compliance — add more fields', filled, total }
    return { level: 'minimal', message: 'Minimal data — fill basic fields first', filled, total }
  }, [formData])

  const validationColors = {
    valid: 'text-[rgb(var(--state-success-fg))]  bg-[rgb(var(--state-success-bg)/0.18)] border-[rgb(var(--state-success-border)/0.35)]',
    partial: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    minimal: 'text-[rgb(var(--text-tertiary))] dark:text-[rgb(var(--text-tertiary))] bg-[rgb(var(--background-tertiary))]0/10 border-[rgb(var(--border-secondary))]',
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(edfiJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-secure contexts
    }
  }

  return (
    <div className="rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-secondary))] overflow-hidden">
      {/* Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[rgb(var(--background-tertiary))]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[rgb(var(--state-info-bg)/0.18)] flex items-center justify-center">
            <span className="text-sm font-mono font-bold text-[rgb(var(--state-info-fg))] ">{'{}'}</span>
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-[rgb(var(--text-primary))]">Ed-Fi JSON Preview</h4>
            <p className="text-xs text-[rgb(var(--text-tertiary))]">Real-time Ed-Fi Data Standard output</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Validation badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${validationColors[validation.level]}`}>
            {validation.level === 'valid' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {validation.filled}/{validation.total} fields
          </span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-[rgb(var(--text-tertiary))]" />
          </motion.div>
        </div>
      </button>

      {/* Preview Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-[rgb(var(--border-primary))]">
              {/* Toolbar */}
              <div className="flex items-center justify-between py-3">
                <p className={`text-xs font-medium ${
                  validation.level === 'valid' ? 'text-[rgb(var(--state-success-fg))] ' :
                  validation.level === 'partial' ? 'text-amber-600 dark:text-amber-400' :
                  'text-[rgb(var(--text-tertiary))]'
                }`}>
                  {validation.message}
                </p>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--background-tertiary))] transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[rgb(var(--state-success-fg))]" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>

              {/* JSON display */}
              <div className="rounded-xl bg-[rgb(var(--background-tertiary))] border border-[rgb(var(--border-primary))] overflow-hidden">
                <pre
                  className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-96 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: highlightJson(edfiJson) }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
