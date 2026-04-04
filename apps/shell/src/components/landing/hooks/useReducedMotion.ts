import { useMediaQuery } from './useMediaQuery'

/**
 * Returns true when the user has enabled "reduce motion" in their OS settings.
 * All framer-motion and CSS animations should check this flag and skip/shorten accordingly.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
