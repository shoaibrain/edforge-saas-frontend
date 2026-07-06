/**
 * EdForge — Signature animated icons (curated education-domain set).
 *
 * Ported verbatim from the Claude Design prototype (iconsys/icons.jsx). Each stroked
 * element carries pathLength={1} so trace/draw signatures work on any shape; sub-elements
 * carry part class names that packages/theme/src/icon-motion.css targets. Do NOT animate
 * here — CSS owns the motion, keyed off `.ef-motion` / `[role="tab"]` ancestors. This file
 * only renders the resting glyph. The retired Finance `$` glyph is intentionally NOT shipped
 * (Finance now renders the curated Wallet / coin-deposit mark).
 */
import type { ReactNode } from 'react';

export type IconName =
  | 'home' | 'academics' | 'people' | 'finance' | 'settings'
  | 'finance_receipt' | 'finance_note' | 'overview' | 'students' | 'classrooms'
  | 'curriculum' | 'exams' | 'attendance' | 'staff' | 'family'
  | 'profile' | 'enrollment' | 'demographics' | 'metric_attendance' | 'gpa'
  | 'sections' | 'fees' | 'atrisk' | 'create' | 'export'
  | 'search' | 'filter' | 'edit' | 'remove' | 'more'
  | 'refresh' | 'notifications' | 'workspace' | 'configuration' | 'account'
  | 'preferences' | 'security' | 'organization' | 'rbac' | 'authdebug'
  | 'academicsetup' | 'structure' | 'gradelevels' | 'auditlog';

const P = "1"; // pathLength normalizer so trace/draw works on every shape

function Gear({ cog }: { cog: string }) {
  return (
    <>
      <path className={cog} pathLength={P} d="M12.2 2h-.4a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle className="g-core" pathLength={P} cx="12" cy="12" r="3" />
    </>
  );
}

export const ICON_PARTS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path className="h-body" pathLength={P} d="M3 9.6 12 2.5l9 7.1V20a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 20Z" />
      <path className="h-door" pathLength={P} d="M9.2 21.6v-7.2h5.6v7.2" />
    </>
  ),
  academics: (
    <>
      <path className="a-board" pathLength={P} d="M12 4 22 8.5 12 13 2 8.5Z" />
      <path className="a-cup" pathLength={P} d="M6 10.2V14c0 1.7 2.7 3 6 3s6-1.3 6-3v-3.8" />
      <line className="a-tassel" pathLength={P} x1="21.5" y1="8.9" x2="21.5" y2="15.5" />
      <circle className="a-bead" cx="21.5" cy="16.4" r="0.95" fill="currentColor" stroke="none" />
    </>
  ),
  people: (
    <>
      <circle className="pp-f-head" pathLength={P} cx="9.4" cy="8" r="3.4" />
      <path className="pp-f-body" pathLength={P} d="M3.3 20.8v-.7c0-2.8 2.8-4.6 6.1-4.6 1.3 0 2.6.3 3.6.9" />
      <g className="pp-back">
        <circle pathLength={P} cx="16.6" cy="8.3" r="2.6" />
        <path pathLength={P} d="M16 15.5c2.7.1 4.7 1.9 4.7 4.6v.7" />
      </g>
    </>
  ),
  /* FINANCE — the fix. Wallet with a coin that deposits on interaction. */
  finance: (
    <>
      <rect className="wl-body" pathLength={P} x="3" y="7" width="18" height="13" rx="2.6" />
      <path className="wl-pocket" pathLength={P} d="M21 11.6h-4.4a2.2 2.2 0 0 0 0 4.4H21" />
      <circle className="wl-clasp" cx="16.7" cy="13.8" r="1" fill="currentColor" stroke="none" />
      <circle className="wl-coin" pathLength={P} cx="11" cy="11" r="2.5" />
      <path className="wl-coin-s" pathLength={P} d="M11 9.6v2.8M9.9 10.3h1.7a.7.7 0 0 1 0 1.4H10.4a.7.7 0 0 0 0 1.4h1.7" />
    </>
  ),
  settings: <Gear cog="g-cog" />,

  /* ---------- finance alternatives (toggle) ---------- */
  finance_receipt: (
    <>
      <path className="rc-body" pathLength={P} d="M5 2.6h14v18.8l-2.3-1.5-2.35 1.5L12 19.9l-2.35 1.5L7.3 19.9 5 21.4Z" />
      <line className="rc-l1" pathLength={P} x1="8.3" y1="8" x2="15.7" y2="8" />
      <line className="rc-l2" pathLength={P} x1="8.3" y1="11.4" x2="15.7" y2="11.4" />
      <line className="rc-l3" pathLength={P} x1="8.3" y1="14.8" x2="13" y2="14.8" />
    </>
  ),
  finance_note: (
    <>
      <rect className="bn-bill" pathLength={P} x="2.5" y="7" width="19" height="10" rx="2" />
      <circle className="bn-coin" pathLength={P} cx="12" cy="12" r="2.7" />
      <circle cx="6" cy="12" r=".7" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  overview: (
    <>
      <rect className="ov-1" pathLength={P} x="3" y="3" width="7.5" height="8.5" rx="1.4" />
      <rect className="ov-2" pathLength={P} x="13.5" y="3" width="7.5" height="5" rx="1.4" />
      <rect className="ov-3" pathLength={P} x="13.5" y="11" width="7.5" height="10" rx="1.4" />
      <rect className="ov-4" pathLength={P} x="3" y="14.5" width="7.5" height="6.5" rx="1.4" />
    </>
  ),
  students: (
    <>
      <path className="sd-cap" pathLength={P} d="M4.5 6.4 12 3.2l7.5 3.2L12 9.6Z" />
      <path className="sd-tas" pathLength={P} d="M19.5 6.4v3.4" />
      <circle className="sd-head" pathLength={P} cx="12" cy="12.6" r="2.7" />
      <path className="sd-body" pathLength={P} d="M6.4 21a5.6 5.6 0 0 1 11.2 0" />
    </>
  ),
  classrooms: (
    <>
      <rect className="cl-board" pathLength={P} x="3" y="3.5" width="18" height="12" rx="1.8" />
      <path className="cl-line" pathLength={P} d="M6.5 12 10 8.4l2.6 2.2L17.6 6" />
      <line className="cl-stand" pathLength={P} x1="12" y1="15.5" x2="12" y2="18.6" />
      <path className="cl-feet" pathLength={P} d="M8.5 21 12 18.6 15.5 21" />
    </>
  ),
  curriculum: (
    <>
      <path className="bk-spine" pathLength={P} d="M12 6.6v13.8" />
      <path className="bk-left" pathLength={P} d="M12 6.6C10.5 5.5 8.5 5 6 5H3.4a.9.9 0 0 0-.9.9v11.6a.9.9 0 0 0 .9.9H6c2.5 0 4.5.5 6 1.6" />
      <path className="bk-right" pathLength={P} d="M12 6.6C13.5 5.5 15.5 5 18 5h2.6a.9.9 0 0 1 .9.9v11.6a.9.9 0 0 1-.9.9H18c-2.5 0-4.5.5-6 1.6" />
    </>
  ),
  exams: (
    <>
      <rect className="ex-board" pathLength={P} x="4" y="4.2" width="16" height="16.8" rx="2.2" />
      <rect className="ex-clip" pathLength={P} x="9" y="2.4" width="6" height="3.4" rx="1.1" />
      <path className="ex-check" pathLength={P} d="m8.4 13 2.4 2.4 4.8-4.8" />
    </>
  ),
  attendance: (
    <>
      <g className="at-cal">
        <rect pathLength={P} x="3" y="4.6" width="18" height="16.4" rx="2.2" />
        <line pathLength={P} x1="3" y1="9.2" x2="21" y2="9.2" />
        <line pathLength={P} x1="8" y1="2.5" x2="8" y2="6" />
        <line pathLength={P} x1="16" y1="2.5" x2="16" y2="6" />
      </g>
      <path className="at-check" pathLength={P} d="m8.5 14.8 2.4 2.4 4.6-4.6" />
    </>
  ),

  /* ---------- people / staff ---------- */
  staff: (
    <>
      <path className="sf-lan" pathLength={P} d="M8.5 3 12 6.4 15.5 3" />
      <rect className="sf-badge" pathLength={P} x="5" y="6.2" width="14" height="15.2" rx="2.2" />
      <circle className="sf-photo" pathLength={P} cx="12" cy="11.2" r="2.4" />
      <line className="sf-l1" pathLength={P} x1="8.4" y1="16.4" x2="15.6" y2="16.4" />
      <line className="sf-l2" pathLength={P} x1="9.6" y1="18.8" x2="14.4" y2="18.8" />
    </>
  ),
  family: (
    <>
      <circle className="fm-p-head" pathLength={P} cx="8" cy="8" r="3" />
      <path className="fm-p-body" pathLength={P} d="M2.8 20.6v-.5c0-2.6 2.4-4.3 5.2-4.3 1 0 2 .2 2.8.6" />
      <g className="fm-child">
        <circle pathLength={P} cx="16.8" cy="11" r="2.3" />
        <path pathLength={P} d="M13.2 20.6v-.4c0-2 1.6-3.4 3.6-3.4s3.6 1.4 3.6 3.4v.4" />
      </g>
    </>
  ),

  /* ---------- student record tabs ---------- */
  profile: (
    <>
      <circle className="ac-ring" pathLength={P} cx="12" cy="12" r="9.3" />
      <circle className="ac-head" pathLength={P} cx="12" cy="10" r="3" />
      <path className="ac-body" pathLength={P} d="M6.4 19.4a5.7 5.7 0 0 1 11.2 0" />
    </>
  ),
  enrollment: (
    <>
      <circle className="en-head" pathLength={P} cx="9.6" cy="8" r="3.3" />
      <path className="en-body" pathLength={P} d="M3.8 20.6v-.7c0-2.8 2.6-4.7 5.8-4.7.9 0 1.8.1 2.6.4" />
      <g className="en-plus">
        <line pathLength={P} x1="18.5" y1="14" x2="18.5" y2="20" />
        <line pathLength={P} x1="15.5" y1="17" x2="21.5" y2="17" />
      </g>
    </>
  ),
  demographics: (
    <>
      <circle className="dm-track" pathLength={P} cx="12" cy="12" r="8.6" opacity=".35" />
      <path className="dm-s1" pathLength={P} d="M12 3.4A8.6 8.6 0 0 1 20.6 12" />
      <path className="dm-s2" pathLength={P} d="M20.6 12A8.6 8.6 0 0 1 13.5 20.5" />
      <circle className="dm-core" pathLength={P} cx="12" cy="12" r="2.6" />
    </>
  ),

  /* ---------- metrics & status ---------- */
  metric_attendance: (
    <>
      <circle className="tg-r1" pathLength={P} cx="12" cy="12" r="9" />
      <circle className="tg-r2" pathLength={P} cx="12" cy="12" r="5.2" />
      <circle className="tg-dot" cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  gpa: (
    <>
      <path className="aw-ribbon" pathLength={P} d="M9.2 11 6.6 3.4M14.8 11 17.4 3.4" />
      <circle className="aw-medal" pathLength={P} cx="12" cy="15.4" r="5.6" />
      <path className="aw-star" pathLength={P} d="M12 12.3l.95 1.92 2.12.3-1.53 1.5.36 2.1L12 16.64l-1.9 1 .36-2.1-1.53-1.5 2.12-.3Z" />
    </>
  ),
  sections: (
    <>
      <rect className="ov-1" pathLength={P} x="3.4" y="3.4" width="7.2" height="7.2" rx="1.4" />
      <rect className="ov-2" pathLength={P} x="13.4" y="3.4" width="7.2" height="7.2" rx="1.4" />
      <rect className="ov-3" pathLength={P} x="3.4" y="13.4" width="7.2" height="7.2" rx="1.4" />
      <rect className="ov-4" pathLength={P} x="13.4" y="13.4" width="7.2" height="7.2" rx="1.4" />
    </>
  ),
  fees: (
    <>
      <path className="rc-body" pathLength={P} d="M5 2.6h14v18.8l-2.3-1.5-2.35 1.5L12 19.9l-2.35 1.5L7.3 19.9 5 21.4Z" />
      <line className="rc-l1" pathLength={P} x1="8.3" y1="8" x2="15.7" y2="8" />
      <line className="rc-l2" pathLength={P} x1="8.3" y1="11.4" x2="15.7" y2="11.4" />
      <line className="rc-l3" pathLength={P} x1="8.3" y1="14.8" x2="13" y2="14.8" />
    </>
  ),
  atrisk: (
    <>
      <path className="ar-tri" pathLength={P} d="M10.3 3.4 1.85 18a2 2 0 0 0 1.7 3h16.9a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0Z" />
      <line className="ar-bang" pathLength={P} x1="12" y1="9" x2="12" y2="13.6" />
      <circle className="ar-dot" cx="12" cy="16.8" r="1.05" fill="currentColor" stroke="none" />
    </>
  ),

  /* ---------- actions & toolbar ---------- */
  create: (
    <g className="cr-plus">
      <line pathLength={P} x1="12" y1="5" x2="12" y2="19" />
      <line pathLength={P} x1="5" y1="12" x2="19" y2="12" />
    </g>
  ),
  export: (
    <>
      <path className="ex-tray" pathLength={P} d="M4 15.5v3A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <g className="ex-arr">
        <line pathLength={P} x1="12" y1="4" x2="12" y2="14.6" />
        <path pathLength={P} d="m8 10.6 4 4 4-4" />
      </g>
    </>
  ),
  search: (
    <g className="se-mag">
      <circle pathLength={P} cx="10.5" cy="10.5" r="6.6" />
      <line pathLength={P} x1="15.4" y1="15.4" x2="20.5" y2="20.5" />
    </g>
  ),
  filter: (
    <>
      <path className="fl-funnel" pathLength={P} d="M3 5h18l-7 8v5.5l-4 2V13Z" />
      <circle className="fl-drop" cx="12" cy="4" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  edit: (
    <g className="ed-pen">
      <path pathLength={P} d="M16.4 4.4 19.6 7.6 8.4 18.8l-4.2 1 1-4.2Z" />
      <line pathLength={P} x1="14.4" y1="6.4" x2="17.6" y2="9.6" />
    </g>
  ),
  remove: (
    <>
      <g className="tr-lid">
        <line pathLength={P} x1="4" y1="6.4" x2="20" y2="6.4" />
        <path pathLength={P} d="M9.4 6.4V5a1.5 1.5 0 0 1 1.5-1.5h2.2A1.5 1.5 0 0 1 14.6 5v1.4" />
      </g>
      <path className="tr-can" pathLength={P} d="M5.9 6.8 6.7 19a2 2 0 0 0 2 1.9h6.6a2 2 0 0 0 2-1.9l.8-12.2" />
      <line pathLength={P} x1="10" y1="10.6" x2="10" y2="16.6" />
      <line pathLength={P} x1="14" y1="10.6" x2="14" y2="16.6" />
    </>
  ),
  more: (
    <>
      <circle className="me-1" cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle className="me-2" cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle className="me-3" cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </>
  ),
  refresh: (
    <g className="rf-spin">
      <path pathLength={P} d="M20.5 12a8.5 8.5 0 1 1-2.4-5.9" />
      <path pathLength={P} d="M20.8 4.5v4.2h-4.2" />
    </g>
  ),
  notifications: (
    <>
      <path className="bl-bell" pathLength={P} d="M18 9.5a6 6 0 0 0-12 0c0 5.5-2.4 6.8-2.4 6.8h16.8S18 15 18 9.5Z" />
      <path className="bl-clap" pathLength={P} d="M10.3 19.4a2 2 0 0 0 3.4 0" />
    </>
  ),
  workspace: <Gear cog="ws-cog" />,
  configuration: <Gear cog="cf-cog" />,
  account: (
    <>
      <circle className="ac-ring" pathLength={P} cx="12" cy="8.6" r="3.8" />
      <circle className="ac-head" pathLength={P} cx="12" cy="8.6" r="3.8" />
      <path className="ac-body" pathLength={P} d="M5 20.6a7 7 0 0 1 14 0" />
    </>
  ),
  preferences: (
    <>
      <line pathLength={P} x1="3" y1="6.5" x2="21" y2="6.5" />
      <line pathLength={P} x1="3" y1="12" x2="21" y2="12" />
      <line pathLength={P} x1="3" y1="17.5" x2="21" y2="17.5" />
      <circle className="pf-k1" cx="8" cy="6.5" r="2.4" fill="currentColor" stroke="none" />
      <circle className="pf-k2" cx="15" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <circle className="pf-k3" cx="10" cy="17.5" r="2.4" fill="currentColor" stroke="none" />
    </>
  ),
  security: (
    <>
      <path className="sc-shield" pathLength={P} d="M20 12.4c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 19.9 4 17.4 4 12.4V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path className="sc-check" pathLength={P} d="m8.7 12 2.3 2.3 4.3-4.3" />
    </>
  ),
  organization: (
    <>
      <path pathLength={P} d="M4 21.5V4.2A1.6 1.6 0 0 1 5.6 2.6h8.8A1.6 1.6 0 0 1 16 4.2v17.3" />
      <path pathLength={P} d="M16 9h2.6a1.6 1.6 0 0 1 1.6 1.6v10.9" />
      <line pathLength={P} x1="2.5" y1="21.6" x2="21.5" y2="21.6" />
      <rect className="or-w1" pathLength={P} x="6.4" y="5.4" width="2.4" height="2.4" rx=".4" />
      <rect className="or-w2" pathLength={P} x="11.1" y="5.4" width="2.4" height="2.4" rx=".4" />
      <rect className="or-w3" pathLength={P} x="6.4" y="10" width="2.4" height="2.4" rx=".4" />
      <rect className="or-w4" pathLength={P} x="11.1" y="10" width="2.4" height="2.4" rx=".4" />
      <path className="or-door" pathLength={P} d="M8.7 21.5v-4.3h2.8v4.3" />
    </>
  ),
  rbac: (
    <g className="rb-key">
      <circle pathLength={P} cx="8" cy="8" r="4.2" />
      <line pathLength={P} x1="10.9" y1="11" x2="20" y2="20.1" />
      <line pathLength={P} x1="17.2" y1="20.2" x2="20" y2="17.4" />
      <line pathLength={P} x1="14.4" y1="17.4" x2="16.4" y2="15.4" />
    </g>
  ),
  authdebug: (
    <>
      <path className="bg-ant" pathLength={P} d="m8 3 1.9 1.9" />
      <path className="bg-ant" pathLength={P} d="M16 3l-1.9 1.9" />
      <path pathLength={P} d="M9 7.5v-.8a3 3 0 0 1 6 0v.8" />
      <path pathLength={P} d="M12 20.6c-3.3 0-6-2.7-6-6v-2.2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2.2c0 3.3-2.7 6-6 6z" />
      <line className="bg-leg" pathLength={P} x1="12" y1="20.6" x2="12" y2="10.5" />
      <path className="bg-leg" pathLength={P} d="M6 11.5C4.3 11.3 3 9.8 3 8" />
      <path className="bg-leg" pathLength={P} d="M6 14.5H2.5" />
      <path className="bg-leg" pathLength={P} d="M6 17.5c-1.9.1-3.4 1.6-3.5 3.5" />
      <path className="bg-leg" pathLength={P} d="M18 11.5c1.7-.2 3-1.7 3-3.5" />
      <path className="bg-leg" pathLength={P} d="M18 14.5h3.5" />
      <path className="bg-leg" pathLength={P} d="M18 17.5c1.9.1 3.4 1.6 3.5 3.5" />
    </>
  ),
  academicsetup: (
    <>
      <path className="bk-spine" pathLength={P} d="M12 6.6v13.8" />
      <path className="bk-left" pathLength={P} d="M12 6.6C10.5 5.5 8.5 5 6 5H3.4a.9.9 0 0 0-.9.9v11.6a.9.9 0 0 0 .9.9H6c2.5 0 4.5.5 6 1.6" />
      <path className="bk-right" pathLength={P} d="M12 6.6C13.5 5.5 15.5 5 18 5h2.6a.9.9 0 0 1 .9.9v11.6a.9.9 0 0 1-.9.9H18c-2.5 0-4.5.5-6 1.6" />
    </>
  ),
  structure: (
    <>
      <rect pathLength={P} x="9" y="2.5" width="6" height="5" rx="1.4" />
      <path className="st-l1" pathLength={P} d="M12 7.5v4.5a2 2 0 0 1-2 2H7" />
      <path className="st-l2" pathLength={P} d="M12 7.5v4.5a2 2 0 0 0 2 2h3" />
      <rect className="st-c1" pathLength={P} x="2.5" y="14" width="6" height="5" rx="1.4" />
      <rect className="st-c2" pathLength={P} x="15.5" y="14" width="6" height="5" rx="1.4" />
    </>
  ),
  gradelevels: (
    <>
      <line pathLength={P} x1="3" y1="20.6" x2="21" y2="20.6" />
      <rect className="gl-b1" pathLength={P} x="4.6" y="13" width="3.6" height="7.4" rx="1" />
      <rect className="gl-b2" pathLength={P} x="10.2" y="8.5" width="3.6" height="11.9" rx="1" />
      <rect className="gl-b3" pathLength={P} x="15.8" y="4.6" width="3.6" height="15.8" rx="1" />
    </>
  ),
  auditlog: (
    <>
      <circle pathLength={P} cx="12" cy="12" r="9" />
      <line className="al-hour" pathLength={P} x1="12" y1="12" x2="12" y2="7.6" />
      <line className="al-min" pathLength={P} x1="12" y1="12" x2="15.6" y2="13.2" />
    </>
  ),
};

export const ICON_META: Record<IconName, string> = {
  home: "hop + door squash",
  academics: "tassel swing",
  people: "figure pop-in",
  finance: "coin deposit",
  settings: "gear rotate",
  finance_receipt: "lines write + tear",
  finance_note: "coin flip",
  overview: "panel cascade",
  students: "cap lift",
  classrooms: "lesson line draws",
  curriculum: "pages flex open",
  exams: "check draws + clip",
  attendance: "calendar check",
  staff: "badge swing",
  family: "child pops in",
  profile: "ring pulse + nod",
  enrollment: "plus quarter-turn",
  demographics: "segments sweep in",
  metric_attendance: "rings converge",
  gpa: "medal swing + star",
  sections: "cells cascade",
  fees: "lines write + tear",
  atrisk: "alert shake",
  create: "quarter-turn pop",
  export: "arrow drops to tray",
  search: "lens scan",
  filter: "funnel + drop",
  edit: "pencil writes",
  remove: "lid lifts",
  more: "dots bounce",
  refresh: "spin 360",
  notifications: "bell rings",
  workspace: "gear rotate",
  configuration: "gear rotate",
  account: "pulse ring",
  preferences: "knobs slide",
  security: "check draw",
  organization: "windows light",
  rbac: "key turn",
  authdebug: "shimmy",
  academicsetup: "pages flex",
  structure: "nodes link",
  gradelevels: "bars grow",
  auditlog: "hands sweep",
};

export interface EFIconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function EFIcon({ name, size = 22, strokeWidth = 1.7, className }: EFIconProps) {
  return (
    <svg
      className={['ico', `ico-${name}`, className].filter(Boolean).join(' ')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PARTS[name] ?? null}
    </svg>
  );
}
