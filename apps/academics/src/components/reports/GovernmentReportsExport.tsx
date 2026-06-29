/**
 * Government Reports — CEHRD IEMIS Flash I/II export surface.
 *
 * Operator flow: pick a template + academic year → (optional) validate →
 * generate → the snapshot generates server-side (report-aggregator Lambda) →
 * download the presigned CSV → upload it to the IEMIS portal → mark
 * "Submitted", then "Verified" once CEHRD acknowledges it. A history table
 * lists prior snapshots for the school.
 *
 * Full-page route (not a modal) mirroring the IEMIS *import* flow — the
 * history table and validation findings can span many rows.
 *
 * Rendered at `/academics/reports/government` (see router.tsx). The IEMIS
 * *export* counterpart to the IEMIS *import* button in the Students module.
 */

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { StatusPill } from '@edforge/ui'
import { useActiveSchoolId } from '../../stores/app.store'
import { useAcademicYears, useSchoolProfile } from '../../hooks/useSchool'
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
  canMarkVerified,
  canRetry,
  extractBsYear,
  findExistingReport,
  groupSnapshotsByYear,
  isEmptyReport,
  isStalledGenerating,
  isValidBsYear,
  statusVariant,
  TEMPLATE_OPTIONS,
  triggerBrowserDownload,
} from './government-reports.helpers'
import { useAcademicsI18n } from '../../lib/i18n'
import type {
  PreflightReportingSnapshotResponse,
  ReportingSnapshot,
  ReportingTemplateId,
} from './government-reports.types'

const cardStyle = {
  background: 'rgb(var(--background-tertiary))',
  borderColor: 'rgb(var(--border-primary) / 0.35)',
} as const

const IEMIS_PORTAL_URL = 'https://emis.cehrd.gov.np'

export function GovernmentReportsExport() {
  const { t, formatDateTime, formatCount } = useAcademicsI18n()
  const navigate = useNavigate()
  const schoolId = useActiveSchoolId()

  // ---- hooks (all unconditional — before any early return) ----
  const profileQuery = useSchoolProfile(schoolId)
  const academicYearsQuery = useAcademicYears(schoolId ?? '', !!schoolId)

  const [templateId, setTemplateId] = useState<ReportingTemplateId>(
    'IEMIS_NPL_CEHRD_FLASH_I',
  )
  const [academicYearBs, setAcademicYearBs] = useState('')
  const [preflight, setPreflight] = useState<PreflightReportingSnapshotResponse | null>(null)
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null)
  const [templateFilter, setTemplateFilter] = useState<'ALL' | ReportingTemplateId>('ALL')

  const snapshotsQuery = useReportingSnapshots({ schoolId })
  const preflightMut = usePreflightReportingSnapshot()
  const createMut = useCreateReportingSnapshot()
  const downloadMut = useReportingSnapshotDownload()
  const transitionMut = useTransitionReportingSnapshot()
  const polled = useReportingSnapshotPoll(schoolId, activeSnapshotId)

  // Academic-year options derived from the school's real years (PABSON years
  // carry the BS year in their name). Falls back to manual entry if none parse.
  const yearOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const ay of academicYearsQuery.data ?? []) {
      const bs = extractBsYear(ay.name)
      if (!bs || seen.has(bs)) continue
      seen.add(bs)
      opts.push({
        value: bs,
        label: ay.isCurrent
          ? t('governmentReports.year.currentOption', { yearName: ay.name })
          : ay.name,
      })
    }
    return opts
  }, [academicYearsQuery.data, t])

  const useYearDropdown = yearOptions.length > 0

  // Default to the current academic year (or the newest parseable one) once
  // the list loads, so the operator rarely has to touch the picker.
  useEffect(() => {
    if (academicYearBs || yearOptions.length === 0) return
    const current = (academicYearsQuery.data ?? []).find((ay) => ay.isCurrent)
    const currentBs = current ? extractBsYear(current.name) : null
    setAcademicYearBs(currentBs ?? yearOptions[0].value)
  }, [yearOptions, academicYearBs, academicYearsQuery.data])

  const yearValid = isValidBsYear(academicYearBs)
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
    const result = await downloadMut.mutateAsync({ snapshotId: snap.snapshotId, schoolId })
    triggerBrowserDownload(result.url, result.fileName)
  }

  async function handleTransition(
    snap: ReportingSnapshot,
    nextStatus: 'submitted' | 'verified',
  ) {
    if (!schoolId) return
    await transitionMut.mutateAsync({ snapshotId: snap.snapshotId, schoolId, nextStatus })
  }

  async function handleRetry(snap: ReportingSnapshot) {
    if (!schoolId) return
    const next = await createMut.mutateAsync({
      templateId: snap.templateId,
      academicYearBs: snap.academicYearBs,
      schoolId,
    })
    setActiveSnapshotId(next.snapshotId)
  }

  const snapshots = useMemo(
    () => snapshotsQuery.data?.snapshots ?? [],
    [snapshotsQuery.data],
  )

  const groupedHistory = useMemo(() => {
    const filtered =
      templateFilter === 'ALL'
        ? snapshots
        : snapshots.filter((s) => s.templateId === templateFilter)
    return groupSnapshotsByYear(filtered)
  }, [snapshots, templateFilter])

  // Non-blocking heads-up: a report for this template + year already exists.
  const existingReport = useMemo(
    () =>
      yearValid
        ? findExistingReport(snapshots, templateId, academicYearBs.trim())
        : undefined,
    [snapshots, templateId, academicYearBs, yearValid],
  )

  // ---- gate: no active school ----
  if (!schoolId) {
    return (
      <PageShell onBack={() => navigate({ to: '/' })}>
        <EmptyCard>{t('governmentReports.noSchool')}</EmptyCard>
      </PageShell>
    )
  }

  // ---- gate: school profile still loading ----
  if (profileQuery.isLoading) {
    return (
      <PageShell onBack={() => navigate({ to: '/' })}>
        <div className="rounded-xl border p-8 text-center" style={cardStyle}>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-[rgb(var(--text-tertiary))]" />
        </div>
      </PageShell>
    )
  }

  // ---- gate: school has no IEMIS code → cannot produce a valid Flash CSV ----
  if (!profileQuery.data?.emisSchoolCode) {
    return (
      <PageShell onBack={() => navigate({ to: '/' })}>
        <div className="rounded-xl border p-8" style={cardStyle}>
          <AlertTriangle className="w-7 h-7 mb-3 text-[rgb(var(--state-warning-fg))]" />
          <h2 className="text-base font-semibold mb-1 text-[rgb(var(--text-primary))]">
            {t('governmentReports.noIemisCode.title')}
          </h2>
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            {t('governmentReports.noIemisCode.beforeCode')}{' '}
            <code>school_iemis_code</code>{' '}
            {t('governmentReports.noIemisCode.afterCode')}
          </p>
        </div>
      </PageShell>
    )
  }

  const school = profileQuery.data
  const activeSnap = polled.data

  return (
    <PageShell onBack={() => navigate({ to: '/' })}>
      <header className="mb-6">
        <h1 className="text-xl font-semibold flex items-center gap-2 text-[rgb(var(--text-primary))]">
          <FileSpreadsheet className="w-5 h-5 text-[rgb(var(--accent-enrollment-text))]" />
          {t('governmentReports.title')}
        </h1>
        <p className="text-sm mt-1 text-[rgb(var(--text-secondary))]">
          {t('governmentReports.descriptionPrefix')}{' '}
          <span className="text-[rgb(var(--text-primary))]">{school.name}</span>{' '}
          <span className="text-[rgb(var(--text-tertiary))]">
            · {t('governmentReports.iemisCode', { code: school.emisSchoolCode })}
          </span>.
        </p>
      </header>

      {/* ---- Generate panel ---- */}
      <section className="rounded-xl border p-5 mb-6" style={cardStyle}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              {t('governmentReports.fields.report')}
            </span>
            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value as ReportingTemplateId)
                resetPreflight()
              }}
              className="px-3 py-2 text-sm rounded-lg border bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-primary))]"
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(`governmentReports.templates.${opt.value}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[rgb(var(--text-secondary))]">
              {t('governmentReports.fields.academicYearBs')}
            </span>
            {useYearDropdown ? (
              <select
                value={academicYearBs}
                onChange={(e) => {
                  setAcademicYearBs(e.target.value)
                  resetPreflight()
                }}
                className="px-3 py-2 text-sm rounded-lg border bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-primary))]"
              >
                {yearOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  value={academicYearBs}
                  onChange={(e) => {
                    setAcademicYearBs(e.target.value)
                    resetPreflight()
                  }}
                  inputMode="numeric"
                  placeholder="2083"
                  aria-label={t('governmentReports.fields.academicYearAria')}
                  className="px-3 py-2 text-sm rounded-lg border bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-primary))]"
                />
                {academicYearBs.length > 0 && !yearValid && (
                  <span className="text-xs text-[rgb(var(--state-danger-fg))]">
                    {t('governmentReports.validation.invalidBsYear')}
                  </span>
                )}
              </>
            )}
          </label>
        </div>

        {templateId === 'IEMIS_NPL_CEHRD_FLASH_II' && (
          <div className="mt-4 rounded-lg border p-3 text-xs flex items-start gap-2 border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-[rgb(var(--state-warning-fg))]" />
            <span>
              {t('governmentReports.flashIi.beforeExam')}{' '}
              <strong>{t('governmentReports.flashIi.examMarks')}</strong>{' '}
              {t('governmentReports.flashIi.and')}{' '}
              <strong>{t('governmentReports.flashIi.gpa')}</strong>{' '}
              {t('governmentReports.flashIi.afterGpa')}
            </span>
          </div>
        )}

        {preflight && <PreflightSummary preflight={preflight} />}

        {existingReport && (
          <div className="mt-3 text-xs flex items-start gap-2 text-[rgb(var(--text-tertiary))]">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              {t('governmentReports.existingReport', {
                template: t(`governmentReports.templates.${templateId}`),
                year: academicYearBs,
                status: t(`governmentReports.status.${existingReport.status}`),
              })}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handlePreflight}
            disabled={!yearValid || preflightMut.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors hover:opacity-80 disabled:opacity-50 border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
          >
            {preflightMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Info className="w-4 h-4" />
            )}
            {t('governmentReports.actions.validate')}
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
          >
            {createMut.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {t('governmentReports.actions.generate')}
          </button>
        </div>
      </section>

      {/* ---- Active generation banner ---- */}
      {activeSnap && (
        <ActiveGenerationBanner
          snapshot={activeSnap}
          stalled={isStalledGenerating(activeSnap)}
          refreshing={polled.isFetching}
          downloading={downloadMut.isPending}
          onDownload={() => handleDownload(activeSnap)}
          onRefresh={() => polled.refetch()}
          onDismiss={() => setActiveSnapshotId(null)}
        />
      )}

      {/* ---- History ---- */}
      <section className="rounded-xl border" style={cardStyle}>
        <div className="px-5 py-3 border-b flex items-center justify-between gap-3 flex-wrap border-[rgb(var(--border-primary)/0.35)]">
          <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
            {t('governmentReports.history.title')}
          </span>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label={t('governmentReports.history.filterAria')}
          >
            {([
              { value: 'ALL', label: t('governmentReports.history.filters.all') },
              { value: 'IEMIS_NPL_CEHRD_FLASH_I', label: t('governmentReports.history.filters.flashI') },
              { value: 'IEMIS_NPL_CEHRD_FLASH_II', label: t('governmentReports.history.filters.flashII') },
            ] as const).map((opt) => {
              const active = templateFilter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => setTemplateFilter(opt.value)}
                  aria-pressed={active}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                    active
                      ? 'bg-[rgb(var(--accent-enrollment))] border-[rgb(var(--accent-enrollment))] text-[rgb(var(--action-primary-fg))]'
                      : 'bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {snapshotsQuery.isLoading ? (
          <div className="px-5 py-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-[rgb(var(--text-tertiary))]" />
          </div>
        ) : groupedHistory.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-[rgb(var(--text-tertiary))]">
            {snapshots.length === 0
              ? t('governmentReports.history.empty')
              : t('governmentReports.history.emptyFilter')}
          </div>
        ) : (
          groupedHistory.map((group) => (
            <div key={group.year}>
              <div className="px-5 py-1.5 text-xs font-semibold uppercase tracking-wide border-b bg-transparent border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]">
                {t('governmentReports.year.bs', { year: group.year })}
              </div>
              <ul>
                {group.items.map((snap) => (
                  <li
                    key={snap.snapshotId}
                    className="px-5 py-3 border-b last:border-b-0 flex items-center gap-3 flex-wrap border-[rgb(var(--border-primary)/0.35)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate text-[rgb(var(--text-primary))]">
                        {t(`governmentReports.templates.${snap.templateId}`)}
                      </div>
                      <div className="text-xs mt-0.5 text-[rgb(var(--text-tertiary))]">
                        {typeof snap.rowCount === 'number'
                          ? formatCount('governmentReports.history.rowsPrefix', snap.rowCount)
                          : ''}
                        {snap.generatedAt
                          ? t('governmentReports.history.generated', {
                              dateTime: formatDateTime(snap.generatedAt),
                            })
                          : t('governmentReports.history.created', {
                              dateTime: formatDateTime(snap.createdAt),
                            })}
                        {snap.dryRun ? t('governmentReports.history.dryRunSuffix') : ''}
                      </div>
                      {snap.status === 'failed' && snap.errorSummary && (
                        <div className="text-xs mt-0.5 text-[rgb(var(--state-danger-fg))]">
                          {snap.errorSummary}
                        </div>
                      )}
                    </div>

                    <StatusPill
                      variant={statusVariant(snap.status)}
                      label={t(`governmentReports.status.${snap.status}`)}
                    />

                    <div className="flex items-center gap-1.5">
                      {canDownload(snap.status, snap.dryRun) && (
                        <RowButton
                          onClick={() => handleDownload(snap)}
                          disabled={downloadMut.isPending}
                          ariaLabel={t('governmentReports.actions.downloadCsv')}
                          icon={<Download className="w-3.5 h-3.5" />}
                          label={t('governmentReports.actions.csv')}
                        />
                      )}
                      {canRetry(snap.status) && (
                        <RowButton
                          onClick={() => handleRetry(snap)}
                          disabled={createMut.isPending}
                          ariaLabel={t('governmentReports.actions.retryGeneration')}
                          icon={<RefreshCw className="w-3.5 h-3.5" />}
                          label={t('governmentReports.actions.retry')}
                        />
                      )}
                      {canMarkSubmitted(snap.status, snap.dryRun) && (
                        <RowButton
                          onClick={() => handleTransition(snap, 'submitted')}
                          disabled={transitionMut.isPending}
                          ariaLabel={t('governmentReports.actions.markSubmitted')}
                          icon={<Send className="w-3.5 h-3.5" />}
                          label={t('governmentReports.actions.markSubmitted')}
                        />
                      )}
                      {canMarkVerified(snap.status, snap.dryRun) && (
                        <RowButton
                          onClick={() => handleTransition(snap, 'verified')}
                          disabled={transitionMut.isPending}
                          ariaLabel={t('governmentReports.actions.markVerified')}
                          icon={<ShieldCheck className="w-3.5 h-3.5" />}
                          label={t('governmentReports.actions.markVerified')}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}

        {/* ---- Operator guidance: the manual portal step ---- */}
        <div className="px-5 py-3 border-t text-xs flex items-start gap-2 border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-tertiary))]">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {t('governmentReports.guidance.beforeLink')}{' '}
            <a
              href={IEMIS_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[rgb(var(--accent-enrollment-text))]"
            >
              emis.cehrd.gov.np
            </a>
            {t('governmentReports.guidance.afterLink')}{' '}
            <strong>{t('governmentReports.status.submitted')}</strong>{' '}
            {t('governmentReports.guidance.and')}{' '}
            <strong>{t('governmentReports.status.verified')}</strong>{' '}
            {t('governmentReports.guidance.afterVerified')}
          </span>
        </div>
      </section>
    </PageShell>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function PageShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  const { t } = useAcademicsI18n()
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-80 mb-3 text-[rgb(var(--text-secondary))]"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('governmentReports.actions.back')}
      </button>
      {children}
    </div>
  )
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-8 text-center" style={cardStyle}>
      <FileSpreadsheet className="w-8 h-8 mx-auto mb-3 text-[rgb(var(--text-tertiary))]" />
      <p className="text-[rgb(var(--text-secondary))]">{children}</p>
    </div>
  )
}

function RowButton({
  onClick,
  disabled,
  ariaLabel,
  icon,
  label,
}: {
  onClick: () => void
  disabled?: boolean
  ariaLabel: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors hover:opacity-80 disabled:opacity-50 border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
    >
      {icon}
      {label}
    </button>
  )
}

function PreflightSummary({ preflight }: { preflight: PreflightReportingSnapshotResponse }) {
  const { t } = useAcademicsI18n()
  const { errors, warnings, canProceed } = preflight
  return (
    <div className="mt-4 rounded-lg border p-3 text-sm border-[rgb(var(--border-primary)/0.35)]">
      <div className="flex items-center gap-2 font-medium text-[rgb(var(--text-primary))]">
        {canProceed ? (
          <CheckCircle2 className="w-4 h-4 text-[rgb(var(--state-success-fg))]" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-[rgb(var(--state-danger-fg))]" />
        )}
        {canProceed
          ? t('governmentReports.preflight.passed')
          : t('governmentReports.preflight.blocked')}
      </div>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-[rgb(var(--state-danger-fg))]">
          {errors.map((e, i) => (
            <li key={`e-${i}`}>• {e.field}: {e.error}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="mt-2 space-y-1 text-[rgb(var(--text-tertiary))]">
          {warnings.map((w, i) => (
            <li key={`w-${i}`}>• {w.field}: {w.message}</li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-xs text-[rgb(var(--text-tertiary))]">
        {t('governmentReports.preflight.description')}
      </div>
    </div>
  )
}

function ActiveGenerationBanner({
  snapshot,
  stalled,
  refreshing,
  downloading,
  onDownload,
  onRefresh,
  onDismiss,
}: {
  snapshot: ReportingSnapshot
  stalled: boolean
  refreshing: boolean
  downloading: boolean
  onDownload: () => void
  onRefresh: () => void
  onDismiss: () => void
}) {
  const { t } = useAcademicsI18n()
  const failed = snapshot.status === 'failed'
  const ready = canDownload(snapshot.status, snapshot.dryRun)
  const empty = isEmptyReport(snapshot)
  // Past the stall budget we stop the spinner and prompt a manual refresh.
  const spinning = snapshot.status === 'generating' && !stalled
  const stalledGenerating = snapshot.status === 'generating' && stalled

  return (
    <section
      className="rounded-xl border p-4 mb-6 flex items-center gap-3"
      style={cardStyle}
      role="status"
      aria-live="polite"
    >
      {spinning && <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--accent-enrollment-text))]" />}
      {stalledGenerating && <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-warning-fg))]" />}
      {ready && <CheckCircle2 className="w-5 h-5 text-[rgb(var(--state-success-fg))]" />}
      {failed && <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-danger-fg))]" />}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
          {spinning && t('governmentReports.active.generating')}
          {stalledGenerating && t('governmentReports.active.stalled')}
          {ready && t('governmentReports.active.ready')}
          {failed && t('governmentReports.active.failed')}
        </div>
        {stalledGenerating && (
          <div className="text-xs mt-0.5 text-[rgb(var(--text-tertiary))]">
            {t('governmentReports.active.stalledDescription')}
          </div>
        )}
        {ready && empty && (
          <div className="text-xs mt-0.5 text-[rgb(var(--state-warning-fg))]">
            {t('governmentReports.active.emptyReport')}
          </div>
        )}
        {failed && snapshot.errorSummary && (
          <div className="text-xs mt-0.5 text-[rgb(var(--state-danger-fg))]">
            {snapshot.errorSummary}
          </div>
        )}
      </div>
      {stalledGenerating && (
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors hover:opacity-80 disabled:opacity-50 border-[rgb(var(--border-primary)/0.35)] text-[rgb(var(--text-secondary))]"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t('governmentReports.actions.refresh')}
        </button>
      )}
      {ready && (
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 bg-[rgb(var(--action-primary-bg))] text-[rgb(var(--action-primary-fg))]"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('governmentReports.actions.downloadCsv')}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="text-xs transition-colors hover:opacity-80 text-[rgb(var(--text-tertiary))]"
      >
        {t('governmentReports.actions.dismiss')}
      </button>
    </section>
  )
}
