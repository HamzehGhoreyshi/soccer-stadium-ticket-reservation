import { useSyncExternalStore } from 'react'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', cb)
      return () => m.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
  )
}

/** Desktop layout: side panel + large canvas. Below this, the mobile/tablet layout is used. */
export const DESKTOP = '(min-width: 1024px)'
export const useIsDesktop = () => useMediaQuery(DESKTOP)
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
