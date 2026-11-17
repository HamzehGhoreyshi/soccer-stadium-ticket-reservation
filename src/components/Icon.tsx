// Small inline icon set (24px grid, 1.75 stroke). Direction-sensitive icons
// (back/forward) are drawn for RTL: "back" points right.

const PATHS = {
  back: 'M9 5l7 7-7 7',
  forward: 'M15 5l-7 7 7 7',
  info: 'M12 8h.01M11 12h1v5h1 M12 3a9 9 0 100 18 9 9 0 000-18z',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  fit: 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  drag: 'M7 9l-3 3 3 3M17 9l3 3-3 3M4 12h16',
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z M12 9a3 3 0 100 6 3 3 0 000-6z',
  swap: 'M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 10.5a3 3 0 100 6 3 3 0 000-6z',
  ticket: 'M4 7h16v3a2 2 0 000 4v3H4v-3a2 2 0 000-4z M14 7v10',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0119 9.5C19 14.8 12 21 12 21z M12 7.5a2 2 0 100 4 2 2 0 000-4z',
  seat: 'M7 11V6.5A2.5 2.5 0 019.5 4h5A2.5 2.5 0 0117 6.5V11 M5 11h14v4H5z M7 15v4 M17 15v4',
  expand: 'M6 15l6-6 6 6',
  collapse: 'M6 9l6 6 6-6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
