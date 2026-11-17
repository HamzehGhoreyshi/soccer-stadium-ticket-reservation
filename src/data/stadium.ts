// Geometry model of Azadi Stadium's bowl, in metres.
// "Pitch frame": u runs along the pitch length (north = +u), v across it (east = +v).
// Azadi is an oval two-tier bowl wrapped around an athletics track; we model each
// ring as a superellipse so the shape reads like the real stadium from above.
//
// Distances derived from this model are approximations (shown as "تقریبی" in the UI).

import { CATEGORIES, type CategoryId } from './match'

export type Tier = 'lower' | 'upper'
export type Zone = 'halfway' | 'corner' | 'end'
export type Stand = 'north' | 'south' | 'east' | 'west'
export type SectionStatus = 'available' | 'soldout' | 'closed'

export interface Pt {
  u: number
  v: number
}

export interface Ring {
  a: number // half-axis along u
  b: number // half-axis along v
}

export const PITCH = { length: 105, width: 68 }
export const GOALS: Pt[] = [
  { u: PITCH.length / 2, v: 0 },
  { u: -PITCH.length / 2, v: 0 },
]

const N = 3 // superellipse exponent: 2 = ellipse, higher = squarer
export const RINGS = {
  track: { a: 70, b: 51 },
  lowerIn: { a: 74, b: 55 },
  lowerOut: { a: 96, b: 77 },
  upperIn: { a: 100, b: 81 },
  upperOut: { a: 126, b: 107 },
} satisfies Record<string, Ring>

export const TIERS: Record<Tier, { inner: Ring; outer: Ring; count: number; rows: number; front: number; back: number; first: number }> = {
  lower: { inner: RINGS.lowerIn, outer: RINGS.lowerOut, count: 20, rows: 14, front: 10, back: 14, first: 101 },
  upper: { inner: RINGS.upperIn, outer: RINGS.upperOut, count: 24, rows: 16, front: 11, back: 15, first: 201 },
}

export function superPoint(theta: number, r: Ring): Pt {
  const c = Math.cos(theta)
  const s = Math.sin(theta)
  return {
    u: r.a * Math.sign(c) * Math.abs(c) ** (2 / N),
    v: r.b * Math.sign(s) * Math.abs(s) ** (2 / N),
  }
}

export const lerpRing = (a: Ring, b: Ring, t: number): Ring => ({ a: a.a + (b.a - a.a) * t, b: a.b + (b.b - a.b) * t })

export interface Section {
  id: string // "104"
  number: number
  tier: Tier
  zone: Zone
  stand: Stand
  category: CategoryId
  status: SectionStatus
  theta0: number
  theta1: number
  rows: number
  seatsInRow: number[] // index 0 = row 1 (front)
}

const deg = (d: number) => (d * Math.PI) / 180
const angDist = (a: number, b: number) => {
  const d = Math.abs(((a - b) % 360) + 360) % 360
  return Math.min(d, 360 - d)
}

function zoneOf(centerDeg: number): Zone {
  const toEnd = Math.min(angDist(centerDeg, 0), angDist(centerDeg, 180))
  const toSide = Math.min(angDist(centerDeg, 90), angDist(centerDeg, 270))
  if (toEnd <= 20) return 'end'
  if (toSide <= 20) return 'halfway'
  return 'corner'
}

function standOf(centerDeg: number): Stand {
  const d = ((centerDeg % 360) + 360) % 360
  if (d <= 45 || d >= 315) return 'north'
  if (d < 135) return 'east'
  if (d <= 225) return 'south'
  return 'west'
}

function categoryOf(tier: Tier, zone: Zone): CategoryId {
  if (tier === 'lower') return zone === 'halfway' ? 'c1' : zone === 'corner' ? 'c2' : 'c3'
  return zone === 'halfway' ? 'c2' : 'c3'
}

// Demo availability: the main-stand VIP block is not on public sale, a few blocks are sold out.
const CLOSED = new Set([116])
const SOLD_OUT = new Set([106, 111, 213])

function buildTier(tier: Tier): Section[] {
  const t = TIERS[tier]
  const span = 360 / t.count
  return Array.from({ length: t.count }, (_, i) => {
    const center = i * span
    const zone = zoneOf(center)
    const number = t.first + i
    const gap = tier === 'lower' ? 0.9 : 0.7
    return {
      id: String(number),
      number,
      tier,
      zone,
      stand: standOf(center),
      category: categoryOf(tier, zone),
      status: CLOSED.has(number) ? 'closed' : SOLD_OUT.has(number) ? 'soldout' : 'available',
      theta0: deg(center - span / 2 + gap / 2),
      theta1: deg(center + span / 2 - gap / 2),
      rows: t.rows,
      seatsInRow: Array.from({ length: t.rows }, (_, r) => Math.round(t.front + ((t.back - t.front) * r) / (t.rows - 1))),
    } satisfies Section
  })
}

export const SECTIONS: Section[] = [...buildTier('lower'), ...buildTier('upper')]
export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]))

/** Outline polygon of a section in the pitch frame. */
export function sectionPolygon(s: Section, steps = 10): Pt[] {
  const { inner, outer } = TIERS[s.tier]
  const pts: Pt[] = []
  for (let k = 0; k <= steps; k++) pts.push(superPoint(s.theta0 + ((s.theta1 - s.theta0) * k) / steps, inner))
  for (let k = steps; k >= 0; k--) pts.push(superPoint(s.theta0 + ((s.theta1 - s.theta0) * k) / steps, outer))
  return pts
}

export function sectionCenter(s: Section): Pt {
  const { inner, outer } = TIERS[s.tier]
  return superPoint((s.theta0 + s.theta1) / 2, lerpRing(inner, outer, 0.5))
}

/**
 * Physical location of a seat. Seat 1 is on the seat-holder's right when facing the pitch,
 * which in our angular parameterisation is the smallest angle.
 */
export function seatPosition(s: Section, row: number, seat: number): Pt {
  const { inner, outer } = TIERS[s.tier]
  const n = s.seatsInRow[row - 1]
  const f = (seat - 0.5) / n
  const t = (row - 0.5) / s.rows
  return superPoint(s.theta0 + (s.theta1 - s.theta0) * f, lerpRing(inner, outer, t))
}

export interface SeatStats {
  toCenter: number
  toGoal: number
  height: number
}

export function seatStats(s: Section, row: number, seat: number): SeatStats {
  const p = seatPosition(s, row, seat)
  const toCenter = Math.hypot(p.u, p.v)
  const toGoal = Math.min(...GOALS.map((g) => Math.hypot(p.u - g.u, p.v - g.v)))
  // Approximate eye height above the pitch: lower tier rakes from ~1.5 m, upper tier starts ~14 m up.
  const height = s.tier === 'lower' ? 1.5 + (row - 1) * 0.45 : 14 + (row - 1) * 0.6
  return { toCenter, toGoal, height }
}

export const TIER_LABEL: Record<Tier, string> = { lower: 'طبقهٔ پایین', upper: 'طبقهٔ بالا' }
export const ZONE_LABEL: Record<Zone, string> = { halfway: 'میانهٔ زمین', corner: 'گوشهٔ زمین', end: 'پشت دروازه' }
export const STAND_LABEL: Record<Stand, string> = {
  north: 'جایگاه شمالی',
  south: 'جایگاه جنوبی',
  east: 'جایگاه شرقی',
  west: 'جایگاه غربی',
}

export const sectionPrice = (s: Section) => CATEGORIES[s.category].price
