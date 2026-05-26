/**
 * Bulk Invoices Page
 *
 * Admin page for bulk invoice generation.
 * Route: /finance/billing/invoices/bulk-generate
 *
 * Wraps the BulkInvoiceForm component with page layout,
 * header, and back navigation.
 */

import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@edforge/ui'
import { useAppStore } from '../../../stores/app.store'
import { BulkInvoiceForm } from '../../../components/billing/BulkInvoiceForm'

export default function BulkInvoicesPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to generate bulk invoices.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
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
            Bulk Generate Invoices
          </h1>
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            Generate invoices for multiple students at once.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-[rgb(var(--surface-primary))] border border-[rgb(var(--border-primary))] rounded-xl p-6">
        <BulkInvoiceForm
          schoolId={schoolId}
          onComplete={() => navigate({ to: '/invoices' })}
          onCancel={() => navigate({ to: '/invoices' })}
        />
      </div>
    </div>
  )
}
