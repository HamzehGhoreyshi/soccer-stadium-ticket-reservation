import { useState } from 'react'
import { Icon } from '../components/Icon'
import { ActionBar, Button, Layout } from '../components/Layout'
import { MiniStadium } from '../components/StadiumMap'
import { CATEGORIES, MATCH, matchDate, matchTime } from '../data/match'
import { stateOf, type Seat } from '../data/seats'
import { STAND_LABEL, TIER_LABEL, ZONE_LABEL, sectionPrice, type Section, type Stand } from '../data/stadium'
import { fa, faText, toman } from '../lib/format'
import { go } from '../lib/router'
import { useIsDesktop } from '../lib/useMediaQuery'
import { fallbackSrc, photoMeta, viewpointFor } from '../data/viewpoints'
import { addDemoBooking, useDemoBookings } from '../state/demoBookings'

const SERVICE_FEE = 15_000
const GATE: Record<Stand, number> = { north: 1, east: 3, south: 5, west: 7 }

type Status = 'review' | 'submitting' | 'done'

function Ticket({ section, seat, status, code }: { section: Section; seat: Seat; status: Status; code: string }) {
  // The ticket "prints" out of a slot when the page opens (a receipt-printer feed).
  return (
    <div className="ticket-printer">
      <div className="ticket-printer__slot" aria-hidden="true" />
      <div className="ticket-printer__feed">
    <article className={`ticket${status === 'done' ? ' ticket--done' : ''}`} aria-label="بلیت شما">
      <div className="ticket__top">
        <div>
          <span className="eyebrow">{MATCH.competition}</span>
          <h2 className="ticket__teams">
            {MATCH.home} <span>–</span> {MATCH.away}
          </h2>
          <p className="muted">
            {matchDate} · ساعت {matchTime}
          </p>
          <p className="muted">
            {MATCH.stadium}، {MATCH.city}
          </p>
        </div>
        {status === 'done' ? (
          <div className="ticket__stamp">
            <span>نمونهٔ آزمایشی</span>
            <code>{code}</code>
          </div>
        ) : (
          <MiniStadium section={section} row={seat.row} seat={seat.number} size={76} />
        )}
      </div>
      <dl className="ticket__grid">
        <div>
          <dt>جایگاه</dt>
          <dd>{fa(section.number)}</dd>
        </div>
        <div>
          <dt>ردیف</dt>
          <dd>{fa(seat.row)}</dd>
        </div>
        <div>
          <dt>صندلی</dt>
          <dd>{fa(seat.number)}</dd>
        </div>
        <div>
          <dt>طبقه</dt>
          <dd className="sm">{TIER_LABEL[section.tier].replace('طبقهٔ ', '')}</dd>
        </div>
        <div>
          <dt>ورودی</dt>
          <dd className="sm">درِ {fa(GATE[section.stand])}</dd>
        </div>
        <div>
          <dt>موقعیت</dt>
          <dd className="sm">{ZONE_LABEL[section.zone]}</dd>
        </div>
      </dl>
    </article>
      </div>
    </div>
  )
}

export function CheckoutScreen({ section, seat }: { section: Section; seat: Seat }) {
  const desktop = useIsDesktop()
  useDemoBookings()
  const [status, setStatus] = useState<Status>('review')
  const [code] = useState(() => faText(`DEMO-${Math.floor(100000 + Math.random() * 900000)}`))
  const price = sectionPrice(section)
  const total = price + SERVICE_FEE
  const unavailable = status === 'review' && stateOf(seat) !== 'available'

  const confirm = () => {
    setStatus('submitting')
    // Simulated request — there is no backend and nothing is charged.
    setTimeout(() => {
      addDemoBooking(seat.id)
      setStatus('done')
    }, 900)
  }

  const breakdown = (
    <dl className="breakdown">
      <div>
        <dt>
          قیمت بلیت <small>({CATEGORIES[section.category].name})</small>
        </dt>
        <dd>{toman(price)}</dd>
      </div>
      <div>
        <dt>کارمزد خدمات</dt>
        <dd>{toman(SERVICE_FEE)}</dd>
      </div>
      <div className="breakdown__total">
        <dt>مبلغ کل</dt>
        <dd>{toman(total)}</dd>
      </div>
    </dl>
  )

  const notice = (
    <p className="notice">
      <Icon name="info" size={16} />
      این نسخهٔ نمایشی است: پرداختی انجام نمی‌شود و بلیت صادرشده اعتبار ورود ندارد.
    </p>
  )

  const done = (
    <div className="done" role="status">
      <span className="done__icon">
        <Icon name="check" size={22} />
      </span>
      <div>
        <strong>رزرو آزمایشی ثبت شد</strong>
        <p className="muted small">
          کد نمایشی {code}. این صندلی در همین مرورگر رزرو شده نشان داده می‌شود، اما رزرو واقعی نیست.
        </p>
      </div>
    </div>
  )

  const primary =
    status === 'done' ? (
      <Button onClick={() => go({ name: 'overview' })}>انتخاب بلیت دیگر</Button>
    ) : unavailable ? (
      <Button onClick={() => go({ name: 'seats', section: section.id })}>انتخاب صندلی دیگر</Button>
    ) : (
      <Button onClick={confirm} disabled={status === 'submitting'} aria-busy={status === 'submitting'}>
        {status === 'submitting' ? <span className="spinner" aria-label="در حال ثبت" /> : 'تأیید رزرو آزمایشی'}
      </Button>
    )

  const vp = viewpointFor(section, seat.row)
  const canvas = (
    <div className="checkout">
      {desktop && (
        <div className="checkout__backdrop" aria-hidden="true">
          <img src={fallbackSrc(vp.id)} alt="" style={{ backgroundImage: `url(${photoMeta(vp.id).placeholder})` }} />
        </div>
      )}
      <div className="checkout__inner">
        <h2 className="checkout__title">{status === 'done' ? 'بلیت شما' : 'تأیید رزرو'}</h2>
        <Ticket section={section} seat={seat} status={status} code={code} />
        {!desktop && (
          <>
            {status === 'done' ? done : breakdown}
            {unavailable && <p className="notice notice--warn">این صندلی دیگر خالی نیست. لطفاً صندلی دیگری انتخاب کنید.</p>}
            {notice}
            {status === 'review' && !unavailable && (
              <button className="link-btn link-btn--start" onClick={() => go({ name: 'seats', section: section.id, seat: seat.id })}>
                <Icon name="seat" size={18} />
                تغییر صندلی
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )

  const panel = (
    <>
      <div className="panel__section">
        <h2 className="panel__title">{status === 'done' ? 'رزرو آزمایشی ثبت شد' : 'تأیید رزرو'}</h2>
        <p className="muted">
          جایگاه {fa(section.number)} · ردیف {fa(seat.row)} · صندلی {fa(seat.number)} · {TIER_LABEL[section.tier]} · {STAND_LABEL[section.stand]}
        </p>
      </div>
      <div className="panel__section">{status === 'done' ? done : breakdown}</div>
      {unavailable && <p className="notice notice--warn">این صندلی دیگر خالی نیست. لطفاً صندلی دیگری انتخاب کنید.</p>}
      <div className="panel__footer panel__footer--cta">
        {notice}
        {primary}
        {status === 'review' && !unavailable && (
          <Button variant="ghost" onClick={() => go({ name: 'seats', section: section.id, seat: seat.id })}>
            تغییر صندلی
          </Button>
        )}
      </div>
    </>
  )

  const bottom = (
    <ActionBar
      eyebrow={status === 'done' ? 'رزرو آزمایشی' : 'مبلغ کل'}
      value={status === 'done' ? 'ثبت شد' : toman(total)}
      action={primary}
    />
  )

  return (
    <Layout
      screen="checkout"
      onBack={status === 'done' ? undefined : () => go({ name: 'view', seat: seat.id })}
      canvas={canvas}
      panel={panel}
      bottom={bottom}
    />
  )
}
