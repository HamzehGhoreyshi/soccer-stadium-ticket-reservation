import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  const show = useCallback((m: string) => {
    setMsg(m)
    clearTimeout(t.current)
    t.current = setTimeout(() => setMsg(null), 2600)
  }, [])
  useEffect(() => () => clearTimeout(t.current), [])
  const node = (
    <div className={`toast${msg ? ' toast--show' : ''}`} role="status" aria-live="polite">
      {msg}
    </div>
  )
  return { show, node }
}
