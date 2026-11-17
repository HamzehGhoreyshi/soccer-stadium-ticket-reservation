// Tiny hash router. The URL is the single source of truth for the booking selection,
// so every screen reads the same section/seat, deep links work and the browser back
// button walks the journey naturally.
//
//   #/                       stadium overview
//   #/s/104                  seat selection in section 104
//   #/s/104?seat=104-16-2    …with a seat selected
//   #/v/104-16-2             real view from that seat
//   #/checkout/104-16-2      ticket confirmation

import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'overview' }
  | { name: 'seats'; section: string; seat?: string }
  | { name: 'view'; seat: string }
  | { name: 'checkout'; seat: string }

export function parse(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const params = new URLSearchParams(query)
  if (parts[0] === 's' && parts[1]) return { name: 'seats', section: parts[1], seat: params.get('seat') ?? undefined }
  if (parts[0] === 'v' && parts[1]) return { name: 'view', seat: parts[1] }
  if (parts[0] === 'checkout' && parts[1]) return { name: 'checkout', seat: parts[1] }
  return { name: 'overview' }
}

export function href(r: Route): string {
  switch (r.name) {
    case 'overview':
      return '#/'
    case 'seats':
      return `#/s/${r.section}${r.seat ? `?seat=${r.seat}` : ''}`
    case 'view':
      return `#/v/${r.seat}`
    case 'checkout':
      return `#/checkout/${r.seat}`
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parse(hash)
}

/** Navigate. `replace` swaps the history entry (used for in-screen seat changes). */
export function go(r: Route, opts: { replace?: boolean } = {}) {
  const next = href(r)
  if (opts.replace) {
    history.replaceState(null, '', next)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = next.slice(1)
  }
}
