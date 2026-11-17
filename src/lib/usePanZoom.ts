// Pan / pinch / wheel zoom for an HTML wrapper around an SVG map.
// The transform is written straight to the DOM (no React re-render per frame);
// only the zoom level is mirrored into state so the +/- buttons can update.

import { useCallback, useEffect, useRef, useState } from 'react'

interface T {
  x: number
  y: number
  k: number
}

export interface PanZoom {
  containerRef: React.RefObject<HTMLDivElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
  k: number
  zoomBy: (f: number) => void
  reset: (animate?: boolean) => void
  /** Zoom so the rect (content px, unscaled) fills the container. */
  focus: (r: { x: number; y: number; w: number; h: number }, opts?: { duration?: number; pad?: number; maxK?: number }) => Promise<void>
}

const EASE = 'cubic-bezier(.2,.75,.25,1)'

export function usePanZoom({ min = 1, max = 4 }: { min?: number; max?: number } = {}): PanZoom {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const t = useRef<T>({ x: 0, y: 0, k: 1 })
  const [k, setK] = useState(1)

  const clamp = useCallback(
    (n: T): T => {
      const el = containerRef.current
      if (!el) return n
      const kk = Math.min(max, Math.max(min, n.k))
      const w = el.clientWidth
      const h = el.clientHeight
      // Keep at least the container's area covered by content when zoomed in.
      const minX = Math.min(0, w - w * kk)
      const minY = Math.min(0, h - h * kk)
      return { k: kk, x: Math.min(0, Math.max(minX, n.x)), y: Math.min(0, Math.max(minY, n.y)) }
    },
    [min, max],
  )

  const apply = useCallback(
    (n: T, duration = 0) => {
      const c = clamp(n)
      t.current = c
      const el = contentRef.current
      if (el) {
        el.style.transition = duration ? `transform ${duration}ms ${EASE}` : 'none'
        el.style.transform = `translate3d(${c.x}px, ${c.y}px, 0) scale(${c.k})`
      }
      setK((prev) => (Math.abs(prev - c.k) > 0.01 ? c.k : prev))
    },
    [clamp],
  )

  const zoomAt = useCallback(
    (f: number, cx: number, cy: number, duration = 0) => {
      const cur = t.current
      const nk = Math.min(max, Math.max(min, cur.k * f))
      const r = nk / cur.k
      apply({ k: nk, x: cx - (cx - cur.x) * r, y: cy - (cy - cur.y) * r }, duration)
    },
    [apply, min, max],
  )

  const zoomBy = useCallback(
    (f: number) => {
      const el = containerRef.current
      if (!el) return
      zoomAt(f, el.clientWidth / 2, el.clientHeight / 2, 260)
    },
    [zoomAt],
  )

  const reset = useCallback((animate = true) => apply({ x: 0, y: 0, k: 1 }, animate ? 320 : 0), [apply])

  const focus = useCallback<PanZoom['focus']>(
    (r, { duration = 520, pad = 24, maxK = max } = {}) => {
      const el = containerRef.current
      if (!el) return Promise.resolve()
      const w = el.clientWidth
      const h = el.clientHeight
      const nk = Math.min(maxK, (w - pad * 2) / r.w, (h - pad * 2) / r.h)
      const n = { k: nk, x: w / 2 - (r.x + r.w / 2) * nk, y: h / 2 - (r.y + r.h / 2) * nk }
      // Bypass clamping limits for the "dive in" transition.
      t.current = n
      const c = contentRef.current
      if (c) {
        c.style.transition = `transform ${duration}ms ${EASE}`
        c.style.transform = `translate3d(${n.x}px, ${n.y}px, 0) scale(${n.k})`
      }
      return new Promise((res) => setTimeout(res, duration))
    },
    [max],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const pointers = new Map<number, { x: number; y: number }>()
    let start: { t: T; d: number; mid: { x: number; y: number } } | null = null
    let moved = 0
    let lastTap = 0

    const local = (e: PointerEvent | WheelEvent) => {
      const b = el.getBoundingClientRect()
      return { x: e.clientX - b.left, y: e.clientY - b.top }
    }
    const snapshot = () => {
      const ps = [...pointers.values()]
      const mid = ps.length > 1 ? { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 } : ps[0]
      const d = ps.length > 1 ? Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y) : 0
      start = { t: { ...t.current }, d, mid }
    }

    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      pointers.set(e.pointerId, local(e))
      if (pointers.size === 1) moved = 0
      snapshot()
    }
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId) || !start) return
      const p = local(e)
      pointers.set(e.pointerId, p)
      const ps = [...pointers.values()]
      const mid = ps.length > 1 ? { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 } : ps[0]
      const dx = mid.x - start.mid.x
      const dy = mid.y - start.mid.y
      moved = Math.max(moved, Math.hypot(dx, dy))
      if (moved < 6 && pointers.size < 2) return
      if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId)
      let nk = start.t.k
      if (pointers.size > 1 && start.d > 0) {
        const d = Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y)
        nk = Math.min(max, Math.max(min, start.t.k * (d / start.d)))
        moved = Math.max(moved, 10)
      }
      const r = nk / start.t.k
      apply({
        k: nk,
        x: mid.x - (start.mid.x - start.t.x) * r,
        y: mid.y - (start.mid.y - start.t.y) * r,
      })
    }
    const up = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return
      pointers.delete(e.pointerId)
      if (pointers.size) snapshot()
      else start = null
      if (pointers.size === 0 && moved < 6 && e.pointerType === 'touch') {
        const now = performance.now()
        if (now - lastTap < 280) {
          const p = local(e)
          zoomAt(t.current.k > 1.5 ? 1 / t.current.k : 2, p.x, p.y, 260)
          lastTap = 0
        } else lastTap = now
      }
    }
    const click = (e: MouseEvent) => {
      // A drag/pinch shouldn't also select whatever is under the finger.
      if (moved >= 6) {
        e.stopPropagation()
        e.preventDefault()
        moved = 0
      }
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = local(e)
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), p.x, p.y)
    }
    const dbl = (e: MouseEvent) => {
      const b = el.getBoundingClientRect()
      zoomAt(t.current.k > 1.5 ? 1 / t.current.k : 2, e.clientX - b.left, e.clientY - b.top, 260)
    }
    const resize = new ResizeObserver(() => apply(t.current))

    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    el.addEventListener('click', click, true)
    el.addEventListener('wheel', wheel, { passive: false })
    el.addEventListener('dblclick', dbl)
    resize.observe(el)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
      el.removeEventListener('click', click, true)
      el.removeEventListener('wheel', wheel)
      el.removeEventListener('dblclick', dbl)
      resize.disconnect()
    }
  }, [apply, zoomAt, min, max])

  return { containerRef, contentRef, k, zoomBy, reset, focus }
}
