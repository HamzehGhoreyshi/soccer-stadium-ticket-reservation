// Sample event data. There is no backend: everything here is realistic demo data.

export type CategoryId = 'c1' | 'c2' | 'c3'

export interface Category {
  id: CategoryId
  name: string
  short: string
  price: number // تومان
  /** Muted hue used for the section fill on the map. */
  color: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  c1: { id: 'c1', name: 'دستهٔ یک', short: 'دسته ۱', price: 950_000, color: '#c4936f' },
  c2: { id: 'c2', name: 'دستهٔ دو', short: 'دسته ۲', price: 600_000, color: '#7fa38a' },
  c3: { id: 'c3', name: 'دستهٔ سه', short: 'دسته ۳', price: 350_000, color: '#7b92b3' },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

export const MATCH = {
  home: 'استقلال',
  away: 'پرسپولیس',
  competition: 'لیگ برتر · هفتهٔ دوازدهم',
  // 6 Azar 1405 = 27 Nov 2026
  date: new Date('2026-11-27T17:00:00+03:30'),
  stadium: 'ورزشگاه آزادی',
  city: 'تهران',
}

const dateFmt = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'Asia/Tehran',
})
const timeFmt = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Tehran',
})

export const matchDate = dateFmt.format(MATCH.date)
export const matchTime = timeFmt.format(MATCH.date)
export const matchTitle = `${MATCH.home} – ${MATCH.away}`
