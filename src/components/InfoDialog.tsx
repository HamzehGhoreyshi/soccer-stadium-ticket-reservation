import { useEffect, useRef } from 'react'
import { MATCH, matchDate, matchTime, matchTitle } from '../data/match'
import { VIEWPOINTS, photoMeta } from '../data/viewpoints'
import { Icon } from './Icon'

export function InfoDialog({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    d?.showModal()
    return () => d?.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="info-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="dialog__inner">
        <header className="dialog__head">
          <h2 id="info-title">{matchTitle}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="بستن">
            <Icon name="close" />
          </button>
        </header>
        <dl className="facts">
          <div>
            <dt>مسابقه</dt>
            <dd>{MATCH.competition}</dd>
          </div>
          <div>
            <dt>زمان</dt>
            <dd>
              {matchDate} · ساعت {matchTime}
            </dd>
          </div>
          <div>
            <dt>ورزشگاه</dt>
            <dd>
              {MATCH.stadium}، {MATCH.city}
            </dd>
          </div>
        </dl>
        <p className="notice">
          این یک نسخهٔ نمایشی است. مسابقه، قیمت‌ها و وضعیت صندلی‌ها نمونه‌اند و هیچ پرداخت یا رزرو واقعی انجام نمی‌شود.
          فاصله‌ها از روی ابعاد ورزشگاه تخمین زده شده‌اند.
        </p>
        <h3>عکس‌های ورزشگاه</h3>
        <p className="muted">
          همهٔ عکس‌ها واقعی و از ورزشگاه آزادی‌اند و با مجوز آزاد از ویکی‌مدیا کامنز آمده‌اند. هر صندلی به نزدیک‌ترین زاویه‌ای
          که عکس واقعی‌اش موجود است وصل شده.
        </p>
        <ul className="credits">
          {VIEWPOINTS.map((vp) => {
            const c = photoMeta(vp.id).credit
            return (
              <li key={vp.id}>
                <span>{vp.title}</span>
                <a href={c.page} target="_blank" rel="noreferrer" dir="ltr">
                  {c.author || 'Unknown'} · {c.license}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </dialog>
  )
}
