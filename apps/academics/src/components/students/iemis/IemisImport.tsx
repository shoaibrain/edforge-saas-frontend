/**
 * IEMIS Bulk Student Import — main page component.
 *
 * This is the Phase 3.1 Saraswati-pilot unblocker: a full-page flow for
 * operators to upload their Nepal IEMIS xlsx export and commit it to the
 * academics service. Paired with the backend endpoint:
 *   POST /academics/students/import/iemis (students.controller.ts)
 *
 * ## Why a full page, not a modal
 *
 * The CSV import uses a modal because it caps at 200 rows + 5 columns —
 * small surface area. IEMIS imports can be 779 rows × 20 columns with
 * dozens of findings; presenting that inside a modal is hostile. A page
 * also lets the operator cross-reference the findings against the xlsx
 * in a side-by-side browser window.
 *
 * ## State machine (see IemisImportPhase in ./iemis-import.types.ts)
 *
 *   gate ──────► chooseFile ──► parsing ──► preview ──► confirming ──► committing ──► results
 *                    │             │           ▲              │
 *                    │             ▼           │              ▼
 *                    └──► parseError   ────────┘              commitError
 *
 * The "gate" phase is the first check: is the active school eligible
 * (i.e. `emisSchoolCode` present)? If not, the page renders a guidance
 * block with a link to the school settings page. This sidesteps the
 * need for a tenant-archetype lookup — an IEMIS-code-less school can't
 * receive IEMIS data regardless of archetype, so the gate is semantically
 * correct AND avoids cross-MFE context plumbing.
 *
 * ## What this component does NOT do
 *
 *  - Per-cell validation. That's the backend transformer's job.
 *  - BS→Gregorian date conversion. Same reason: keep one source of truth.
 *  - Archetype lookup. We check `emisSchoolCode` instead (see above).
 *  - State persistence across page reloads. A mid-flow reload resets to
 *    chooseFile — operators who close the tab lose their parsed file.
 *    Acceptable for V1 given the flow is <5 minutes end-to-end.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { useActiveSchoolId } from '../../../stores/app.store'
import { getSchoolProfile } from '../../../services/school.service'
import { getAcademicYears } from '../../../services/school.service'
import {
  usePreviewIemisImport,
  useStartIemisImport,
  useIemisImportJob,
} from '../../../hooks/useStudents'
import { parseIemisXlsx } from './iemis-parser'
import {
  buildFindingsExport,
  downloadFindingsCsv,
} from './iemis-findings-export'
import {
  MAX_IEMIS_FILE_SIZE_BYTES,
  MAX_IEMIS_ROW_COUNT,
  type IemisImportPhase,
  type IemisImportResult,
  type IemisImportJob,
  type IemisParseResult,
} from './iemis-import.types'
import { useAcademicsI18n } from '../../../lib/i18n'

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IemisImport() {
  const navigate = useNavigate()
  const { t, formatCount } = useAcademicsI18n()
  const schoolId = useActiveSchoolId()

  // Fetch the active school so we can (a) display its name/IEMIS code in
  // the gate, and (b) block the flow when `emisSchoolCode` is absent.
  // Kept as a TanStack query so we get caching + a retry on 5xx for free.
  const schoolQuery = useQuery({
    queryKey: ['school-profile', schoolId],
    queryFn: () => getSchoolProfile(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  })

  // ── Flow state ────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<IemisImportPhase>('gate')
  const [parseResult, setParseResult] = useState<IemisParseResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [dryRunResult, setDryRunResult] = useState<IemisImportResult | null>(null)
  const [commitError, setCommitError] = useState<string | null>(null)

  // Sprint C4 — async commit. After the commit POST returns 202, we hold the
  // jobId here and `useIemisImportJob` polls until the job reaches a terminal
  // state. The final `IemisImportJob` row is the source of truth for the
  // results view; we no longer keep a separate `commitResult`.
  const [jobId, setJobId] = useState<string | null>(null)
  const jobQuery = useIemisImportJob(jobId)

  // Sprint C4 — auto-enroll-on-import. The user can opt to enroll every
  // successfully created Student into the chosen academic year inside the
  // same async job. Default is the school's `isCurrent` AY when its status
  // is `active`. If no eligible AY exists, the checkbox is disabled.
  const [enrollInAcademicYearId, setEnrollInAcademicYearId] = useState<string | undefined>(undefined)

  const previewMutation = usePreviewIemisImport()
  const startMutation = useStartIemisImport()

  // ── Academic years (for enroll-on-import option) ───────────────────────
  // Only fetched when the school is eligible — keeps the gate fast-path lean.
  const academicYearsQuery = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => getAcademicYears(schoolId!),
    enabled: !!schoolId && !!schoolQuery.data?.emisSchoolCode,
    staleTime: 5 * 60 * 1000,
  })

  // The "active + current" AY is the natural enrollment target. If none
  // exists, we fall back to any AY with status='active'. If none of those
  // either, the checkbox stays disabled.
  const eligibleAcademicYear = useMemo(() => {
    const all = academicYearsQuery.data ?? []
    const activeCurrent = all.find((y) => y.status === 'active' && y.isCurrent)
    if (activeCurrent) return activeCurrent
    return all.find((y) => y.status === 'active')
  }, [academicYearsQuery.data])

  // Default the enrollment-on-import selection to the eligible AY, but only
  // once we've actually loaded one. The user can uncheck.
  useEffect(() => {
    if (
      eligibleAcademicYear &&
      enrollInAcademicYearId === undefined &&
      academicYearsQuery.isSuccess
    ) {
      setEnrollInAcademicYearId(eligibleAcademicYear.yearId)
    }
  }, [eligibleAcademicYear, enrollInAcademicYearId, academicYearsQuery.isSuccess])

  // ── Derived gate state ────────────────────────────────────────────────
  const school = schoolQuery.data
  const isSchoolLoading = schoolQuery.isLoading
  const isSchoolEligible = !!school?.emisSchoolCode
  // Move past the gate once we've confirmed eligibility. Operator can
  // still step back to chooseFile after a commitError or dryRun preview.
  const effectivePhase: IemisImportPhase = useMemo(() => {
    if (phase === 'gate') {
      if (isSchoolLoading) return 'gate'
      if (!isSchoolEligible) return 'gate'
      return 'chooseFile'
    }
    return phase
  }, [phase, isSchoolLoading, isSchoolEligible])

  // ── File chooser handler ──────────────────────────────────────────────
  const handleFileSelected = useCallback(
    async (file: File) => {
      setParseError(null)
      setParseResult(null)
      setDryRunResult(null)

      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        setParseError('Only .xlsx and .xls files are supported.')
        setPhase('parseError')
        return
      }
      if (file.size > MAX_IEMIS_FILE_SIZE_BYTES) {
        setParseError(
          `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_IEMIS_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
        )
        setPhase('parseError')
        return
      }

      setPhase('parsing')
      try {
        const result = await parseIemisXlsx(file)
        if (result.rowCount === 0) {
          setParseError(
            'The file has zero data rows. Confirm you exported the student list, not a summary sheet.',
          )
          setPhase('parseError')
          return
        }
        if (result.rowCount > MAX_IEMIS_ROW_COUNT) {
          setParseError(
            `This file has ${result.rowCount} rows — the backend accepts up to ${MAX_IEMIS_ROW_COUNT} per request. Split the file and import each batch separately.`,
          )
          setPhase('parseError')
          return
        }
        if (result.missingRequired.length > 0) {
          setParseError(
            `Missing required columns: ${result.missingRequired.join(', ')}. Re-export from IEMIS and confirm column headers match exactly.`,
          )
          setPhase('parseError')
          return
        }
        setParseResult(result)
        // Kick off dry-run immediately — no separate "review parsed" phase
        // because column-sniff alone can't tell the operator anything
        // beyond "headers look right"; the backend's findings array is
        // where the real review happens.
        await runDryRun(result)
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to parse file. Is it a valid xlsx?'
        setParseError(message)
        setPhase('parseError')
      }
    },
    // runDryRun captured in closure — defined below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schoolId],
  )

  // ── Dry-run handler ───────────────────────────────────────────────────
  const runDryRun = useCallback(
    async (parsed: IemisParseResult) => {
      if (!schoolId) return
      setPhase('dryRunning')
      try {
        const result = await previewMutation.mutateAsync({
          students: parsed.rows,
          schoolId,
        })
        setDryRunResult(result)
        setPhase('preview')
      } catch (err) {
        console.warn('[IemisImport] Dry-run failed', err)
        setPhase('chooseFile')
      }
    },
    [schoolId, previewMutation],
  )

  // ── Commit handler ────────────────────────────────────────────────────
  // Sprint C4: kicks off an async job (202 + jobId) and switches to the
  // `progress` phase. Polling is owned by `useIemisImportJob`; transitions
  // to `results` / `commitError` are owned by the effect below.
  const handleCommit = useCallback(async () => {
    if (!parseResult || !schoolId) return
    setCommitError(null)
    setPhase('committing')
    try {
      const ack = await startMutation.mutateAsync({
        students: parseResult.rows,
        schoolId,
        enrollInAcademicYearId,
      })
      setJobId(ack.jobId)
      setPhase('progress')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Import failed. Please try again.'
      setCommitError(message)
      setPhase('commitError')
    }
  }, [parseResult, schoolId, enrollInAcademicYearId, startMutation])

  // ── Job terminal-state transition ─────────────────────────────────────
  useEffect(() => {
    if (phase !== 'progress' || !jobQuery.data) return
    if (jobQuery.data.status === 'succeeded') {
      setPhase('results')
      if (jobQuery.data.studentsCreated > 0) {
        toast.success(
          `Imported ${jobQuery.data.studentsCreated} student${jobQuery.data.studentsCreated === 1 ? '' : 's'}` +
            (jobQuery.data.studentsEnrolled > 0
              ? ` · enrolled ${jobQuery.data.studentsEnrolled}`
              : ''),
        )
      }
    } else if (jobQuery.data.status === 'failed') {
      setCommitError(jobQuery.data.error ?? 'Import job failed.')
      setPhase('commitError')
    }
  }, [phase, jobQuery.data])

  // ── Reset to chooseFile ───────────────────────────────────────────────
  const resetToChooser = useCallback(() => {
    setParseResult(null)
    setParseError(null)
    setDryRunResult(null)
    setCommitError(null)
    setJobId(null)
    setPhase('chooseFile')
  }, [])

  // ── Error-CSV export ──────────────────────────────────────────────────
  // Accepts either a sync IemisImportResult (dryRun) or an async IemisImportJob
  // (post-commit). Both expose `findings` in the same shape.
  const downloadFindings = useCallback(
    (source: IemisImportResult | IemisImportJob) => {
      if (!parseResult) return
      const exportRows = buildFindingsExport(source.findings, parseResult.rows)
      const ts = new Date().toISOString().slice(0, 10)
      downloadFindingsCsv(exportRows, `iemis-import-findings-${ts}.csv`)
    },
    [parseResult],
  )

  // ══════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Page header */}
      <header className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/students' })}
          className="p-2 rounded-lg text-text-secondary hover:bg-surface-hover"
          aria-label={t('iemisImport.backToStudents')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text-primary">
            {t('iemisImport.title')}
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {t('iemisImport.subtitle', { schoolName: school?.name ?? t('iemisImport.thisSchool') })}
          </p>
        </div>
      </header>

      {/* Gate phase */}
      {effectivePhase === 'gate' && (
        <GateView
          isLoading={isSchoolLoading}
          school={school}
          isEligible={isSchoolEligible}
        />
      )}

      {/* Choose file */}
      {effectivePhase === 'chooseFile' && (
        <FileChooserCard onFileSelected={handleFileSelected} />
      )}

      {/* Parsing spinner */}
      {effectivePhase === 'parsing' && (
        <InlineStatus
          icon={<Loader2 className="w-5 h-5 animate-spin" />}
          title={t('iemisImport.states.parsingTitle')}
          description={t('iemisImport.states.parsingDescription')}
        />
      )}

      {/* Dry-run spinner */}
      {effectivePhase === 'dryRunning' && (
        <InlineStatus
          icon={<Loader2 className="w-5 h-5 animate-spin" />}
          title={t('iemisImport.states.dryRunTitle')}
          description={
            parseResult?.rowCount != null
              ? formatCount('iemisImport.states.dryRunDescription', parseResult.rowCount)
              : t('iemisImport.states.dryRunDescriptionPending')
          }
        />
      )}

      {/* Parse error */}
      {effectivePhase === 'parseError' && (
        <ErrorCard
          title={t('iemisImport.states.parseErrorTitle')}
          message={parseError ?? t('iemisImport.states.unknownParseError')}
          onRetry={resetToChooser}
        />
      )}

      {/* Preview */}
      {effectivePhase === 'preview' && dryRunResult && parseResult && (
        <PreviewView
          parse={parseResult}
          dryRun={dryRunResult}
          eligibleAcademicYear={eligibleAcademicYear}
          enrollInAcademicYearId={enrollInAcademicYearId}
          onToggleEnroll={(yearId) => setEnrollInAcademicYearId(yearId)}
          onConfirm={() => setPhase('confirming')}
          onCancel={resetToChooser}
          onDownloadFindings={() => downloadFindings(dryRunResult)}
        />
      )}

      {/* Confirmation modal */}
      {effectivePhase === 'confirming' && dryRunResult && parseResult && (
        <ConfirmModal
          parse={parseResult}
          dryRun={dryRunResult}
          schoolName={school?.name ?? t('iemisImport.thisSchool')}
          enrollInAcademicYearName={
            enrollInAcademicYearId && eligibleAcademicYear?.yearId === enrollInAcademicYearId
              ? eligibleAcademicYear.name
              : undefined
          }
          onConfirm={handleCommit}
          onCancel={() => setPhase('preview')}
        />
      )}

      {/* Committing — POST in flight, expecting 202 quickly */}
      {effectivePhase === 'committing' && (
        <InlineStatus
          icon={<Loader2 className="w-5 h-5 animate-spin" />}
          title={t('iemisImport.states.submittingTitle')}
          description={t('iemisImport.states.submittingDescription')}
        />
      )}

      {/* Progress — polling the job until it terminates */}
      {effectivePhase === 'progress' && (
        <ProgressView
          job={jobQuery.data}
          totalRows={parseResult?.rowCount ?? 0}
          enrollInAcademicYearName={
            enrollInAcademicYearId && eligibleAcademicYear?.yearId === enrollInAcademicYearId
              ? eligibleAcademicYear.name
              : undefined
          }
        />
      )}

      {/* Commit error */}
      {effectivePhase === 'commitError' && (
        <ErrorCard
          title={t('iemisImport.states.importFailedTitle')}
          message={commitError ?? t('iemisImport.states.unknownError')}
          onRetry={() => parseResult && runDryRun(parseResult)}
          retryLabel={t('iemisImport.states.rerunDryRun')}
        />
      )}

      {/* Results — reads from the terminal job row */}
      {effectivePhase === 'results' && jobQuery.data && parseResult && (
        <ResultsView
          job={jobQuery.data}
          totalRows={parseResult.rowCount}
          enrollInAcademicYearName={
            jobQuery.data.enrollInAcademicYearId && eligibleAcademicYear?.yearId === jobQuery.data.enrollInAcademicYearId
              ? eligibleAcademicYear.name
              : undefined
          }
          onImportAnother={resetToChooser}
          onViewStudents={() => navigate({ to: '/students' })}
          onDownloadFindings={() => downloadFindings(jobQuery.data!)}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENTS (inline to keep the flow readable end-to-end)
// ============================================================================

function GateView({
  isLoading,
  school,
  isEligible,
}: {
  isLoading: boolean
  school: { name: string; emisSchoolCode?: string } | undefined
  isEligible: boolean
}) {
  const { t } = useAcademicsI18n()
  if (isLoading) {
    return (
      <InlineStatus
        icon={<Loader2 className="w-5 h-5 animate-spin" />}
        title={t('iemisImport.states.checkingEligibilityTitle')}
        description={t('iemisImport.states.checkingEligibilityDescription')}
      />
    )
  }
  if (!school) {
    return (
      <ErrorCard
        title={t('iemisImport.states.noSchoolTitle')}
        message={t('iemisImport.states.noSchoolMessage')}
      />
    )
  }
  if (!isEligible) {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--state-warning-fg))] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium text-amber-900 dark:text-amber-200">
              {t('iemisImport.gate.missingCodeTitle', { schoolName: school.name })}
            </div>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              {t('iemisImport.gate.missingCodeDescription', { code: 'emisSchoolCode' })}
            </p>
          </div>
        </div>
      </div>
    )
  }
  return null
}

function FileChooserCard({
  onFileSelected,
}: {
  onFileSelected: (file: File) => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const [isDragging, setIsDragging] = useState(false)
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? 'border-[rgb(var(--border-focus))] bg-[rgb(var(--state-info-bg)/0.18)] '
            : 'border-border-primary bg-surface-secondary'
        }`}
      >
        <FileSpreadsheet className="w-10 h-10 mx-auto text-text-tertiary" />
        <h3 className="mt-3 text-base font-medium text-text-primary">
          {t('iemisImport.chooser.dropTitle')}
        </h3>
        <p className="mt-1 text-sm text-text-tertiary">
          {t('iemisImport.chooser.dropDescription', { maxRows: formatNumber(MAX_IEMIS_ROW_COUNT) })}
        </p>
        <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] text-[rgb(var(--action-primary-fg))] text-sm font-medium cursor-pointer">
          <Upload className="w-4 h-4" />
          {t('iemisImport.chooser.browse')}
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onFileSelected(file)
              e.target.value = ''
            }}
            className="hidden"
          />
        </label>
      </div>
      <div className="rounded-lg border border-border-primary bg-surface-secondary p-4 text-sm">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-text-secondary">
            <div className="font-medium text-text-primary">{t('iemisImport.chooser.expectedColumns')}</div>
            <p>
              {t('iemisImport.chooser.expectedDescription')}
            </p>
            <p>
              {t('iemisImport.chooser.dateDescription')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewView({
  parse,
  dryRun,
  eligibleAcademicYear,
  enrollInAcademicYearId,
  onToggleEnroll,
  onConfirm,
  onCancel,
  onDownloadFindings,
}: {
  parse: IemisParseResult
  dryRun: IemisImportResult
  eligibleAcademicYear:
    | { yearId: string; name: string; startDate: string; endDate: string; isCurrent: boolean }
    | undefined
  enrollInAcademicYearId: string | undefined
  onToggleEnroll: (yearId: string | undefined) => void
  onConfirm: () => void
  onCancel: () => void
  onDownloadFindings: () => void
}) {
  const { t, formatNumber, formatCount } = useAcademicsI18n()
  const errors = dryRun.findings.filter((f) => f.level === 'error')
  const warnings = dryRun.findings.filter((f) => f.level === 'warn')
  const willImport = parse.rowCount - dryRun.skipped - dryRun.failed

  return (
    <div className="space-y-4">
      {/* File summary */}
      <div className="rounded-xl border border-border-primary bg-surface-primary p-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-[rgb(var(--action-secondary-fg))]" />
          <div className="flex-1">
            <div className="text-sm font-medium text-text-primary">
              {parse.fileName}
            </div>
            <div className="text-xs text-text-tertiary">
              {t('iemisImport.summary.fileSummary', {
                count: parse.rowCount,
                rows: formatNumber(parse.rowCount),
                mapped: formatNumber(parse.mappedColumns.length),
              })}
              {parse.extraColumns.length > 0 &&
                ` · ${t('iemisImport.summary.extraColumns', { count: parse.extraColumns.length })}`}
            </div>
          </div>
        </div>
      </div>

      {/* Count summary */}
      <div className="grid grid-cols-4 gap-3">
        <CountTile
          label={t('iemisImport.summary.willImport')}
          value={willImport}
          tone={willImport > 0 ? 'success' : 'neutral'}
        />
        <CountTile label={t('iemisImport.summary.blocked')} value={dryRun.failed} tone={dryRun.failed > 0 ? 'danger' : 'neutral'} />
        <CountTile label={t('iemisImport.summary.duplicates')} value={dryRun.skipped} tone={dryRun.skipped > 0 ? 'warn' : 'neutral'} />
        <CountTile label={t('iemisImport.summary.warnings')} value={warnings.length} tone={warnings.length > 0 ? 'warn' : 'neutral'} />
      </div>

      {/* Enroll-on-import — Sprint C4 ────────────────────────────────────
          Defaults ON when the school has an active+current AY. Without
          enrollment, every imported student lands in `pending` status with
          no class assignment / attendance / grades — workable for one-off
          historical imports, painful at pilot scale (779 manual clicks).

          Dark-mode contrast note: text colors here are tone-tinted
          (text-[rgb(var(--text-primary))]  etc.) instead of the semantic
          text-text-primary CSS-vars. The CSS-vars resolve to white in dark
          mode, which becomes washed out against the teal-tinted background;
          tone-tinted classes pair correctly with both light and dark bgs.
      */}
      {willImport > 0 && (
        <div
          className={`rounded-xl border p-4 ${
            eligibleAcademicYear
              ? 'border-[rgb(var(--state-info-border)/0.45)] bg-[rgb(var(--state-info-bg)/0.18)]  '
              : 'border-border-primary bg-surface-secondary'
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              disabled={!eligibleAcademicYear}
              checked={
                !!eligibleAcademicYear &&
                enrollInAcademicYearId === eligibleAcademicYear.yearId
              }
              onChange={(e) => {
                if (!eligibleAcademicYear) return
                onToggleEnroll(e.target.checked ? eligibleAcademicYear.yearId : undefined)
              }}
            />
            <div className="flex-1">
              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  eligibleAcademicYear
                    ? 'text-[rgb(var(--text-primary))] '
                    : 'text-text-primary'
                }`}
              >
                <CalendarCheck className="w-4 h-4 text-[rgb(var(--action-secondary-fg))] " />
                {t('iemisImport.enrollOption.title')}
              </div>
              {eligibleAcademicYear ? (
                <div className="mt-1 text-xs text-[rgb(var(--state-info-fg))] ">
                  <b>{eligibleAcademicYear.name}</b>
                  {eligibleAcademicYear.isCurrent && (
                    <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--state-info-bg)/0.18)]  text-[rgb(var(--state-info-fg))] ">
                      {t('iemisImport.enrollOption.current')}
                    </span>
                  )}
                  {' · '}
                  {eligibleAcademicYear.startDate} → {eligibleAcademicYear.endDate}
                </div>
              ) : (
                <div className="mt-1 text-xs text-text-tertiary">
                  {t('iemisImport.enrollOption.noYear')}
                </div>
              )}
              <div
                className={`mt-2 text-xs ${
                  eligibleAcademicYear
                    ? 'text-[rgb(var(--text-secondary))] '
                    : 'text-text-tertiary'
                }`}
              >
                {t('iemisImport.enrollOption.description')}
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <FindingsList
          tone="danger"
          title={`${errors.length} error${errors.length === 1 ? '' : 's'} — these rows will NOT import`}
          findings={errors}
        />
      )}

      {/* Duplicates */}
      {dryRun.duplicates.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4">
          <div className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {t('iemisImport.duplicates.title', { count: dryRun.duplicates.length })}
          </div>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            {t('iemisImport.duplicates.description')}
          </p>
          <ul className="mt-2 space-y-1 text-xs font-mono text-amber-900 dark:text-amber-200 max-h-40 overflow-y-auto">
            {dryRun.duplicates.slice(0, 20).map((d) => (
              <li key={`${d.row}-${d.emisStudentId}`}>
                {t('iemisImport.duplicates.row', {
                  row: formatNumber(d.row),
                  emisStudentId: d.emisStudentId,
                  studentId: d.existingStudentId,
                })}
              </li>
            ))}
            {dryRun.duplicates.length > 20 && (
              <li className="italic">{formatCount('iemisImport.duplicates.andMore', dryRun.duplicates.length - 20)}</li>
            )}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <FindingsList
          tone="warn"
          title={`${warnings.length} warning${warnings.length === 1 ? '' : 's'} — these rows will still import`}
          findings={warnings}
          collapsible
        />
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onDownloadFindings}
          disabled={dryRun.findings.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border-primary text-text-primary hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {t('iemisImport.actions.downloadFindings')}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded-lg border border-border-primary text-text-primary hover:bg-surface-hover"
          >
            {t('iemisImport.actions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={willImport <= 0}
            className="px-4 py-1.5 text-sm rounded-lg bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] disabled:bg-text-tertiary disabled:cursor-not-allowed text-[rgb(var(--action-primary-fg))] font-medium"
          >
            {willImport > 0
              ? t('iemisImport.actions.importStudents', { count: willImport })
              : t('iemisImport.actions.noRows')}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  parse,
  dryRun,
  schoolName,
  enrollInAcademicYearName,
  onConfirm,
  onCancel,
}: {
  parse: IemisParseResult
  dryRun: IemisImportResult
  schoolName: string
  enrollInAcademicYearName: string | undefined
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t, formatCount } = useAcademicsI18n()
  const [ack, setAck] = useState(false)
  const willImport = parse.rowCount - dryRun.skipped - dryRun.failed
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(var(--background-overlay)/0.50)] p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-surface-primary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-border-primary">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              {t('iemisImport.confirm.title')}
            </h3>
            <p className="mt-1 text-sm text-text-tertiary">
              {t('iemisImport.confirm.description')}
            </p>
          </div>
          <button onClick={onCancel} className="p-1 text-text-tertiary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3 text-sm text-text-secondary">
          <p>
            {t('iemisImport.confirm.summary', { count: willImport, schoolName })}
            {enrollInAcademicYearName && (
              <>
                {' '}{t('iemisImport.confirm.andEnrolled', { yearName: enrollInAcademicYearName })}
              </>
            )}.{' '}
            {dryRun.skipped > 0 && (
              <>
                {t('iemisImport.confirm.skipped', { count: dryRun.skipped })}{' '}
              </>
            )}
            {dryRun.failed > 0 && (
              <>
                {t('iemisImport.confirm.failed', { count: dryRun.failed })}
              </>
            )}
          </p>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              className="mt-1"
            />
            <span>
              {t('iemisImport.confirm.ack')}
            </span>
          </label>
        </div>
        <div className="flex items-center justify-end gap-2 p-5 border-t border-border-primary bg-surface-secondary/50 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-sm rounded-lg border border-border-primary text-text-primary hover:bg-surface-hover"
          >
            {t('iemisImport.actions.backToPreview')}
          </button>
          <button
            onClick={onConfirm}
            disabled={!ack || willImport <= 0}
            className="px-4 py-1.5 text-sm rounded-lg bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] disabled:bg-text-tertiary disabled:cursor-not-allowed text-[rgb(var(--action-primary-fg))] font-medium"
          >
            {formatCount('iemisImport.actions.importNow', willImport)}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * ProgressView — Sprint C4. Renders while we're polling the async import
 * job. The backend reports `status='running'` once the worker starts but
 * does NOT stream per-batch progress (that would require either a separate
 * progress write per batch — DDB write amplification — or a streaming
 * response). For V1 we show an indeterminate progress bar with a simple
 * status copy. The polling cadence (2s in `useIemisImportJob`) plus a
 * realistic 30–60s import window means the user sees the spinner for
 * ~15-30 polls before the terminal transition fires the results view.
 */
function ProgressView({
  job,
  totalRows,
  enrollInAcademicYearName,
}: {
  job: IemisImportJob | undefined
  totalRows: number
  enrollInAcademicYearName: string | undefined
}) {
  const { t, formatCount } = useAcademicsI18n()
  const status = job?.status ?? 'queued'
  const isQueued = status === 'queued'
  const description = isQueued
    ? formatCount('iemisImport.progress.queuedDescription', totalRows)
    : enrollInAcademicYearName
      ? formatCount('iemisImport.progress.runningDescriptionWithYear', totalRows, { yearName: enrollInAcademicYearName })
      : formatCount('iemisImport.progress.runningDescription', totalRows)

  return (
    <div className="rounded-xl border border-[rgb(var(--state-info-border)/0.45)] bg-[rgb(var(--state-info-bg)/0.18)]   p-5">
      <div className="flex items-start gap-3">
        <Loader2 className="w-5 h-5 text-[rgb(var(--action-secondary-fg))] animate-spin flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-[rgb(var(--text-primary))] ">
            {isQueued ? t('iemisImport.progress.queuedTitle') : t('iemisImport.progress.runningTitle')}
          </div>
          <p className="mt-1 text-sm text-[rgb(var(--state-info-fg))] ">{description}</p>
          <p className="mt-2 text-xs text-[rgb(var(--text-secondary))] ">
            {t('iemisImport.progress.keepOpen')}
          </p>
        </div>
      </div>

      {/* Indeterminate stripe — until the worker reports per-batch progress */}
      <div className="mt-4 h-1.5 rounded-full bg-[rgb(var(--state-info-bg)/0.26)]  overflow-hidden">
        <div className="h-full w-1/3 bg-[rgb(var(--state-info-fg))] animate-[indeterminate_1.4s_ease-in-out_infinite] [animation-name:indeterminate]"
          style={{
            animation: 'indeterminate 1.4s ease-in-out infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}

function ResultsView({
  job,
  totalRows,
  enrollInAcademicYearName,
  onImportAnother,
  onViewStudents,
  onDownloadFindings,
}: {
  job: IemisImportJob
  totalRows: number
  enrollInAcademicYearName: string | undefined
  onImportAnother: () => void
  onViewStudents: () => void
  onDownloadFindings: () => void
}) {
  const { t, formatNumber } = useAcademicsI18n()
  const enrollAttempted = !!job.enrollInAcademicYearId
  const allSuccess =
    job.failed === 0 &&
    job.studentsCreated === totalRows - job.skipped &&
    (!enrollAttempted || job.studentsEnrolled === job.studentsCreated)

  return (
    <div className="space-y-4">
      <div
        className={`rounded-xl border p-5 ${
          allSuccess
            ? 'border-[rgb(var(--state-success-border)/0.45)] bg-[rgb(var(--state-success-bg)/0.18)]  '
            : 'border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800'
        }`}
      >
        <div className="flex items-start gap-3">
          {allSuccess ? (
            <CheckCircle2 className="w-6 h-6 text-[rgb(var(--state-success-fg))]  flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-[rgb(var(--state-warning-fg))] flex-shrink-0" />
          )}
          <div>
            <div className="text-base font-semibold text-text-primary">
              {allSuccess ? t('iemisImport.results.complete') : t('iemisImport.results.issues')}
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              {enrollAttempted
                ? t('iemisImport.results.summaryWithEnrollment', {
                    created: formatNumber(job.studentsCreated),
                    enrolled: formatNumber(job.studentsEnrolled),
                    year: enrollInAcademicYearName ? t('iemisImport.results.inYear', { yearName: enrollInAcademicYearName }) : '',
                    skipped: formatNumber(job.skipped),
                    failed: formatNumber(job.failed),
                    total: formatNumber(totalRows),
                  })
                : t('iemisImport.results.summary', {
                    created: formatNumber(job.studentsCreated),
                    skipped: formatNumber(job.skipped),
                    failed: formatNumber(job.failed),
                    total: formatNumber(totalRows),
                  })}
            </div>
            {job.durationMs !== undefined && (
              <div className="mt-1 text-xs text-text-tertiary">
                {t('iemisImport.results.duration', { seconds: formatNumber(Number((job.durationMs / 1000).toFixed(1))) })}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={`grid gap-3 ${enrollAttempted ? 'grid-cols-4' : 'grid-cols-3'}`}>
        <CountTile label={t('iemisImport.summary.created')} value={job.studentsCreated} tone="success" />
        {enrollAttempted && (
          <CountTile
            label={t('iemisImport.summary.enrolled')}
            value={job.studentsEnrolled}
            tone={job.studentsEnrolled === job.studentsCreated ? 'success' : 'warn'}
          />
        )}
        <CountTile label={t('iemisImport.summary.skipped')} value={job.skipped} tone="warn" />
        <CountTile label={t('iemisImport.summary.failed')} value={job.failed} tone={job.failed > 0 ? 'danger' : 'neutral'} />
      </div>
      {job.findingsTruncated && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
          {t('iemisImport.results.truncated')}
        </div>
      )}
      {job.findings.length > 0 && (
        <FindingsList
          tone="info"
          title={t('iemisImport.results.findings', { count: job.findings.length })}
          findings={job.findings}
          collapsible
        />
      )}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={onDownloadFindings}
          disabled={job.findings.length === 0}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border-primary text-text-primary hover:bg-surface-hover disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          {t('iemisImport.actions.downloadFindings')}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onImportAnother}
            className="px-4 py-1.5 text-sm rounded-lg border border-border-primary text-text-primary hover:bg-surface-hover"
          >
            {t('iemisImport.actions.importAnother')}
          </button>
          <button
            onClick={onViewStudents}
            className="px-4 py-1.5 text-sm rounded-lg bg-[rgb(var(--action-primary-bg))] hover:bg-[rgb(var(--action-primary-bg-hover))] text-[rgb(var(--action-primary-fg))] font-medium"
          >
            {t('iemisImport.actions.viewStudents')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// GENERIC PRESENTATION HELPERS
// ============================================================================

function CountTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'success' | 'warn' | 'danger' | 'neutral'
}) {
  const toneClass = {
    success: 'text-[rgb(var(--state-success-fg))] ',
    warn: 'text-[rgb(var(--state-warning-fg))]',
    danger: 'text-rust-500',
    neutral: 'text-text-tertiary',
  }[tone]
  return (
    <div className="rounded-lg border border-border-primary bg-surface-primary p-4">
      <div className={`text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-text-tertiary">{label}</div>
    </div>
  )
}

function FindingsList({
  tone,
  title,
  findings,
  collapsible = false,
}: {
  tone: 'danger' | 'warn' | 'info'
  title: string
  findings: Array<{ row: number; field: string; message: string }>
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(!collapsible)
  // Sprint C4 dark-mode fix: previously used `text-text-primary/secondary`
  // (CSS vars that resolve to white in dark mode). On `bg-amber-50` /
  // `bg-rust-50` light-tone backgrounds, white text is invisible. Switching
  // to tone-tinted text colors that pair with both light and dark bgs.
  const containerClass = {
    danger: 'border-rust-300 bg-rust-50 dark:bg-rust-950/40 dark:border-rust-800',
    warn: 'border-amber-300 bg-amber-50 dark:bg-amber-950/40 dark:border-amber-800',
    info: 'border-border-primary bg-surface-secondary',
  }[tone]
  const titleClass = {
    danger: 'text-rust-900 dark:text-rust-100',
    warn: 'text-amber-900 dark:text-amber-100',
    info: 'text-text-primary',
  }[tone]
  const itemClass = {
    danger: 'text-rust-800 dark:text-rust-200',
    warn: 'text-amber-800 dark:text-amber-200',
    info: 'text-text-secondary',
  }[tone]
  const subtleClass = {
    danger: 'text-rust-700 dark:text-rust-300',
    warn: 'text-amber-700 dark:text-amber-300',
    info: 'text-text-tertiary',
  }[tone]
  return (
    <div className={`rounded-xl border p-4 ${containerClass}`}>
      <button
        onClick={() => collapsible && setOpen(!open)}
        className={`flex w-full items-center justify-between text-sm font-medium ${titleClass}`}
        disabled={!collapsible}
      >
        <span>{title}</span>
        {collapsible && <span className={`text-xs ${subtleClass}`}>{open ? 'Collapse' : 'Expand'}</span>}
      </button>
      {open && (
        <ul className={`mt-3 space-y-1 text-xs font-mono max-h-64 overflow-y-auto ${itemClass}`}>
          {findings.slice(0, 100).map((f, idx) => (
            <li key={idx}>
              Row {f.row} · <b>{f.field}</b> — {f.message}
            </li>
          ))}
          {findings.length > 100 && (
            <li className="italic">…and {findings.length - 100} more. Download CSV for the full list.</li>
          )}
        </ul>
      )}
    </div>
  )
}

function InlineStatus({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-border-primary bg-surface-secondary p-5">
      <div className="flex items-start gap-3">
        <div className="text-[rgb(var(--action-secondary-fg))]">{icon}</div>
        <div>
          <div className="text-sm font-medium text-text-primary">{title}</div>
          <div className="mt-1 text-xs text-text-tertiary">{description}</div>
        </div>
      </div>
    </div>
  )
}

function ErrorCard({
  title,
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  title: string
  message: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div className="rounded-xl border border-rust-300 bg-rust-50 dark:bg-rust-950/20 dark:border-rust-800 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rust-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-sm font-medium text-text-primary">{title}</div>
          <div className="mt-1 text-sm text-text-secondary">{message}</div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-sm rounded-lg bg-rust-500 hover:bg-rust-600 text-[rgb(var(--action-primary-fg))]"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
