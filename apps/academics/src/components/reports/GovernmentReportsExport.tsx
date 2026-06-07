/**
 * Government Reports — CEHRD IEMIS Flash I/II export surface.
 *
 * Operator flow: pick a template + academic year (BS) → (optional) pre-flight
 * → generate → the snapshot generates server-side (report-aggregator Lambda)
 * → download the presigned CSV → mark "Submitted" after the manual upload to
 * the IEMIS portal. A history table lists prior snapshots for the school.
 *
 * Full-page route (not a modal) mirroring the IEMIS *import* flow — the
 * history table and pre-flight findings can span many rows.
 *
 * Rendered at `/academics/reports/government` (see router.tsx). The IEMIS
 * *export* counterpart to the IEMIS *import* button in the Students module.
 */

import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Send,
} from 'lucide-react'
import { StatusPill } from '@edforge/ui'
import { useActiveSchoolId } from '../../stores/app.store'
import {
  useCreateReportingSnapshot,
  usePreflightReportingSnapshot,
  useReportingSnapshotDownload,
  useReportingSnapshotPoll,
  useReportingSnapshots,
  useTransitionReportingSnapshot,
} from '../../hooks/useReportingSnapshots'
import {
  canDownload,
  canMarkSubmitted,
  isValidBsYear,
  statusLabel,
  statusVariant,
  TEMPLATE_LABELS,
  TEMPLATE_OPTIONS,
  triggerBrowserDownload,
} from './government-reports.helpers'
import type {
  PreflightReportingSnapshotResponse,
  ReportingSnapshot,
  ReportingTemplateId,
} from './government-reports.types'

const cardStyle = {
  background: 'var(--v2-bg-elevated)',
  borderColor: 'var(--v2-border-default)',
} as const

export function GovernmentReportsExport() {
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()

  const [templateId, setTemplateId] = useState<ReportingTemplateId>(
    'IEMIS_NPL_CEHRD_FLASH_I',
  )
  const [academicYearBs, setAcademicYearBs] = useState('')
  const [preflight, setPreflight] = useState<PreflightReportingSnapshotResponse | null>(null)
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)

  const yearValid = isValidBsYear(academicYearBs)

  const snapshotsQuery = useReportingSnapshots({ schoolId })
  const preflightMut = usePreflightReportingSnapshot()
  const createMut = useCreateReportingSnapshot()
  const downloadMut = useReportingSnapshotDownload()
  const transitionMut = useTransitionReportingSnapshot()

  // Poll the just-created snapshot until generation terminates.
  const polled = useReportingSnapshotPoll(schoolId, activeSnapshotId)

  const canGenerate =
    !!schoolId &&
    yearValid &&
    !createMut.isPending &&
    (preflight === null || preflight.canProceed)

  const resetPreflight = () => setPreflight(null)

  async function handlePreflight() {
    if (!schoolId || !yearValid) return
    const result = await preflightMut.mutateAsync({
      templateId,
      academicYearBs: academicYearBs.trim(),
      schoolId,
    })
    setPreflight(result)
  }

  async function handleGenerate() {
    if (!schoolId || !yearValid) return
    const snap = await createMut.mutateAsync({
      templateId,
      academicYearBs: academicYearBs.trim(),
      schoolId,
    })
    setActiveSnapshotId(snap.snapshotId)
    setPreflight(null)
  }

  async function handleDownload(snap: ReportingSnapshot) {
    if (!schoolId) return
    const result = await downloadMut.mutateAsync({
      snapshotId: snap.snapshotId,
      schoolId,
    })
    triggerBrowserDownload(result.url, result.fileName)
  }

  async function handleMarkSubmitted(snap: ReportingSnapshot) {
    if (!schoolId) return
    await transitionMut.mutateAsync({
      snapshotId: snap.snapshotId,
      schoolId,
      nextStatus: 'submitted',
    })
  }

  const snapshots = useMemo(
    () => snapshotsQuery.data?.snapshots ?? [],
    [snapshotsQuery.data],
  )

  // ---- No active school gate ----
  if (!schoolId) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <BackLink onClick={() => navigate({ to: '/' })} />
        <div
          className="rounded-xl border p-8 text-center mt-4"
          style={cardStyle}
        >
          <FileSpreadsheet
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: 'var(--v2-text-tertiary)' }}
          />
          <p style={{ color: 'var(--v2-text-secondary)' }}>
            Select a school to generate government reports.
          </p>
        </div>
      </div>
    )
  }

  const activeSnap = polled.data

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BackLink onClick={() => navigate({ to: '/' })} />

      <header className="mt-3 mb-6">
        <h1
          className="text-xl font-semibold flex items-center gap-2"
          style={{ color: 'var(--v2-text-primary)' }}
        >
          <FileSpreadsheet className="w-5 h-5" style={{ color: 'var(--v2-brand-primary)' }} />
          Government Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--v2-text-secondary)' }}>
          Generate and download CEHRD IEMIS Flash I / Flash II CSVs, then mark
          them submitted after uploading to the IEMIS portal.
        </p>
      </header>

      {/* ---- Generate panel ---- */}
      <section className="rounded-xl border p-5 mb-6" style={cardStyle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
              Report
            </span>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value as ReportingTemplateId)
                resetPreflight()
              }}
              className="px-3 py-2 text-sm rounded-lg border bg-transparent"
              style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-primary)' }}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--v2-text-secondary)' }}>
              Academic year (BS)
            </span>
            <input
              value={academicYearBs}
              onChange={(e) => {
                setAcademicYearBs(e.target.value)
                resetPreflight()
              }}
              inputMode="numeric"
              placeholder="2083"
              aria-label="Academic year in Bikram Sambat"
              className="px-3 py-2 text-sm rounded-lg border bg-transparent"
              style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-primary)' }}
            />
            {academicYearBs.length > 0 && !yearValid && (
              <span className="text-[11px]" style={{ color: 'var(--v2-status-overdue)' }}>
                Enter a 4-digit BS year, e.g. 2083.
              </span>
            )}
          </label>
        </div>

        {preflight && <PreflightSummary preflight={preflight} />}

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handlePreflight}
            disabled={!yearValid || preflightMut.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg border transition-colors hover:opacity-80 disabled:opacity-50"
            style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-secondary)' }}
          >
            {preflightMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            Pre-flight
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--v2-brand-primary)', color: '#fff' }}
          >
            {createMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            Generate report
          </button>
        </div>
      </section>

      {/* ---- Active generation banner ---- */}
      {activeSnap && (
        <ActiveGenerationBanner
          snapshot={activeSnap}
          downloading={downloadMut.isPending}
          onDownload={() => handleDownload(activeSnap)}
          onDismiss={() => setActiveSnapshotId(null)}
        />
      )}

      {/* ---- History ---- */}
      <section className="rounded-xl border" style={cardStyle}>
        <div
          className="px-5 py-3 border-b text-sm font-medium"
          style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-primary)' }}
        >
          Report history
        </div>

        {snapshotsQuery.isLoading ? (
          <div className="px-5 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: 'var(--v2-text-tertiary)' }} />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--v2-text-tertiary)' }}>
            No reports generated yet for this school.
          </div>
        ) : (
          <ul>
            {snapshots.map((snap) => (
              <li
                key={snap.snapshotId}
                className="px-5 py-3 border-b last:border-b-0 flex items-center gap-3 flex-wrap"
                style={{ borderColor: 'var(--v2-border-default)' }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--v2-text-primary)' }}>
                    {TEMPLATE_LABELS[snap.templateId]}{' '}
                    <span style={{ color: 'var(--v2-text-tertiary)' }}>· BS {snap.academicYearBs}</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--v2-text-tertiary)' }}>
                    {typeof snap.rowCount === 'number' ? `${snap.rowCount} rows · ` : ''}
                    {snap.generatedAt
                      ? `generated ${new Date(snap.generatedAt).toLocaleString()}`
                      : `created ${new Date(snap.createdAt).toLocaleString()}`}
                    {snap.dryRun ? ' · dry-run' : ''}
                  </div>
                  {snap.status === 'failed' && snap.errorSummary && (
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--v2-status-overdue)' }}>
                      {snap.errorSummary}
                    </div>
                  )}
                </div>

                <StatusPill variant={statusVariant(snap.status)} label={statusLabel(snap.status)} />

                <div className="flex items-center gap-1.5">
                  {canDownload(snap.status, snap.dryRun) && (
                    <button
                      onClick={() => handleDownload(snap)}
                      disabled={downloadMut.isPending}
                      aria-label="Download CSV"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md border transition-colors hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-secondary)' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV
                    </button>
                  )}
                  {canMarkSubmitted(snap.status, snap.dryRun) && (
                    <button
                      onClick={() => handleMarkSubmitted(snap)}
                      disabled={transitionMut.isPending}
                      aria-label="Mark submitted"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] font-medium rounded-md border transition-colors hover:opacity-80 disabled:opacity-50"
                      style={{ borderColor: 'var(--v2-border-default)', color: 'var(--v2-text-secondary)' }}
                    >
                      <Send className="w-3.5 h-3.5" />
                      Mark submitted
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[13px] transition-colors hover:opacity-80"
      style={{ color: 'var(--v2-text-secondary)' }}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}

function PreflightSummary({ preflight }: { preflight: PreflightReportingSnapshotResponse }) {
  const { errors, warnings, canProceed } = preflight
  return (
    <div
      className="mt-4 rounded-lg border p-3 text-[13px]"
      style={{ borderColor: 'var(--v2-border-default)' }}
    >
      <div className="flex items-center gap-2 font-medium" style={{ color: 'var(--v2-text-primary)' }}>
        {canProceed ? (
          <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--v2-status-paid)' }} />
        ) : (
          <AlertTriangle className="w-4 h-4" style={{ color: 'var(--v2-status-overdue)' }} />
        )}
        {canProceed ? 'Pre-flight passed' : 'Pre-flight blocked'}
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1" style={{ color: 'var(--v2-status-overdue)' }}>
          {errors.map((e, i) => (
            <li key={`e-${i}`}>• {e.field}: {e.error}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="mt-2 space-y-1" style={{ color: 'var(--v2-text-tertiary)' }}>
          {warnings.map((w, i) => (
            <li key={`w-${i}`}>• {w.field}: {w.message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ActiveGenerationBanner({
  snapshot,
  downloading,
  onDownload,
  onDismiss,
}: {
  snapshot: ReportingSnapshot
  downloading: boolean
  onDownload: () => void
  onDismiss: () => void
}) {
  const generating = snapshot.status === 'generating'
  const failed = snapshot.status === 'failed'
  const ready = canDownload(snapshot.status, snapshot.dryRun)

  return (
    <section
      className="rounded-xl border p-4 mb-6 flex items-center gap-3"
      style={cardStyle}
    >
      {generating && <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--v2-brand-primary)' }} />}
      {ready && <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--v2-status-paid)' }} />}
      {failed && <AlertTriangle className="w-5 h-5" style={{ color: 'var(--v2-status-overdue)' }} />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--v2-text-primary)' }}>
          {generating && 'Generating report…'}
          {ready && 'Report ready'}
          {failed && 'Generation failed'}
        </div>
        {failed && snapshot.errorSummary && (
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--v2-status-overdue)' }}>
            {snapshot.errorSummary}
          </div>
        )}
      </div>
      {ready && (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--v2-brand-primary)', color: '#fff' }}
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download CSV
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-[12px] transition-colors hover:opacity-80"
        style={{ color: 'var(--v2-text-tertiary)' }}
      >
        Dismiss
      </button>
    </section>
  )
}
