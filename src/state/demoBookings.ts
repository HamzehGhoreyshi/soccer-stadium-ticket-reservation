// Seats "booked" in this browser session via the demo checkout. Nothing leaves the browser;
// this only makes the demo consistent (a seat you just booked shows as taken afterwards).

import { useSyncExternalStore } from 'react'

const KEY = 'azadi-demo-bookings'
const listeners = new Set<() => void>()

function read(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

let snapshot = read()

export function addDemoBooking(seatId: string) {
  snapshot = [...new Set([...snapshot, seatId])]
  try {
    sessionStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l())
}

export function useDemoBookings(): ReadonlySet<string> {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot,
  )
  return new Set(list)
}

export const isDemoBooked = (seatId: string) => snapshot.includes(seatId)
