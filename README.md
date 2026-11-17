# بلیت ورزشگاه آزادی — Azadi Stadium ticket booking (demo)

A Persian (RTL) football ticket-booking prototype for Tehran's Azadi Stadium. It uses real
stadium photography instead of a 3D render.

Flow: **stadium map → seat map → real view from the seat → ticket confirmation**.

## Run

```bash
npm install
npm run dev
```

## Structure

| Part | Where | What it does |
|---|---|---|
| Stadium model | `src/data/stadium.ts` | Bowl geometry in metres (105×68 pitch, track, two tiers), 44 sections, zones, categories, distances |
| Seats | `src/data/seats.ts` | Deterministic sample availability per section (same every load) |
| Real viewpoints | `src/data/viewpoints.ts` | 8 real Azadi photos, each tied to a part of the bowl; seat → closest real viewpoint |
| Router | `src/lib/router.ts` | The URL holds the selection (`#/s/104?seat=104-16-2`), so screens stay in sync and Back works |
| Screens | `src/screens/*` | Overview, Seats, View, Checkout — each renders one `Layout` with a mobile and a desktop arrangement |
| Components | `src/components/*` | StadiumMap, SeatMap, PhotoViewer, booking blocks, Layout/TopBar/ActionBar |
| Assets | `scripts/build-assets.mjs` | Ravi `.otf` → `.woff2`; photos → AVIF/WebP at several widths + blurred placeholders |

Layouts: below 1024px, a mobile layout (top bar, full-bleed canvas, bottom bar or sheet, a
portrait map). At 1024px and up, a desktop layout (side panel on the right, large canvas, a
landscape map).

## Assets

- Photos come from Wikimedia Commons under CC BY / CC BY-SA. Author and license show on every
  photo and in the info dialog. Source files: `assets-src/photos/` (`npm run photos:fetch`,
  then `npm run assets`).
- **Ravi is a commercial font and is not in this repo.** If you own it, copy `RaviFaNum-{Regular,Medium,SemiBold,Bold}.otf`
  into `assets-src/`, then run `npm run assets fonts`. Without it, the app falls back to Tahoma or the system font.

## Honesty rules built in

- A seat's photo is the **closest real viewpoint we have**, and the UI says so. It is never
  presented as the exact view or as a 3D scene.
- Distances are computed from the stadium model and labelled approximate.
- Checkout is a demo. Nothing is charged, and the ticket is marked «نمونهٔ آزمایشی» (demo).
