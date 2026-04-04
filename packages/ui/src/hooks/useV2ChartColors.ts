/**
 * useV2ChartColors — Theme-reactive chart color hook
 *
 * Provides chart colors that update when the theme toggles.
 * Recharts doesn't read CSS custom properties, so we derive
 * hex values from the resolved theme.
 */

import { useMemo } from 'react'

/**
 * Hook to get V2 chart colors based on the current theme.
 *
 * @param resolvedTheme - 'dark' | 'light' from your theme store
 */
export function useV2ChartColors(resolvedTheme: 'dark' | 'light' = 'dark') {
  return useMemo(
    () => ({
      line: '#1D9E75',
      fill: 'rgba(29, 158, 117, 0.08)',
      threshold: 'rgba(239, 159, 39, 0.35)',
      grid: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      tick: resolvedTheme === 'dark' ? '#3a4055' : '#9aa0b8',
      tooltipBg: resolvedTheme === 'dark' ? '#1e2436' : '#ffffff',
      tooltipBorder: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e0e4ec',
      pointBorder: resolvedTheme === 'dark' ? '#161b27' : '#ffffff',
    }),
    [resolvedTheme],
  )
}
