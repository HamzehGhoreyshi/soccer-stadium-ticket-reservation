import { useState } from 'react'
import { PriceLine, SectionHeading, StatsRow, ViewpointList } from '../components/Booking'
import { Icon } from '../components/Icon'
import { Button, Layout } from '../components/Layout'
import { PhotoViewer } from '../components/PhotoViewer'
import type { Seat } from '../data/seats'
import { sectionPrice, type Section } from '../data/stadium'
import { viewpointFor, type Viewpoint } from '../data/viewpoints'
import { fa, toman, tomanShort } from '../lib/format'
import { go } from '../lib/router'
import { useIsDesktop } from '../lib/useMediaQuery'

export function ViewScreen({ section, seat }: { section: Section; seat: Seat }) {
  const desktop = useIsDesktop()
  const seatVp = viewpointFor(section, seat.row)
  const [vp, setVp] = useState<Viewpoint>(seatVp)
  const [expanded, setExpanded] = useState(false)
  const isSeatView = vp.id === seatVp.id
  const changeSeat = () => go({ name: 'seats', section: section.id, seat: seat.id })
  const buy = () => go({ name: 'checkout', seat: seat.id })

  const pill = (
    <div className="view-pill">
      <span className="view-pill__dot" />
      {isSeatView ? (
        <>
          نما از جایگاه {fa(section.number)} · ردیف {fa(seat.row)} · صندلی {fa(seat.number)}
        </>
      ) : (
        <>زاویهٔ دیگر: {vp.title}</>
      )}
    </div>
  )

  const honesty = (
    <p className="view-note">
      <Icon name="camera" size={14} />
      {isSeatView
        ? 'عکس واقعی از نزدیک‌ترین زاویهٔ موجود به صندلی شما؛ نمای دقیق ممکن است کمی فرق کند.'
        : 'در حال دیدن یک زاویهٔ دیگر از ورزشگاه هستید.'}
      <span className="only-mobile">فاصله‌ها تقریبی‌اند.</span>
      {!isSeatView && (
        <button className="link-btn" onClick={() => setVp(seatVp)}>
          برگشت به نمای صندلی
        </button>
      )}
    </p>
  )

  const actions = (
    <div className="view-actions">
      <Button variant="ghost" onClick={changeSeat}>
        تغییر صندلی
      </Button>
      <Button variant="light" onClick={buy}>
        {desktop ? `خرید بلیت · ${toman(sectionPrice(section))}` : `خرید · ${tomanShort(sectionPrice(section))} تومان`}
      </Button>
    </div>
  )

  const canvas = <PhotoViewer viewpoint={vp}>{pill}</PhotoViewer>

  const panel = (
    <>
      <div className="panel__section">
        <SectionHeading section={section} row={seat.row} seat={seat.number} />
        <StatsRow section={section} row={seat.row} seat={seat.number} />
      </div>
      <div className="panel__section">
        <h3 className="panel__label">زاویه‌های واقعی ورزشگاه</h3>
        {honesty}
        <ViewpointList current={vp} seatViewpoint={seatVp} onPick={setVp} />
      </div>
      <div className="panel__footer panel__footer--cta">
        <PriceLine section={section} />
        {actions}
      </div>
    </>
  )

  const bottom = (
    <section className={`sheet${expanded ? ' sheet--expanded' : ''}`} aria-label="جزئیات صندلی">
      <button
        className="sheet__handle"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        aria-label={expanded ? 'بستن زاویه‌های دیگر' : 'دیدن زاویه‌های دیگر ورزشگاه'}
      >
        <span />
      </button>
      <SectionHeading section={section} row={seat.row} seat={seat.number} />
      <StatsRow section={section} row={seat.row} seat={seat.number} />
      {honesty}
      <div className="sheet__more">
        <button className="sheet__toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
          <Icon name={expanded ? 'collapse' : 'expand'} size={16} />
          {expanded ? 'بستن زاویه‌ها' : 'زاویه‌های دیگر ورزشگاه'}
        </button>
        {expanded && <ViewpointList current={vp} seatViewpoint={seatVp} onPick={setVp} />}
      </div>
      {actions}
    </section>
  )

  return (
    <Layout
      screen="view"
      onBack={changeSeat}
      canvas={canvas}
      panel={panel}
      bottom={bottom}
      overlayTop={!desktop}
    />
  )
}
