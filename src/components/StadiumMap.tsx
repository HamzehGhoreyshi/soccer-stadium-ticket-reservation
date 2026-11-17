// Top-down seating map of Azadi Stadium. Geometry lives in the pitch frame (metres) and is
// rotated as a whole: portrait on phones (north up), landscape on desktop (main/west stand at
// the bottom, like a TV camera view). Text is placed with project() so it stays upright.

import { memo } from 'react'
import { CATEGORIES, type CategoryId } from '../data/match'
import {
  PITCH,
  RINGS,
  SECTIONS,
  TIERS,
  sectionCenter,
  sectionPolygon,
  seatPosition,
  superPoint,
  STAND_LABEL,
  TIER_LABEL,
  ZONE_LABEL,
  type Pt,
  type Ring,
  type Section,
} from '../data/stadium'
import { fa, tomanShort } from '../lib/format'

export type Orientation = 'portrait' | 'landscape'

const MATRIX: Record<Orientation, string> = {
  portrait: 'matrix(0,-1,1,0,0,0)', // (u,v) -> (v,-u)
  landscape: 'matrix(-1,0,0,-1,0,0)', // (u,v) -> (-u,-v)
}

export const project = (p: Pt, o: Orientation) => (o === 'portrait' ? { x: p.v, y: -p.u } : { x: -p.u, y: -p.v })

const PAD = 14
export function viewBox(o: Orientation) {
  const { a, b } = RINGS.upperOut
  const [hw, hh] = o === 'portrait' ? [b + PAD, a + PAD] : [a + PAD, b + PAD]
  return { x: -hw, y: -hh, w: hw * 2, h: hh * 2 }
}

const path = (pts: Pt[]) => `M${pts.map((p) => `${p.u.toFixed(2)},${p.v.toFixed(2)}`).join('L')}Z`

function ringPath(r: Ring, steps = 120) {
  return path(Array.from({ length: steps }, (_, i) => superPoint((i / steps) * Math.PI * 2, r)))
}

const sectionPaths = new Map(SECTIONS.map((s) => [s.id, path(sectionPolygon(s))]))

export function sectionLabel(s: Section) {
  return `جایگاه ${fa(s.number)}، ${TIER_LABEL[s.tier]}، ${ZONE_LABEL[s.zone]}، ${STAND_LABEL[s.stand]}`
}

/** Pitch markings in the pitch frame (u along length). */
export const Pitch = memo(function Pitch({ detailed = true }: { detailed?: boolean }) {
  const L = PITCH.length / 2
  const W = PITCH.width / 2
  const stripes = 14
  const sw = PITCH.length / stripes
  return (
    <g className="pitch">
      <rect x={-L - 3} y={-W - 3} width={PITCH.length + 6} height={PITCH.width + 6} rx={5} className="pitch__grass" />
      {detailed &&
        Array.from({ length: stripes }, (_, i) =>
          i % 2 ? <rect key={i} x={-L + i * sw} y={-W} width={sw} height={PITCH.width} className="pitch__stripe" /> : null,
        )}
      <g className="pitch__lines">
        <rect x={-L} y={-W} width={PITCH.length} height={PITCH.width} />
        <line x1={0} y1={-W} x2={0} y2={W} />
        <circle r={9.15} />
        {detailed &&
          [1, -1].map((d) => (
            <g key={d} transform={`scale(${d},1)`}>
              <rect x={L - 16.5} y={-20.16} width={16.5} height={40.32} />
              <rect x={L - 5.5} y={-9.16} width={5.5} height={18.32} />
              <path d={`M${L - 16.5},-7.3 A9.15,9.15 0 0,0 ${L - 16.5},7.3`} />
              <rect x={L} y={-3.66} width={1.6} height={7.32} className="pitch__goal" />
            </g>
          ))}
      </g>
      <circle r={0.6} className="pitch__spot" />
    </g>
  )
})

interface Props {
  orientation: Orientation
  selectedId?: string
  hoveredId?: string
  filter?: CategoryId | null
  availability: Map<string, number>
  onSelect?: (s: Section, el: SVGPathElement) => void
  onHover?: (s: Section | null) => void
  onUnavailable?: (s: Section) => void
}

export function StadiumMap({ orientation, selectedId, hoveredId, filter, availability, onSelect, onHover, onUnavailable }: Props) {
  const vb = viewBox(orientation)
  const compass: { label: string; p: Pt }[] = [
    { label: 'شمال', p: { u: RINGS.upperOut.a + 7, v: 0 } },
    { label: 'جنوب', p: { u: -RINGS.upperOut.a - 7, v: 0 } },
    { label: 'شرق', p: { u: 0, v: RINGS.upperOut.b + 7 } },
    { label: 'غرب', p: { u: 0, v: -RINGS.upperOut.b - 7 } },
  ]

  return (
    <svg
      className="stadium-map"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label="نقشهٔ جایگاه‌های ورزشگاه آزادی"
    >
      <defs>
        <pattern id="hatch" width="2.4" height="2.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="2.4" stroke="rgba(255,255,255,0.07)" strokeWidth="0.9" />
        </pattern>
      </defs>
      <g transform={MATRIX[orientation]}>
        <path d={ringPath({ a: RINGS.upperOut.a + 3, b: RINGS.upperOut.b + 3 })} className="bowl" />
        <path d={ringPath(RINGS.lowerOut)} className="concourse" />
        <path d={ringPath(RINGS.lowerIn)} className="track-edge" />
        <path d={ringPath(RINGS.track)} className="track" />
        <Pitch />
        {SECTIONS.map((s) => {
          const unavailable = s.status !== 'available'
          const dim = !!filter && s.category !== filter
          const cls = [
            'section',
            `section--${s.category}`,
            unavailable && 'section--unavailable',
            dim && 'section--dim',
            s.id === selectedId && 'section--selected',
            s.id === hoveredId && 'section--hover',
          ]
            .filter(Boolean)
            .join(' ')
          const avail = availability.get(s.id) ?? 0
          const status = s.status === 'closed' ? 'فروش عمومی ندارد' : s.status === 'soldout' ? 'تمام شده' : `${fa(avail)} صندلی خالی`
          return (
            <path
              key={s.id}
              d={sectionPaths.get(s.id)}
              className={cls}
              style={{ ['--cat' as string]: CATEGORIES[s.category].color }}
              role="button"
              tabIndex={dim ? -1 : 0}
              aria-disabled={unavailable || undefined}
              aria-label={`${sectionLabel(s)}، ${CATEGORIES[s.category].name}، ${tomanShort(CATEGORIES[s.category].price)} تومان، ${status}`}
              onClick={(e) => (unavailable ? onUnavailable?.(s) : onSelect?.(s, e.currentTarget))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  if (unavailable) onUnavailable?.(s)
                  else onSelect?.(s, e.currentTarget)
                }
              }}
              onPointerEnter={(e) => e.pointerType === 'mouse' && onHover?.(s)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && onHover?.(null)}
              onFocus={() => onHover?.(s)}
              onBlur={() => onHover?.(null)}
            />
          )
        })}
        {SECTIONS.filter((s) => s.status !== 'available').map((s) => (
          <path key={`h${s.id}`} d={sectionPaths.get(s.id)} fill="url(#hatch)" pointerEvents="none" />
        ))}
      </g>
      <g className="section-labels" aria-hidden="true">
        {SECTIONS.map((s) => {
          const c = project(sectionCenter(s), orientation)
          return (
            <text
              key={s.id}
              x={c.x}
              y={c.y}
              className={[
                'section-label',
                s.id === selectedId && 'section-label--selected',
                s.status !== 'available' && 'section-label--off',
                !!filter && s.category !== filter && 'section-label--dim',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {fa(s.number)}
            </text>
          )
        })}
        {compass.map(({ label, p }) => {
          const c = project(p, orientation)
          return (
            <text key={label} x={c.x} y={c.y} className="compass-label">
              {label}
            </text>
          )
        })}
      </g>
    </svg>
  )
}

/** Small, non-interactive stadium with one section (and optionally one seat) highlighted. */
export function MiniStadium({ section, row, seat, size = 64 }: { section: Section; row?: number; seat?: number; size?: number }) {
  const o: Orientation = 'portrait'
  const vb = viewBox(o)
  const dot = row && seat ? project(seatPosition(section, row, seat), o) : null
  return (
    <svg className="mini-stadium" width={size} height={(size * vb.h) / vb.w} viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} aria-hidden="true">
      <g transform={MATRIX[o]}>
        <path d={ringPath({ a: RINGS.upperOut.a + 3, b: RINGS.upperOut.b + 3 }, 60)} className="bowl" />
        <path d={ringPath(TIERS.lower.inner, 60)} className="mini-stadium__ring" />
        <path d={ringPath(RINGS.track, 60)} className="track" />
        <Pitch detailed={false} />
        <path d={sectionPaths.get(section.id)} className="mini-stadium__section" />
      </g>
      {dot && <circle cx={dot.x} cy={dot.y} r={7} className="mini-stadium__seat" />}
    </svg>
  )
}
