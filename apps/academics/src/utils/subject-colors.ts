/**
 * Subject Chip Color Utilities
 *
 * Maps subject area strings to V2-consistent background/text color pairs.
 * Uses inline rgba styles to work in both dark and light themes.
 */

export function getSubjectChipStyle(subject: string): { bg: string; text: string } {
  const s = subject?.toLowerCase() ?? ''

  if (s.includes('math'))
    return { bg: 'rgba(127,119,221,0.10)', text: '#7F77DD' }
  if (s.includes('science'))
    return { bg: 'rgba(29,158,117,0.10)', text: 'var(--color-success, #1D9E75)' }
  if (s.includes('english') || s.includes('ela'))
    return { bg: 'rgba(216,90,48,0.10)', text: '#D85A30' }
  if (s.includes('social') || s.includes('history'))
    return { bg: 'rgba(55,138,221,0.10)', text: 'var(--color-info, #378ADD)' }
  if (s.includes('art') || s.includes('music') || s.includes('drama'))
    return { bg: 'rgba(90,96,112,0.12)', text: 'var(--text-secondary, #7a8099)' }
  if (s.includes('voc') || s.includes('tech') || s.includes('auto'))
    return { bg: 'rgba(239,159,39,0.10)', text: 'var(--color-warning, #EF9F27)' }
  if (s.includes('pe') || s.includes('physical'))
    return { bg: 'rgba(29,158,117,0.08)', text: 'var(--color-success, #1D9E75)' }

  return { bg: 'rgba(90,96,112,0.10)', text: 'var(--text-hint, #5a6070)' }
}
