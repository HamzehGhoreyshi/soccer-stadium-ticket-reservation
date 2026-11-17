// Detailed seat map for one section. Rows run front (row 1, nearest the pitch, at the top)
// to back. Seat 1 sits on the right, matching the seat-holder's right when facing the pitch.
// Seats are real buttons for screen readers and support arrow-key navigation.

import { useRef } from 'react'
import { seatsFor, stateOf, type Seat } from '../data/seats'
import type { Section } from '../data/stadium'
import { fa } from '../lib/format'

const P = 26 // seat pitch
const RP = 26 // row pitch
const SIDE = 22 // room for row numbers
const TOP = 34 // room for the "pitch" marker

export function seatMapSize(section: Section) {
  const max = Math.max(...section.seatsInRow)
  return { w: max * P + SIDE * 2, h: section.rows * RP + TOP + 8 }
}

function seatXY(section: Section, row: number, n: number, i: number) {
  const { w } = seatMapSize(section)
  return { x: w / 2 + ((n + 1) / 2 - i) * P, y: TOP + (row - 0.5) * RP }
}

interface Props {
  section: Section
  selectedId?: string
  onSelect: (seat: Seat) => void
}

export function SeatMap({ section, selectedId, onSelect }: Props) {
  const ref = useRef<SVGSVGElement>(null)
  const rows = seatsFor(section)
  const { w, h } = seatMapSize(section)
  const firstAvailable = rows.flat().find((s) => stateOf(s) === 'available')?.id
  const tabbable = selectedId ?? firstAvailable

  const focusSeat = (row: number, num: number) => {
    const el = ref.current?.querySelector<SVGGElement>(`[data-seat="${section.id}-${row}-${num}"]`)
    el?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent, s: Seat) => {
    const n = section.seatsInRow[s.row - 1]
    const move: Record<string, [number, number]> = {
      // RTL: seat numbers increase to the left.
      ArrowLeft: [0, 1],
      ArrowRight: [0, -1],
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (stateOf(s) === 'available') onSelect(s)
      return
    }
    const m = move[e.key]
    if (!m) return
    e.preventDefault()
    const row = Math.min(section.rows, Math.max(1, s.row + m[0]))
    let num = s.number + m[1]
    if (m[0]) {
      // Keep roughly the same horizontal position when changing rows of different widths.
      const n2 = section.seatsInRow[row - 1]
      num = Math.round(s.number + (n2 - n) / 2)
      num = Math.min(n2, Math.max(1, num))
    }
    num = Math.min(section.seatsInRow[row - 1], Math.max(1, num))
    focusSeat(row, num)
  }

  return (
    <svg
      ref={ref}
      className="seat-map"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={`صندلی‌های جایگاه ${fa(section.number)}`}
    >
      <g className="seat-map__pitch" aria-hidden="true">
        <path d={`M${SIDE + 30},${TOP - 14} L${w - SIDE - 30},${TOP - 14}`} className="seat-map__pitch-line" />
        <text x={w / 2} y={TOP - 20} className="seat-map__pitch-label">
          زمین بازی
        </text>
      </g>
      {rows.map((seats, r) => {
        const row = r + 1
        const n = seats.length
        const y = TOP + (row - 0.5) * RP
        const half = (n * P) / 2
        return (
          <g key={row}>
            <text x={w / 2 + half + 12} y={y} className="seat-map__row" aria-hidden="true">
              {fa(row)}
            </text>
            <text x={w / 2 - half - 12} y={y} className="seat-map__row" aria-hidden="true">
              {fa(row)}
            </text>
            {seats.map((s) => {
              const { x } = seatXY(section, row, n, s.number)
              const state = stateOf(s)
              const selected = s.id === selectedId
              return (
                <g
                  key={s.id}
                  data-seat={s.id}
                  className={`seat seat--${selected ? 'selected' : state}`}
                  transform={`translate(${x},${y})`}
                  role="button"
                  tabIndex={s.id === tabbable ? 0 : -1}
                  aria-disabled={state === 'taken' || undefined}
                  aria-pressed={selected}
                  aria-label={`ردیف ${fa(row)}، صندلی ${fa(s.number)}${state === 'taken' ? '، رزرو شده' : ''}`}
                  onClick={() => state === 'available' && onSelect(s)}
                  onKeyDown={(e) => onKeyDown(e, s)}
                >
                  <rect x={-P / 2} y={-RP / 2} width={P} height={RP} className="seat__hit" />
                  <rect x={-9.5} y={-8.5} width={19} height={17} rx={5} className="seat__body" />
                  {selected && <path d="M-4.5,0.2 L-1.3,3.4 L4.6,-3" className="seat__check" />}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
