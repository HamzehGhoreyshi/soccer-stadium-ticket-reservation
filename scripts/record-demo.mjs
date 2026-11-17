// Records a scripted walk through the booking journey for demo videos.
//   node scripts/record-demo.mjs desktop|mobile <outDir> [baseUrl]
// Drives the installed Google Chrome (playwright-core), captures every painted frame via the
// DevTools screencast with its timestamp, and writes frames + an ffmpeg concat list so the
// video keeps real timing. A fake cursor (desktop) or touch dots (mobile) are drawn in-page.

import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright-core'

const [mode = 'desktop', outDir = 'recording', base = 'http://localhost:5179/'] = process.argv.slice(2)
const MOBILE = mode === 'mobile'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(path.join(outDir, 'frames'), { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--force-color-profile=srgb'] })
const ctx = await browser.newContext(
  MOBILE
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
    : { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
)

// Pointer overlay so viewers can follow what's happening.
await ctx.addInitScript((mobile) => {
  const css = mobile
    ? `#__t{position:fixed;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;
         background:rgba(255,255,255,.28);border:2px solid rgba(255,255,255,.75);pointer-events:none;z-index:2147483647;
         opacity:0;transform:scale(.6);transition:opacity .25s,transform .25s}
       #__t.on{opacity:1;transform:scale(1)}`
    : `#__c{position:fixed;left:0;top:0;width:26px;height:26px;pointer-events:none;z-index:2147483647;
         transition:transform .12s ease;transform-origin:4px 3px}
       #__c.down{transform:scale(.85)}`
  window.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('style')
    s.textContent = css
    document.head.appendChild(s)
    const el = document.createElement('div')
    el.id = mobile ? '__t' : '__c'
    if (!mobile)
      el.innerHTML =
        '<svg width="26" height="26" viewBox="0 0 26 26"><path d="M4 3l15.5 10.2-7 1.3 4.2 7.7-3 1.6-4.2-7.8L4 21z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'
    document.body.appendChild(el)
    const pos = (e) => {
      el.style.left = e.clientX + 'px'
      el.style.top = e.clientY + 'px'
    }
    addEventListener('pointermove', pos, true)
    addEventListener('pointerdown', (e) => (pos(e), el.classList.add(mobile ? 'on' : 'down')), true)
    addEventListener('pointerup', () => el.classList.remove(mobile ? 'on' : 'down'), true)
    addEventListener('pointercancel', () => el.classList.remove('on'), true)
  })
}, MOBILE)

const page = await ctx.newPage()
const cdp = await ctx.newCDPSession(page)
await page.goto(base + '#/')
await page.evaluate(() => sessionStorage.clear())
await page.reload()
await page.evaluate(() => document.fonts.ready)
await sleep(1500)

// ---------- capture ----------
// Desktop: DevTools screencast (every painted frame). Mobile: headless screencast only returns
// CSS-pixel frames, so we loop 2x screenshots instead (~25-30 fps).
const frames = []
const save = (data, t) => {
  const file = `f${String(frames.length).padStart(5, '0')}.jpg`
  fs.writeFileSync(path.join(outDir, 'frames', file), Buffer.from(data, 'base64'))
  frames.push({ file, t })
}
let recording = true
let loop = Promise.resolve()
if (MOBILE) {
  const shot = await ctx.newCDPSession(page)
  loop = (async () => {
    while (recording) {
      const t = performance.now() / 1000
      const { data } = await shot.send('Page.captureScreenshot', {
        format: 'jpeg',
        quality: 92,
        optimizeForSpeed: true,
        clip: { x: 0, y: 0, width: 390, height: 844, scale: 2 },
      })
      save(data, t)
    }
  })()
} else {
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    save(data, metadata.timestamp)
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
  })
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 })
}

// ---------- input helpers ----------
let cur = MOBILE ? { x: 195, y: 420 } : { x: 1500, y: 600 }
async function center(sel) {
  const el = page.locator(sel).first()
  await el.scrollIntoViewIfNeeded()
  const b = await el.boundingBox()
  if (!b) throw new Error('no box for ' + sel)
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
}
async function glide(to, ms = 700) {
  const from = { ...cur }
  const n = Math.max(8, Math.round(ms / 16))
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n)
    await page.mouse.move(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k)
    await sleep(16)
  }
  cur = to
}
async function touch(type, points) {
  await cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((p) => ({ x: p.x, y: p.y, id: 1 })) })
}
async function tap(p, hold = 110) {
  if (MOBILE) {
    await touch('touchStart', [p])
    await sleep(hold)
    await touch('touchEnd', [])
  } else {
    await glide(p)
    await sleep(120)
    await page.mouse.down()
    await sleep(hold)
    await page.mouse.up()
  }
  cur = p
}
async function tapSel(sel, hold) {
  await tap(await center(sel), hold)
}
async function drag(from, to, ms = 1200) {
  // Pointer drag (synthetic touch moves aren't delivered reliably in headless Chrome).
  const n = Math.round(ms / 16)
  if (MOBILE) await page.mouse.move(from.x, from.y)
  else await glide(from, 500)
  await page.mouse.down()
  for (let i = 1; i <= n; i++) {
    const k = ease(i / n)
    const p = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k }
    await page.mouse.move(p.x, p.y)
    await sleep(16)
  }
  await page.mouse.up()
  cur = to
}
const photoLoaded = () =>
  page.waitForFunction(() => [...document.querySelectorAll('.photo-layer img')].at(-1)?.classList.contains('is-loaded'), null, { timeout: 15000 })

// A comfortable available seat around the middle of the section.
async function pickSeat(rowWanted) {
  return page.evaluate((rowWanted) => {
    const seats = [...document.querySelectorAll('.seat--available')].map((el) => {
      const [, row, num] = el.dataset.seat.split('-').map(Number)
      const b = el.getBoundingClientRect()
      return { row, num, x: b.x + b.width / 2, y: b.y + b.height / 2 }
    })
    seats.sort((a, b) => Math.abs(a.row - rowWanted) * 3 + Math.abs(a.num - 7) - (Math.abs(b.row - rowWanted) * 3 + Math.abs(b.num - 7)))
    return seats[0]
  }, rowWanted)
}

// ---------- the journey ----------
const sec = (id) => `.section[aria-label^="جایگاه ${Number(id).toLocaleString('fa-IR', { useGrouping: false })}،"]`

await sleep(1200)
if (!MOBILE) {
  // Explore the map: hover previews show real photos in the side panel.
  for (const id of ['207', '219', '112']) {
    await glide(await center(sec(id)), 800)
    await sleep(1100)
  }
  await tapSel('.cat-row:nth-child(1)')
  await sleep(1300)
  await tapSel('.cat-row:nth-child(1)')
  await sleep(500)
  await glide(await center(sec('105')), 800)
  await sleep(900)
  await tapSel(sec('105'))
} else {
  await tapSel('.chip:nth-child(1)')
  await sleep(1300)
  await tapSel('.chip:nth-child(1)')
  await sleep(700)
  await tapSel(sec('105'))
}
await page.waitForURL(/#\/s\//)
await sleep(1300)

// Seat selection
const seat = await pickSeat(7)
if (!MOBILE) {
  await glide({ x: seat.x + 120, y: seat.y - 60 }, 700)
  await glide({ x: seat.x, y: seat.y }, 600)
}
await tap(seat)
await sleep(1300)
await tapSel(MOBILE ? '.action-bar .btn--primary' : '.panel__footer .btn--primary')
await page.waitForURL(/#\/v\//)
await photoLoaded()
await sleep(1400)

// Look around the real photo
const ph = await center('.photo-viewer')
await drag({ x: ph.x + (MOBILE ? 90 : 300), y: ph.y - (MOBILE ? 80 : 0) }, { x: ph.x - (MOBILE ? 90 : 300), y: ph.y - (MOBILE ? 80 : 0) }, 1600)
await sleep(500)
await drag({ x: ph.x - (MOBILE ? 60 : 200), y: ph.y - (MOBILE ? 80 : 0) }, { x: ph.x + (MOBILE ? 40 : 100), y: ph.y - (MOBILE ? 80 : 0) }, 1200)
await sleep(900)

// Explore another real viewpoint, then come back
if (MOBILE) {
  await tapSel('.sheet__toggle')
  await sleep(900)
}
const other = '.vp-item:nth-child(4)' // behind the goal, lower tier (panorama)
await page.evaluate((s) => document.querySelector(s).scrollIntoView({ inline: 'center', block: 'nearest' }), other)
await tapSel(other)
await photoLoaded()
await sleep(2200)
await tapSel('.view-note .link-btn')
await sleep(1600)
if (MOBILE) {
  await tapSel('.sheet__toggle')
  await sleep(700)
}

// Checkout: ticket prints, then the demo confirmation
await tapSel('.view-actions .btn--light')
await page.waitForURL(/#\/checkout\//)
await sleep(2800)
await tapSel(MOBILE ? '.action-bar .btn--primary' : '.panel__footer .btn--primary')
await sleep(2800)

recording = false
await loop
if (!MOBILE) await cdp.send('Page.stopScreencast')
await browser.close()

// ffmpeg concat list with real frame durations (last frame held 1 s).
const lines = ['ffconcat version 1.0']
frames.forEach((f, i) => {
  const d = i < frames.length - 1 ? frames[i + 1].t - f.t : 1
  lines.push(`file 'frames/${f.file}'`, `duration ${Math.max(0.001, d).toFixed(4)}`)
})
lines.push(`file 'frames/${frames.at(-1).file}'`)
fs.writeFileSync(path.join(outDir, 'frames.txt'), lines.join('\n'))
const dur = frames.at(-1).t - frames[0].t
console.log(`${mode}: ${frames.length} frames, ${dur.toFixed(1)}s, ~${(frames.length / dur).toFixed(0)} fps`)
