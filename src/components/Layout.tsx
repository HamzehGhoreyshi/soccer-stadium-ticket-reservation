// Screen shell. One component, two deliberately different layouts:
//  - Mobile/tablet: top bar · full-bleed canvas · thumb-reachable bottom bar (or sheet)
//  - Desktop: side panel on the right (RTL start) with header + details + actions,
//    and a large canvas for the map or photo.

import { useState } from 'react'
import { matchDate, matchTime, matchTitle, MATCH } from '../data/match'
import { useIsDesktop } from '../lib/useMediaQuery'
import { Icon } from './Icon'
import { InfoDialog } from './InfoDialog'

interface TopBarProps {
  onBack?: () => void
  backLabel?: string
  overlay?: boolean
}

export function TopBar({ onBack, backLabel = 'بازگشت', overlay }: TopBarProps) {
  const [info, setInfo] = useState(false)
  return (
    <header className={`topbar${overlay ? ' topbar--overlay' : ''}`}>
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label={backLabel}>
          <Icon name="back" />
        </button>
      ) : (
        <span className="icon-btn icon-btn--ghost" aria-hidden="true" />
      )}
      <div className="topbar__title">
        <h1>{matchTitle}</h1>
        <p>
          {matchDate} · ساعت {matchTime} · {MATCH.stadium}
        </p>
      </div>
      <button className="icon-btn" onClick={() => setInfo(true)} aria-label="اطلاعات مسابقه و منبع عکس‌ها">
        <Icon name="info" />
      </button>
      {info && <InfoDialog onClose={() => setInfo(false)} />}
    </header>
  )
}

interface LayoutProps {
  screen: string
  onBack?: () => void
  /** Rendered under the top bar on mobile and at the top of the panel on desktop. */
  sub?: React.ReactNode
  canvas: React.ReactNode
  /** Desktop-only side panel body. */
  panel: React.ReactNode
  /** Mobile-only bottom area (action bar or sheet). */
  bottom: React.ReactNode
  /** Mobile: top bar floats over the canvas (photo screens). */
  overlayTop?: boolean
}

export function Layout({ screen, onBack, sub, canvas, panel, bottom, overlayTop }: LayoutProps) {
  const desktop = useIsDesktop()
  if (desktop) {
    return (
      <div className={`layout layout--desktop screen-${screen}`}>
        <aside className="panel">
          <TopBar onBack={onBack} />
          {sub && <div className="panel__sub">{sub}</div>}
          <div className="panel__body">{panel}</div>
        </aside>
        <main className="canvas">{canvas}</main>
      </div>
    )
  }
  return (
    <div className={`layout layout--mobile screen-${screen}${overlayTop ? ' layout--overlay' : ''}`}>
      <TopBar onBack={onBack} overlay={overlayTop} />
      {sub && <div className="mobile-sub">{sub}</div>}
      <main className="canvas">{canvas}</main>
      {bottom}
    </div>
  )
}

interface ActionBarProps {
  eyebrow: React.ReactNode
  value: React.ReactNode
  action: React.ReactNode
}

/** Mobile bottom bar: selection summary on the right, primary action under the thumb on the left. */
export function ActionBar({ eyebrow, value, action }: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-bar__info" aria-live="polite">
        <span className="eyebrow-text">{eyebrow}</span>
        <strong>{value}</strong>
      </div>
      {action}
    </div>
  )
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'light' | 'ghost' }) {
  return <button {...props} className={`btn btn--${variant} ${className}`} />
}
