/**
 * IEMIS Code Badge (Sprint 1 S1.11)
 *
 * Compact header chip showing the Nepal IEMIS School Code.
 * - Green-tinted "verified" badge when the code matches
 *   `isValidIemisSchoolCode` (8–10 digits, digits-only)
 * - Neutral / amber chip when the code is present but malformed
 * - Nothing rendered at all when the school has no emisSchoolCode
 *   (non-PABSON tenants — chip is truly optional)
 * - Copy-to-clipboard button + tooltip explaining CEHRD
 */

import { useState } from 'react'
import { Check, Copy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Local IEMIS School Code format check (Sprint 1 S1.1 intent).
 *
 * Once `@aibrains/shared-types` publishes with `isValidIemisSchoolCode`
 * exported (next minor bump after 0.30.0), replace this with the
 * canonical import. Duplicated here so this component doesn't block
 * on the shared-types publish window. Behavior must stay identical:
 * ASCII digits only, length 8–10.
 */
const IEMIS_SCHOOL_CODE_REGEX = /^\d{8,10}$/
function isValidIemisSchoolCode(code: unknown): code is string {
  return typeof code === 'string' && IEMIS_SCHOOL_CODE_REGEX.test(code)
}

interface IemisCodeBadgeProps {
  code?: string | null
  className?: string
}

export function IemisCodeBadge({ code, className }: IemisCodeBadgeProps) {
  const [hovering, setHovering] = useState(false)

  if (!code) return null

  const valid = isValidIemisSchoolCode(code)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(code)
      toast.success('IEMIS School Code copied')
    } catch {
      toast.error('Could not copy — select and copy manually')
    }
  }

  const toneClasses = valid
    ? 'border-[rgba(29,158,117,0.35)] bg-[rgba(29,158,117,0.12)] text-[#1D9E75]'
    : 'border-[rgba(239,159,39,0.35)] bg-[rgba(239,159,39,0.12)] text-[#EF9F27]'

  const tooltipText = valid
    ? `Verified Nepal IEMIS School Code (CEHRD). Format: 8–10 digits issued by your local municipality.`
    : `This IEMIS School Code does not match the expected 8–10 digit format. Contact EdForge support to correct it — the field is immutable after save.`

  return (
    <span
      data-testid="iemis-code-badge"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={[
        'relative inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border',
        toneClasses,
        className ?? '',
      ].join(' ')}
    >
      {valid ? (
        <Check className="w-3 h-3" aria-hidden />
      ) : (
        <AlertCircle className="w-3 h-3" aria-hidden />
      )}
      <span className="tabular-nums">IEMIS&nbsp;{code}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded hover:bg-[rgba(255,255,255,0.15)] transition-colors"
        aria-label="Copy IEMIS School Code"
      >
        <Copy className="w-2.5 h-2.5" aria-hidden />
      </button>

      {hovering && (
        <span
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-md border border-[rgb(var(--border-primary))] bg-[rgb(var(--surface-primary))] px-3 py-2 text-[11px] font-normal leading-relaxed text-[rgb(var(--text-secondary))] shadow-lg"
        >
          {tooltipText}
        </span>
      )}
    </span>
  )
}
