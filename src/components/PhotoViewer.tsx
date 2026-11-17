// Shows a real photograph that covers the canvas. When the photo is wider (or taller) than the
// canvas — always for panoramas — it can be dragged to look around. That's honest panning
// across a flat photo, not a 3D scene, and the hint copy says exactly that.
// Switching viewpoints crossfades between photo layers.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fallbackSrc, photoMeta, srcSet, type Viewpoint } from '../data/viewpoints'
import { Icon } from './Icon'

interface Layer {
  vp: Viewpoint
  key: number
}

function useSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function PhotoLayer({ vp, w, h, entering }: { vp: Viewpoint; w: number; h: number; entering: boolean }) {
  const meta = photoMeta(vp.id)
  const aspect = meta.width / meta.height
  // Cover the canvas; panoramas get extra height so there's something to pan across on desktop too.
  const minH = vp.panorama ? h * 1.0 : h
  const rh = Math.max(minH, w / aspect)
  const rw = rh * aspect
  const maxX = Math.max(0, rw - w)
  const maxY = Math.max(0, rh - h)
  const [pos, setPos] = useState({ x: vp.focus, y: 0.5 })
  const [loaded, setLoaded] = useState(false)
  const [dragged, setDragged] = useState(false)
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const pannable = maxX > 4 || maxY > 4

  const tx = -maxX * pos.x
  const ty = -maxY * pos.y

  const onDown = (e: React.PointerEvent) => {
    if (!pannable) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const nx = maxX ? d.px - (e.clientX - d.x) / maxX : 0.5
    const ny = maxY ? d.py - (e.clientY - d.y) / maxY : 0.5
    setPos({ x: Math.min(1, Math.max(0, nx)), y: Math.min(1, Math.max(0, ny)) })
    if (!dragged && Math.abs(e.clientX - d.x) > 8) setDragged(true)
  }
  const onUp = () => (drag.current = null)
  const onKey = (e: React.KeyboardEvent) => {
    const step = 0.06
    const k: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const m = k[e.key]
    if (!m || !pannable) return
    e.preventDefault()
    setDragged(true)
    setPos((p) => ({ x: Math.min(1, Math.max(0, p.x + m[0])), y: Math.min(1, Math.max(0, p.y + m[1])) }))
  }

  return (
    <div
      className={`photo-layer${entering ? ' photo-layer--enter' : ''}${pannable ? ' photo-layer--pannable' : ''}`}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      onKeyDown={onKey}
      tabIndex={pannable ? 0 : -1}
      aria-label={pannable ? `${vp.title}. برای دیدن اطراف از کلیدهای جهت استفاده کنید.` : vp.title}
      role="img"
    >
      <div
        className="photo-layer__frame"
        style={{ width: rw, height: rh, transform: `translate3d(${tx}px, ${ty}px, 0)`, backgroundImage: `url(${meta.placeholder})` }}
      >
        {w > 0 && (
          <picture>
            <source type="image/avif" srcSet={srcSet(vp.id, 'avif')} sizes={`${Math.ceil(rw)}px`} />
            <source type="image/webp" srcSet={srcSet(vp.id, 'webp')} sizes={`${Math.ceil(rw)}px`} />
            <img
              src={fallbackSrc(vp.id)}
              alt=""
              draggable={false}
              decoding="async"
              className={loaded ? 'is-loaded' : ''}
              onLoad={() => setLoaded(true)}
            />
          </picture>
        )}
      </div>
      {pannable && (
        <div className={`drag-hint${dragged ? ' drag-hint--hidden' : ''}`} aria-hidden="true">
          <Icon name="drag" size={16} />
          برای دیدن اطراف، عکس را بکشید
        </div>
      )}
    </div>
  )
}

export function PhotoViewer({ viewpoint, children }: { viewpoint: Viewpoint; children?: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const { w, h } = useSize(ref)
  const [layers, setLayers] = useState<Layer[]>([{ vp: viewpoint, key: 0 }])
  const top = layers.at(-1)!

  // New viewpoint: stack a layer on top of the current one so it can crossfade in.
  if (top.vp.id !== viewpoint.id) {
    setLayers([top, { vp: viewpoint, key: top.key + 1 }])
  }

  useEffect(() => {
    if (layers.length < 2) return
    const t = setTimeout(() => setLayers((ls) => ls.slice(-1)), 700)
    return () => clearTimeout(t)
  }, [layers])

  const credit = photoMeta(viewpoint.id).credit
  // Panning in RTL: dragging right reveals the left side, same as LTR — physical, not logical.
  return (
    <div className="photo-viewer" ref={ref} dir="ltr">
      {layers.map((l, i) => (
        <PhotoLayer key={l.key} vp={l.vp} w={w} h={h} entering={layers.length > 1 && i === layers.length - 1} />
      ))}
      <div className="photo-viewer__shade" aria-hidden="true" />
      <div dir="rtl" className="photo-viewer__overlay">
        {children}
      </div>
      <a className="photo-credit" dir="rtl" href={credit.page} target="_blank" rel="noreferrer">
        <Icon name="camera" size={13} />
        عکس واقعی: {credit.author || 'Wikimedia Commons'} · {credit.license}
      </a>
    </div>
  )
}
