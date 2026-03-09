/**
 * Performance Metrics Hook
 *
 * Measures dashboard load performance using the Performance API.
 * Logs timing data in development mode for Sprint 1 baseline measurement.
 */

import { useEffect, useRef } from 'react'

interface PerformanceMetrics {
  coreKpiMs: number | null
  allWidgetsMs: number | null
}

/**
 * Tracks time from component mount to when core KPIs and all widgets load.
 *
 * @param coreLoaded - true when core stat cards have data
 * @param allLoaded - true when all widgets (including deferred) have data
 */
export function usePerformanceMetrics(
  coreLoaded: boolean,
  allLoaded: boolean,
): PerformanceMetrics {
  const mountTime = useRef(performance.now())
  const coreMs = useRef<number | null>(null)
  const allMs = useRef<number | null>(null)

  useEffect(() => {
    if (coreLoaded && coreMs.current === null) {
      coreMs.current = Math.round(performance.now() - mountTime.current)
      if (import.meta.env.DEV) {
        console.log(
          `[PerfMetrics] Core KPIs rendered in ${coreMs.current}ms`,
        )
      }
    }
  }, [coreLoaded])

  useEffect(() => {
    if (allLoaded && allMs.current === null) {
      allMs.current = Math.round(performance.now() - mountTime.current)
      if (import.meta.env.DEV) {
        console.log(
          `[PerfMetrics] All widgets loaded in ${allMs.current}ms`,
        )
      }
    }
  }, [allLoaded])

  return {
    coreKpiMs: coreMs.current,
    allWidgetsMs: allMs.current,
  }
}
