import { PriceLine, SeatLegend, SectionHeading, ViewThumb, sectionSubtitle } from '../components/Booking'
import { Icon } from '../components/Icon'
import { ActionBar, Button, Layout } from '../components/Layout'
import { SeatMap } from '../components/SeatMap'
import { availableCount, findSeat, parseSeatId, stateOf } from '../data/seats'
import { sectionPrice, type Section } from '../data/stadium'
import { viewpointFor } from '../data/viewpoints'
import { fa, toman } from '../lib/format'
import { go } from '../lib/router'
import { useIsDesktop } from '../lib/useMediaQuery'
import { usePanZoom } from '../lib/usePanZoom'
import { useDemoBookings } from '../state/demoBookings'

export function SeatScreen({ section, seatId }: { section: Section; seatId?: string }) {
  const desktop = useIsDesktop()
  const pz = usePanZoom({ min: 1, max: 3 })
  useDemoBookings() // re-render when a demo booking marks a seat taken

  const parsed = seatId ? parseSeatId(seatId) : null
  const seat = parsed && parsed.section === section.id ? findSeat(section, parsed.row, parsed.number) : undefined
  const selected = seat && stateOf(seat) === 'available' ? seat : undefined
  const free = availableCount(section)
  const toView = () => selected && go({ name: 'view', seat: selected.id })

  const canvas = (
    <div className="seat-stage">
      <div className="pz" ref={pz.containerRef}>
        <div className="pz__content" ref={pz.contentRef}>
          <SeatMap
            section={section}
            selectedId={selected?.id}
            onSelect={(s) => go({ name: 'seats', section: section.id, seat: s.id }, { replace: true })}
          />
        </div>
      </div>
      <div className="zoom-controls" role="group" aria-label="بزرگ‌نمایی صندلی‌ها">
        <button className="icon-btn" onClick={() => pz.zoomBy(1.4)} aria-label="بزرگ‌نمایی" disabled={pz.k >= 3}>
          <Icon name="plus" />
        </button>
        <button className="icon-btn" onClick={() => pz.zoomBy(1 / 1.4)} aria-label="کوچک‌نمایی" disabled={pz.k <= 1.01}>
          <Icon name="minus" />
        </button>
      </div>
      {!desktop && (
        <div className="seat-stage__caption">
          <strong>جایگاه {fa(section.number)}</strong>
          <span>{sectionSubtitle(section)}</span>
          <SeatLegend />
        </div>
      )}
    </div>
  )

  const vp = viewpointFor(section, selected?.row ?? Math.ceil(section.rows / 2))
  const panel = (
    <>
      <div className="panel__section">
        <SectionHeading section={section} row={selected?.row} seat={selected?.number} />
        <PriceLine section={section} />
        <p className="muted small">
          {fa(free)} صندلی خالی از {fa(section.seatsInRow.reduce((a, b) => a + b, 0))} صندلی
        </p>
      </div>
      <div className="panel__section">
        <h3 className="panel__label">انتخاب صندلی</h3>
        <SeatLegend />
        <p className="muted small">ردیف ۱ نزدیک‌ترین ردیف به زمین است. با کلیدهای جهت هم می‌توانید بین صندلی‌ها جابه‌جا شوید.</p>
      </div>
      <div className="panel__section">
        <ViewThumb vp={vp} label={selected ? 'نمای واقعی نزدیک صندلی شما' : 'نمای واقعی از این جایگاه'} onClick={selected ? toView : undefined} />
      </div>
      <div className="panel__footer panel__footer--cta">
        <div className="summary-line" aria-live="polite">
          <span>{selected ? `ردیف ${fa(selected.row)} · صندلی ${fa(selected.number)}` : 'هنوز صندلی انتخاب نشده'}</span>
          <strong>{toman(sectionPrice(section))}</strong>
        </div>
        <Button onClick={toView} disabled={!selected}>
          ادامه و دیدن نمای صندلی
        </Button>
        <Button variant="ghost" onClick={() => go({ name: 'overview' })}>
          تغییر جایگاه
        </Button>
      </div>
    </>
  )

  const bottom = (
    <ActionBar
      eyebrow={
        selected
          ? `جایگاه ${fa(section.number)} · ردیف ${fa(selected.row)} · صندلی ${fa(selected.number)}`
          : `جایگاه ${fa(section.number)} · ${fa(free)} صندلی خالی`
      }
      value={selected ? toman(sectionPrice(section)) : 'انتخاب صندلی'}
      action={
        <Button onClick={toView} disabled={!selected}>
          ادامه
        </Button>
      }
    />
  )

  return (
    <Layout
      screen="seats"
      onBack={() => go({ name: 'overview' })}
      canvas={canvas}
      panel={panel}
      bottom={bottom}
    />
  )
}
