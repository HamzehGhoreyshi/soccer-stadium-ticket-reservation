import { useMemo, useState } from 'react'
import { CategoryChips, CategoryList, MapLegend, PriceLine, SectionHeading, ViewThumb } from '../components/Booking'
import { Icon } from '../components/Icon'
import { ActionBar, Button, Layout } from '../components/Layout'
import { StadiumMap, sectionLabel } from '../components/StadiumMap'
import { useToast } from '../components/Toast'
import { CATEGORY_LIST, type CategoryId } from '../data/match'
import { availableCount } from '../data/seats'
import { SECTIONS, type Section } from '../data/stadium'
import { viewpointFor } from '../data/viewpoints'
import { fa, toman, tomanShort } from '../lib/format'
import { go } from '../lib/router'
import { useIsDesktop, usePrefersReducedMotion } from '../lib/useMediaQuery'
import { usePanZoom } from '../lib/usePanZoom'
import { useDemoBookings } from '../state/demoBookings'

export function OverviewScreen() {
  const desktop = useIsDesktop()
  const reduced = usePrefersReducedMotion()
  const [filter, setFilter] = useState<CategoryId | null>(null)
  const [hovered, setHovered] = useState<Section | null>(null)
  const [diving, setDiving] = useState<string | null>(null)
  const pz = usePanZoom({ min: 1, max: 5 })
  const toast = useToast()
  const booked = useDemoBookings()

  const availability = useMemo(() => new Map(SECTIONS.map((s) => [s.id, availableCount(s)])), [booked]) // eslint-disable-line react-hooks/exhaustive-deps
  const perCategory = useMemo(() => {
    const out = { c1: 0, c2: 0, c3: 0 } as Record<CategoryId, number>
    SECTIONS.forEach((s) => (out[s.category] += availability.get(s.id) ?? 0))
    return out
  }, [availability])
  const minPrice = Math.min(...CATEGORY_LIST.map((c) => c.price))

  // Dive into the chosen section (zoom), then hand over to the seat screen.
  const select = async (s: Section, el: SVGPathElement) => {
    if (diving) return
    setDiving(s.id)
    const content = pz.contentRef.current
    if (content && !reduced) {
      const cb = content.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const k = pz.k
      await pz.focus(
        { x: (r.left - cb.left) / k, y: (r.top - cb.top) / k, w: r.width / k, h: r.height / k },
        { duration: 480, pad: 40, maxK: 6 },
      )
    }
    go({ name: 'seats', section: s.id })
  }

  const onUnavailable = (s: Section) =>
    toast.show(s.status === 'closed' ? `جایگاه ${fa(s.number)} فروش عمومی ندارد.` : `بلیت‌های جایگاه ${fa(s.number)} تمام شده.`)

  const canvas = (
    <div className={`map-stage${diving ? ' map-stage--diving' : ''}`}>
      <div className="pz" ref={pz.containerRef}>
        <div className="pz__content" ref={pz.contentRef}>
          <StadiumMap
            orientation={desktop ? 'landscape' : 'portrait'}
            filter={filter}
            selectedId={diving ?? undefined}
            hoveredId={hovered?.id}
            availability={availability}
            onSelect={select}
            onHover={setHovered}
            onUnavailable={onUnavailable}
          />
        </div>
      </div>
      <div className="zoom-controls" role="group" aria-label="بزرگ‌نمایی نقشه">
        <button className="icon-btn" onClick={() => pz.zoomBy(1.5)} aria-label="بزرگ‌نمایی" disabled={pz.k >= 5}>
          <Icon name="plus" />
        </button>
        <button className="icon-btn" onClick={() => pz.zoomBy(1 / 1.5)} aria-label="کوچک‌نمایی" disabled={pz.k <= 1.01}>
          <Icon name="minus" />
        </button>
        <button className="icon-btn" onClick={() => pz.reset()} aria-label="نمایش کل ورزشگاه" disabled={pz.k <= 1.01}>
          <Icon name="fit" />
        </button>
      </div>
      {!desktop && hovered && (
        <div className="map-tip" aria-hidden="true">
          {sectionLabel(hovered)}
        </div>
      )}
      {toast.node}
    </div>
  )

  const preview = hovered ?? null
  const panel = (
    <>
      <div className="panel__section">
        <h2 className="panel__title">انتخاب جایگاه</h2>
        <p className="muted">روی نقشه جایگاه دلخواهتان را انتخاب کنید. با انتخاب هر دسته، جایگاه‌های آن پررنگ می‌شوند.</p>
      </div>
      <CategoryList active={filter} onChange={setFilter} available={perCategory} />
      <div className="panel__section panel__preview" aria-live="polite">
        {preview ? (
          <>
            <SectionHeading section={preview} as="h3" />
            <ViewThumb vp={viewpointFor(preview, Math.ceil(preview.rows / 2))} label="نمای واقعی از این جایگاه" />
            {preview.status === 'available' ? (
              <>
                <PriceLine section={preview} />
                <p className="muted small">{fa(availability.get(preview.id) ?? 0)} صندلی خالی در این جایگاه</p>
              </>
            ) : (
              <p className="muted small">{preview.status === 'closed' ? 'این جایگاه فروش عمومی ندارد.' : 'بلیت‌های این جایگاه تمام شده.'}</p>
            )}
          </>
        ) : (
          <div className="empty-hint">
            <Icon name="pin" size={22} />
            <p>نشانگر را روی یک جایگاه ببرید تا قیمت و نمای واقعی‌اش را ببینید.</p>
          </div>
        )}
      </div>
      <div className="panel__footer">
        <MapLegend />
      </div>
    </>
  )

  const bottom = (
    <ActionBar
      eyebrow="جایگاه را روی نقشه انتخاب کنید"
      value={`از ${toman(minPrice)}`}
      action={
        <Button disabled aria-disabled="true">
          ادامه
        </Button>
      }
    />
  )

  return (
    <Layout
      screen="overview"
      canvas={canvas}
      panel={panel}
      bottom={bottom}
      sub={
        desktop ? undefined : (
          <>
            <CategoryChips active={filter} onChange={setFilter} />
            <span className="sr-only">کمترین قیمت {tomanShort(minPrice)} تومان</span>
          </>
        )
      }
    />
  )
}
