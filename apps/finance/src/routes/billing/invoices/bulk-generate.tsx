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
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { Button } from '@edforge/ui'
import { usePermission } from '@edforge/abac'
import { useAppStore } from '../../../stores/app.store'
import { BulkInvoiceForm } from '../../../components/billing/BulkInvoiceForm'

export default function BulkInvoicesPage() {
  const navigate = useNavigate()
  const schoolId = useAppStore((s) => s.activeSchoolId)
  // Bulk-generating invoices maps to the backend `billing:create` ABAC action.
  // The API 403s users without it; show an access notice instead of the form.
  const canCreateBilling = usePermission('create', 'billing')

  if (!schoolId) {
    return (
      <div className="p-6 text-center text-sm text-[rgb(var(--text-tertiary))]">
        Select a school to generate bulk invoices.
      </div>
    )
  }

  if (!canCreateBilling) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center gap-3 rounded-2xl border border-[rgb(var(--border-primary))] bg-[rgb(var(--background-primary))] p-8 mt-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[rgb(var(--state-warning-bg)/0.18)]">
            <ShieldAlert className="w-6 h-6 text-[rgb(var(--state-warning-fg))]" />
          </div>
          <h2 className="text-base font-semibold text-[rgb(var(--text-primary))]">
            You don&apos;t have access to bulk-generate invoices
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))] max-w-sm">
            Generating invoices is managed by your principal or school admin.
          </p>
        </div>
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
      <div className="bg-[rgb(var(--background-primary))] border border-[rgb(var(--border-primary))] rounded-xl p-6">
        <BulkInvoiceForm
          schoolId={schoolId}
          onComplete={() => navigate({ to: '/invoices' })}
          onCancel={() => navigate({ to: '/invoices' })}
        />
      </div>
    </div>
  )
}
