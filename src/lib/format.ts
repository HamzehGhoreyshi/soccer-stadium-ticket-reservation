const faNumber = new Intl.NumberFormat('fa-IR')
const faDigits = '۰۱۲۳۴۵۶۷۸۹'

/** Format a number with Persian digits and Persian thousands separator (۱۲٬۳۴۵). */
export const fa = (n: number) => faNumber.format(n)

/** Replace Latin digits in an arbitrary string with Persian digits. */
export const faText = (s: string | number) => String(s).replace(/\d/g, (d) => faDigits[+d])

export const toman = (n: number) => `${fa(n)} تومان`

/** Compact price for chips: ۹۵۰ هزار */
export const tomanShort = (n: number) =>
  n >= 1_000_000 && n % 1_000_000 === 0
    ? `${fa(n / 1_000_000)} میلیون`
    : n >= 1000
      ? `${fa(Math.round(n / 1000))} هزار`
      : fa(n)

export const meters = (n: number) => `${fa(Math.round(n))} متر`
