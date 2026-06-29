/**
 * Bulk Invoices Page
 *
 * Admin page for bulk invoice generation.
 * Route: /finance/billing/invoices/bulk-generate
 *
 * Wraps the BulkGenerateWizard component (Sprint C Phase 1 rewrite from
 * the operator-validated prototype; see
 * .claude/plans/finance-module-bulk-mighty-honey.md §5b) with page layout,
 * header, and back navigation. The previous BulkInvoiceForm has been
 * deleted — the new wizard is the wholesale replacement.
 */

import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useTranslation } from '@edforge/i18n'
import { useAppStore } from '../../../stores/app.store'
import { BulkGenerateWizard } from '../../../components/billing/bulk/BulkGenerateWizard'

export default function BulkInvoicesPage() {
  const { t } = useTranslation('payments')
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  // Display-only school code for the invoice-number prefix preview. We
  // read it from the app store if present; otherwise the wizard falls
  // back to "XXX" in the preview.
  const schoolCode = useAppStore((s) => (s as any).activeSchoolCode as string | undefined)

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        {t('bulkGenerate.selectSchool')}
      </div>
    )
  }

  // Layout uses full available width (no max-width cap) so the two-pane
  // wizard + rail consume the operator's screen on standard 1440px+
  // monitors. Operator review feedback (2026-06-28): the previous
  // `max-w-5xl mx-auto` left ~30% of the viewport empty on the right.
  return (
    <div className="p-6 space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={() => navigate({ to: '/invoices' })}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            {t('bulkGenerate.title')}
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            {t('bulkGenerate.description')}
          </p>
        </div>
      </div>

      {/* Wizard */}
      <div className="bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-xl p-6">
        <BulkGenerateWizard
          schoolId={schoolId}
          schoolCode={schoolCode}
          onComplete={() => navigate({ to: '/invoices' })}
          onCancel={() => navigate({ to: '/invoices' })}
        />
      </div>
    </div>
  )
}
