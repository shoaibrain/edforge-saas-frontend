import type { ReactNode } from 'react'

/**
 * Icon paths, sourced 1:1 from the design bundle brand.jsx.
 *
 * Each entry is the inner <path>/<g> content for a 24x24 viewBox.
 * The <Icon> wrapper supplies the <svg>, stroke color, and a11y attributes.
 */
export const ICON_PATHS = {
  check: <polyline points="4 12 10 18 20 6" />,
  arrow: (
    <g>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="14 6 20 12 14 18" />
    </g>
  ),
  play: <polygon points="8 5 19 12 8 19 8 5" fill="currentColor" stroke="none" />,
  core: (
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1" />
    </g>
  ),
  analytics: (
    <g>
      <polyline points="3 17 9 11 13 15 21 7" />
      <polyline points="14 7 21 7 21 14" />
    </g>
  ),
  finance: (
    <g>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16" cy="15" r="1.5" fill="currentColor" />
    </g>
  ),
  shield: <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-0.5-8-4-8-9V6l8-3z" />,
  school: (
    <g>
      <path d="M3 10l9-5 9 5" />
      <path d="M5 10v9h14v-9" />
      <path d="M10 19v-6h4v6" />
    </g>
  ),
  users: (
    <g>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 19c0-2.5 1.8-4.5 4-4.5" />
    </g>
  ),
  student: (
    <g>
      <path d="M3 10l9-4 9 4-9 4-9-4z" />
      <path d="M6 12v4c2 1.5 4 2 6 2s4-0.5 6-2v-4" />
    </g>
  ),
  bolt: <polygon points="13 2 4 14 11 14 9 22 20 10 13 10 13 2" />,
  book: (
    <g>
      <path d="M4 5c0-1 1-2 2-2h13v16H6c-1 0-2 0.8-2 2V5z" />
      <path d="M4 19c0-1 1-2 2-2h13" />
    </g>
  ),
  lock: (
    <g>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </g>
  ),
  chat: (
    <g>
      <path d="M4 5h16v11H9l-5 4z" />
    </g>
  ),
  calendar: (
    <g>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </g>
  ),
  sparkle: (
    <g>
      <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
    </g>
  ),
  globe: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </g>
  ),
  api: (
    <g>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M7 10h3M7 14h2M14 10h3M14 14h3" />
    </g>
  ),
  clipboard: (
    <g>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M9 11h6M9 15h4" />
    </g>
  ),
  flag: (
    <g>
      <path d="M5 3v18" />
      <path d="M5 4h12l-2 4 2 4H5" />
    </g>
  ),
  chev: <polyline points="6 9 12 15 18 9" />,
  arrowUp: (
    <g>
      <line x1="12" y1="20" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </g>
  ),
  life: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M5.6 5.6l2.9 2.9M15.5 15.5l2.9 2.9M18.4 5.6l-2.9 2.9M8.5 15.5l-2.9 2.9" />
    </g>
  ),
  privacy: (
    <g>
      <rect x="5" y="9" width="14" height="12" rx="2" />
      <path d="M8 9V7a4 4 0 0 1 8 0v2" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </g>
  ),
  mail: (
    <g>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 8l9 6 9-6" />
    </g>
  ),
  info: (
    <g>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </g>
  ),
} as const satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICON_PATHS
