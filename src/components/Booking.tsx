// Reusable booking building blocks shared by mobile and desktop layouts.

import { CATEGORIES, CATEGORY_LIST, type CategoryId } from '../data/match'
import { STAND_LABEL, TIER_LABEL, ZONE_LABEL, seatStats, type Section } from '../data/stadium'
import { fallbackSrc, photoMeta, VIEWPOINTS, type Viewpoint } from '../data/viewpoints'
import { fa, meters, toman, tomanShort } from '../lib/format'
import { Icon } from './Icon'
import { MiniStadium } from './StadiumMap'

/** Compact horizontal category filter (mobile). Tapping again clears the filter. */
export function CategoryChips({ active, onChange }: { active: CategoryId | null; onChange: (c: CategoryId | null) => void }) {
  return (
    <div className="chips" role="group" aria-label="دسته‌بندی قیمت">
      {CATEGORY_LIST.map((c) => (
        <button
          key={c.id}
          className={`chip${active === c.id ? ' chip--active' : ''}`}
          aria-pressed={active === c.id}
          onClick={() => onChange(active === c.id ? null : c.id)}
        >
          <span className="dot" style={{ background: c.color }} />
          {c.short}
          <b>{tomanShort(c.price)}</b>
        </button>
      ))}
    </div>
  )
}

/** Desktop category list with availability. Doubles as a filter. */
export function CategoryList({
  active,
  onChange,
  available,
}: {
  active: CategoryId | null
  onChange: (c: CategoryId | null) => void
  available: Record<CategoryId, number>
}) {
  return (
    <div className="cat-list" role="group" aria-label="دسته‌بندی قیمت">
      {CATEGORY_LIST.map((c) => (
        <button
          key={c.id}
          className={`cat-row${active === c.id ? ' cat-row--active' : ''}`}
          aria-pressed={active === c.id}
          onClick={() => onChange(active === c.id ? null : c.id)}
        >
          <span className="cat-row__swatch" style={{ background: c.color }} />
          <span className="cat-row__name">
            {c.name}
            <small>{CAT_HINT[c.id]}</small>
          </span>
          <span className="cat-row__price">
            {toman(c.price)}
            <small>{fa(available[c.id])} صندلی خالی</small>
          </span>
        </button>
      ))}
    </div>
  )
}

const CAT_HINT: Record<CategoryId, string> = {
  c1: 'طبقهٔ پایین، میانهٔ زمین',
  c2: 'گوشه‌های پایین و میانهٔ طبقهٔ بالا',
  c3: 'پشت دروازه‌ها و گوشه‌های بالا',
}

export function MapLegend() {
  return (
    <ul className="legend" aria-label="راهنمای نقشه">
      <li>
        <span className="legend__swatch legend__swatch--available" /> موجود
      </li>
      <li>
        <span className="legend__swatch legend__swatch--selected" /> انتخاب شما
      </li>
      <li>
        <span className="legend__swatch legend__swatch--off" /> تمام شده
      </li>
    </ul>
  )
}

export function SeatLegend() {
  return (
    <ul className="legend" aria-label="راهنمای صندلی‌ها">
      <li>
        <span className="legend__seat legend__seat--available" /> موجود
      </li>
      <li>
        <span className="legend__seat legend__seat--taken" /> رزرو شده
      </li>
      <li>
        <span className="legend__seat legend__seat--selected" /> انتخاب شما
      </li>
    </ul>
  )
}

export function sectionSubtitle(s: Section) {
  return `${TIER_LABEL[s.tier]} · ${STAND_LABEL[s.stand]}`
}

/** Section heading block: eyebrow zone, big section name, tier/stand line, mini map. */
export function SectionHeading({ section, row, seat, as: H = 'h2' }: { section: Section; row?: number; seat?: number; as?: 'h2' | 'h3' }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{ZONE_LABEL[section.zone]}</span>
        <H>جایگاه {fa(section.number)}</H>
        <p>
          {row && seat ? `ردیف ${fa(row)} · صندلی ${fa(seat)} · ` : ''}
          {sectionSubtitle(section)}
        </p>
      </div>
      <MiniStadium section={section} row={row} seat={seat} />
    </div>
  )
}

export function StatsRow({ section, row, seat }: { section: Section; row: number; seat: number }) {
  const s = seatStats(section, row, seat)
  const items = [
    { v: s.toCenter, l: 'تا نقطهٔ وسط زمین' },
    { v: s.toGoal, l: 'تا نزدیک‌ترین دروازه' },
    { v: s.height, l: 'ارتفاع از سطح زمین' },
  ]
  return (
    <div className="stats">
      <dl>
        {items.map((i) => (
          <div key={i.l}>
            <dd>{meters(i.v)}</dd>
            <dt>{i.l}</dt>
          </div>
        ))}
      </dl>
      <p className="stats__note">فاصله‌ها تقریبی‌اند و از روی ابعاد ورزشگاه محاسبه شده‌اند.</p>
    </div>
  )
}

export function PriceLine({ section }: { section: Section }) {
  const c = CATEGORIES[section.category]
  return (
    <div className="price-line">
      <span>
        <span className="dot" style={{ background: c.color }} /> {c.name}
      </span>
      <strong>{toman(c.price)}</strong>
    </div>
  )
}

/** Small real-photo preview of a viewpoint. */
export function ViewThumb({ vp, label, onClick }: { vp: Viewpoint; label?: string; onClick?: () => void }) {
  const meta = photoMeta(vp.id)
  const img = (
    <>
      <img
        src={fallbackSrc(vp.id)}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ backgroundImage: `url(${meta.placeholder})` }}
      />
      {label && (
        <span className="view-thumb__label">
          <Icon name="eye" size={14} /> {label}
        </span>
      )}
    </>
  )
  return onClick ? (
    <button className="view-thumb" onClick={onClick} aria-label={`${label ?? ''} ${vp.title}`}>
      {img}
    </button>
  ) : (
    <div className="view-thumb">{img}</div>
  )
}

/** List of all real viewpoints, to explore the stadium from other angles. */
export function ViewpointList({
  current,
  seatViewpoint,
  onPick,
}: {
  current: Viewpoint
  seatViewpoint: Viewpoint
  onPick: (vp: Viewpoint) => void
}) {
  return (
    <div className="vp-list" role="radiogroup" aria-label="زاویه‌های دیگر ورزشگاه">
      {VIEWPOINTS.map((vp) => {
        const meta = photoMeta(vp.id)
        const active = vp.id === current.id
        return (
          <button
            key={vp.id}
            role="radio"
            aria-checked={active}
            className={`vp-item${active ? ' vp-item--active' : ''}`}
            onClick={() => onPick(vp)}
          >
            <img src={`/photos/${vp.id}-${meta.widths[0]}.webp`} alt="" loading="lazy" decoding="async" style={{ backgroundImage: `url(${meta.placeholder})` }} />
            <span>
              {vp.title}
              {vp.id === seatViewpoint.id && <small>نزدیک به صندلی شما</small>}
              {vp.panorama && vp.id !== seatViewpoint.id && <small>پانوراما</small>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
