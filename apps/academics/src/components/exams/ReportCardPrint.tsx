/**
 * ReportCardPrint — browser-print / Save-as-PDF for a single ResultCard.
 *
 * Layer 5 (presentation) starter: renders a self-contained, print-optimized
 * report-card document in a new window and triggers the browser print dialog
 * (which doubles as "Save as PDF"). Self-contained HTML + inline print CSS so
 * it doesn't depend on the SPA's Tailwind/theme being available in the print
 * window, and so we never have to fight the shell's `@media print` rules.
 *
 * Scheme-aware (mirrors ResultCardsDrawer): a card with `result` set is the
 * Division scheme (PABSON terminal) → Full/Pass/Obtained/Result columns +
 * Percentage/Division/Result/Position footer; otherwise letter_gpa →
 * Score/Grade/GPA/Pass + Term GPA/Overall. Theory/Practical components render
 * as a sub-line under the subject. Visual layout is intentionally plain — the
 * per-school branded layout is the full Layer 5 epic; this is the functional
 * baseline so operators can produce a physical card today.
 */

import type { ExamResponseDto, ResultCardResponseDto } from '@aibrains/shared-types'
import { getAcademicSubjectLabel, getSubjectAreaLabel } from '../../schemas/course.form'
import { humanizeExamType } from '../../schemas/exam.form'

type CourseScore = ResultCardResponseDto['courseScores'][number]

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function isDivisionCard(card: ResultCardResponseDto): boolean {
  return card.result != null
}

function subjectLabel(cs: CourseScore): string {
  if (cs.academicSubject) return getAcademicSubjectLabel(cs.academicSubject)
  if (cs.subjectArea) return getSubjectAreaLabel(cs.subjectArea)
  return cs.courseName ?? '—'
}

function componentLine(cs: CourseScore): string {
  if (!cs.components || cs.components.length === 0) return ''
  const parts = cs.components.map((c) => `${esc(c.label ?? c.code)} ${c.obtained}/${c.fullMarks}`)
  return `<div class="components">${parts.join(' &middot; ')}</div>`
}

function passText(cs: CourseScore, division: boolean): string {
  if (cs.notGraded) return '<span class="ab">AB</span>'
  const passed = division ? cs.pass === true : cs.isPassing
  return passed ? '<span class="ok">Pass</span>' : '<span class="fail">Fail</span>'
}

function subjectRows(card: ResultCardResponseDto, division: boolean): string {
  const rows = card.courseScores
    .map((cs) => {
      const marks = cs.notGraded ? '—' : `${cs.rawScore} / ${cs.maxMarks}`
      const subject = `${esc(subjectLabel(cs))}${componentLine(cs)}`
      if (division) {
        return `<tr>
          <td class="subj">${subject}</td>
          <td class="num">${cs.maxMarks}</td>
          <td class="num">${cs.passMarks ?? '—'}</td>
          <td class="num">${cs.notGraded ? '—' : cs.rawScore}</td>
          <td class="num">${cs.highestInClass ?? '—'}</td>
          <td class="ctr">${passText(cs, true)}</td>
        </tr>`
      }
      return `<tr>
        <td class="subj">${subject}</td>
        <td class="num">${marks}</td>
        <td class="ctr">${esc(cs.grade)}</td>
        <td class="num">${cs.gpa.toFixed(2)}</td>
        <td class="ctr">${passText(cs, false)}</td>
      </tr>`
    })
    .join('')

  const totalCols = division
    ? `<td class="num">${card.totalMaxMarks}</td><td></td><td class="num">${card.totalScore}</td><td colspan="2"></td>`
    : `<td class="num">${card.totalScore} / ${card.totalMaxMarks}</td><td colspan="3"></td>`
  return `${rows}<tr class="total"><td class="subj">Total</td>${totalCols}</tr>`
}

function tableHead(division: boolean): string {
  return division
    ? `<th class="subj">Subject</th><th class="num">Full</th><th class="num">Pass</th><th class="num">Obt.</th><th class="num">H.M.</th><th class="ctr">Result</th>`
    : `<th class="subj">Subject</th><th class="num">Score</th><th class="ctr">Grade</th><th class="num">GPA</th><th class="ctr">Pass</th>`
}

function summaryBlock(card: ResultCardResponseDto, division: boolean): string {
  const cell = (label: string, value: string) =>
    `<div class="sum-cell"><div class="sum-label">${esc(label)}</div><div class="sum-value">${value}</div></div>`
  if (division) {
    const result = card.result === 'pass' ? '<span class="ok">PASS</span>' : '<span class="fail">FAIL</span>'
    return [
      card.percentage != null ? cell('Percentage', `${card.percentage.toFixed(1)}%`) : '',
      cell('Division', esc(card.division ?? '—')),
      cell('Result', result),
      cell('Position', esc(card.classRank ?? '—')),
    ].join('')
  }
  return [cell('Term GPA', card.termGpa.toFixed(2)), cell('Overall', esc(card.overallGrade))].join('')
}

function studentName(card: ResultCardResponseDto): string {
  const id = (card as ResultCardResponseDto & { studentIdentity?: { legalName?: string } }).studentIdentity
  return id?.legalName ?? card.studentId
}

function studentMeta(card: ResultCardResponseDto): string {
  const id = (card as ResultCardResponseDto & {
    studentIdentity?: { gradeLevel?: string; emisStudentId?: string }
  }).studentIdentity
  const bits: string[] = []
  if (id?.gradeLevel) bits.push(`Grade ${esc(id.gradeLevel)}`)
  if (id?.emisStudentId) bits.push(`EMIS ${esc(id.emisStudentId)}`)
  return bits.join(' &middot; ')
}

function buildHtml(card: ResultCardResponseDto, exam: ExamResponseDto, schoolName?: string): string {
  const division = isDivisionCard(card)
  const printedOn = new Date().toLocaleDateString()
  const remarkBlock = (label: string, value?: string | null) =>
    `<div class="remark"><span class="remark-label">${esc(label)}:</span> ${esc(value || '—')}</div>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Report Card — ${esc(studentName(card))}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 0; }
  .card { max-width: 760px; margin: 0 auto; }
  .head { text-align: center; border-bottom: 2px solid #111; padding-bottom: 8px; margin-bottom: 12px; }
  .school { font-size: 20px; font-weight: 700; }
  .doc { font-size: 13px; color: #333; margin-top: 2px; }
  .exam { font-size: 13px; color: #333; margin-top: 2px; }
  .student { display: flex; justify-content: space-between; align-items: baseline; margin: 10px 0; }
  .student .name { font-size: 15px; font-weight: 600; }
  .student .meta { font-size: 12px; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { border: 1px solid #999; padding: 5px 8px; }
  th { background: #f0f0f0; text-align: left; }
  td.num, th.num { text-align: right; }
  td.ctr, th.ctr { text-align: center; }
  td.subj { text-align: left; }
  .components { font-size: 11px; color: #666; margin-top: 2px; }
  tr.total td { font-weight: 700; background: #fafafa; }
  .ok { color: #15803d; font-weight: 600; }
  .fail { color: #b91c1c; font-weight: 600; }
  .ab { color: #b45309; font-weight: 600; }
  .summary { display: flex; gap: 18px; flex-wrap: wrap; margin: 14px 0; }
  .sum-cell { min-width: 90px; }
  .sum-label { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: .03em; }
  .sum-value { font-size: 16px; font-weight: 700; }
  .remarks { margin-top: 10px; font-size: 12.5px; }
  .remark { margin-top: 4px; }
  .remark-label { font-weight: 600; }
  .signs { display: flex; justify-content: space-between; margin-top: 48px; font-size: 12px; color: #333; }
  .sign { text-align: center; width: 30%; }
  .sign .line { border-top: 1px solid #111; padding-top: 4px; }
  .footer { margin-top: 18px; font-size: 10.5px; color: #888; text-align: center; }
  @media print { .no-print { display: none !important; } }
  .no-print { text-align: center; margin: 12px 0; }
  .no-print button { font-size: 13px; padding: 6px 14px; cursor: pointer; }
</style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="card">
    <div class="head">
      <div class="school">${esc(schoolName || 'Report Card')}</div>
      <div class="doc">Progress Report</div>
      <div class="exam">${esc(exam.examName)} &middot; ${esc(humanizeExamType(exam.examType))}</div>
    </div>

    <div class="student">
      <div><div class="name">${esc(studentName(card))}</div><div class="meta">${studentMeta(card)}</div></div>
      <div class="meta">Printed ${esc(printedOn)}</div>
    </div>

    <table>
      <thead><tr>${tableHead(division)}</tr></thead>
      <tbody>${subjectRows(card, division)}</tbody>
    </table>

    <div class="summary">${summaryBlock(card, division)}</div>

    <div class="remarks">
      ${remarkBlock('Conduct', card.conduct)}
      ${remarkBlock('Class-Teacher Remark', card.classTeacherRemark)}
    </div>

    <div class="signs">
      <div class="sign"><div class="line">Class Teacher</div></div>
      <div class="sign"><div class="line">Principal</div></div>
      <div class="sign"><div class="line">Parent / Guardian</div></div>
    </div>

    <div class="footer">Generated by EdForge${card.status === 'published' ? ' · Published' : ' · Draft (not yet published)'}</div>
  </div>
</body>
</html>`
}

/**
 * Open a print-ready report card in a new window and trigger the print dialog.
 * No-op (returns false) if the popup is blocked.
 */
export function openReportCardPrint(
  card: ResultCardResponseDto,
  exam: ExamResponseDto,
  schoolName?: string,
): boolean {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1100')
  if (!win) return false
  win.document.open()
  win.document.write(buildHtml(card, exam, schoolName))
  win.document.close()
  // Print once the new document has laid out. The window stays open so the
  // operator can cancel / re-print / Save-as-PDF.
  win.onload = () => {
    win.focus()
    win.print()
  }
  return true
}
