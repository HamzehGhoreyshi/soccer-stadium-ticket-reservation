// Builds optimized runtime assets from assets-src/.
//  - Ravi .otf  -> public/fonts/*.woff2
//  - Photos     -> public/photos/<key>-<w>.(avif|webp) + src/data/photo-manifest.json
// Run: npm run assets
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import wawoff2 from 'wawoff2'

const root = path.resolve(import.meta.dirname, '..')
const src = path.join(root, 'assets-src')

async function fonts() {
  const out = path.join(root, 'public/fonts')
  await fs.mkdir(out, { recursive: true })
  for (const f of await fs.readdir(src)) {
    if (!f.endsWith('.otf')) continue
    const buf = await fs.readFile(path.join(src, f))
    const woff2 = await wawoff2.compress(buf)
    await fs.writeFile(path.join(out, f.replace('.otf', '.woff2')), woff2)
    console.log('font', f, `${(woff2.length / 1024).toFixed(0)}KB`)
  }
}

// Panoramas are sized by height (they pan horizontally); regular photos by width.
const PANORAMAS = new Set(['upper-top-pano', 'end-lower-pano'])
const WIDTHS = [640, 1280, 1920, 2560]
const PANO_HEIGHTS = [560, 900, 1200]

async function photos() {
  const dir = path.join(src, 'photos')
  const out = path.join(root, 'public/photos')
  await fs.mkdir(out, { recursive: true })
  const credits = JSON.parse(await fs.readFile(path.join(dir, 'credits.json'), 'utf8'))
  const manifest = {}
  for (const key of Object.keys(credits)) {
    const file = path.join(dir, `${key}.jpg`)
    if (!(await fs.stat(file).catch(() => null))) {
      console.warn('missing photo, skipped:', key, '(run npm run photos:fetch)')
      continue
    }
    const img = sharp(file, { failOn: 'none' }).rotate()
    const meta = await img.metadata()
    const [w0, h0] = meta.orientation >= 5 ? [meta.height, meta.width] : [meta.width, meta.height]
    const pano = PANORAMAS.has(key)
    const targets = pano
      ? PANO_HEIGHTS.map((h) => Math.round((h / h0) * w0)).filter((w) => w <= w0)
      : WIDTHS.filter((w) => w <= w0)
    if (!pano && (!targets.length || targets.at(-1) < w0 * 0.9)) targets.push(Math.min(w0, 2560))
    const widths = [...new Set(targets)].sort((a, b) => a - b)
    for (const w of widths) {
      const pipe = sharp(file, { failOn: 'none' }).rotate().resize({ width: w })
      await pipe.clone().avif({ quality: 55, effort: 5 }).toFile(path.join(out, `${key}-${w}.avif`))
      await pipe.clone().webp({ quality: 78 }).toFile(path.join(out, `${key}-${w}.webp`))
    }
    const lqip = await sharp(file, { failOn: 'none' }).rotate().resize({ width: 24 }).blur(1).webp({ quality: 40 }).toBuffer()
    const c = credits[key]
    manifest[key] = {
      width: w0,
      height: h0,
      widths,
      placeholder: `data:image/webp;base64,${lqip.toString('base64')}`,
      credit: { title: c.title, author: c.author, license: c.license, licenseUrl: c.licenseUrl, page: c.page },
    }
    console.log('photo', key, `${w0}x${h0}`, widths.join(','))
  }
  await fs.writeFile(path.join(root, 'src/data/photo-manifest.json'), JSON.stringify(manifest, null, 2))
}

const only = process.argv[2] // "fonts" | "photos" | undefined (both)
if (only !== 'photos') await fonts()
if (only !== 'fonts') await photos()
