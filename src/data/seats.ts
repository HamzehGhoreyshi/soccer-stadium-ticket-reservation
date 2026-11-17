// Deterministic demo seat availability. Same section always yields the same layout,
// so reloading or sharing a link shows identical seats.

import type { Section } from './stadium'
import { isDemoBooked } from '../state/demoBookings'

export type SeatState = 'available' | 'taken'

export interface Seat {
  id: string // "104-16-2"
  section: string
  row: number
  number: number
  state: SeatState
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const OCCUPANCY: Record<string, number> = { c1: 0.62, c2: 0.55, c3: 0.48 }
const cache = new Map<string, Seat[][]>()

/** Rows of seats (index 0 = row 1, front). Seats within a row ordered from seat 1. */
export function seatsFor(section: Section): Seat[][] {
  const hit = cache.get(section.id)
  if (hit) return hit
  const rand = mulberry32(section.number * 7919)
  const base = section.status === 'available' ? OCCUPANCY[section.category] : 1
  const rows = section.seatsInRow.map((n, r) => {
    // Front rows sell first; bookings come in small groups, so occupancy is clustered.
    const rowBias = base + (0.18 * (section.rows - r)) / section.rows - 0.06
    const seats: Seat[] = []
    let i = 0
    while (i < n) {
      const group = 1 + Math.floor(rand() * 3)
      const taken = base >= 1 || rand() < rowBias
      for (let g = 0; g < group && i < n; g++, i++) {
        seats.push({
          id: `${section.id}-${r + 1}-${i + 1}`,
          section: section.id,
          row: r + 1,
          number: i + 1,
          state: taken ? 'taken' : 'available',
        })
      }
    }
    return seats
  })
  cache.set(section.id, rows)
  return rows
}

export function availableCount(section: Section) {
  if (section.status !== 'available') return 0
  return seatsFor(section).reduce((n, row) => n + row.filter((s) => stateOf(s) === 'available').length, 0)
}

export function parseSeatId(id: string) {
  const [section, row, number] = id.split('-')
  return { section, row: Number(row), number: Number(number) }
}

export function findSeat(section: Section, row: number, number: number): Seat | undefined {
  return seatsFor(section)[row - 1]?.[number - 1]
}

/** Seat state including seats booked through the demo checkout in this session. */
export const stateOf = (seat: Seat): SeatState => (isDemoBooked(seat.id) ? 'taken' : seat.state)
