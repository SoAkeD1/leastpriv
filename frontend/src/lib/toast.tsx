import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type ToastKind = 'success' | 'warning' | 'error'

interface Toast {
  id: string
  kind: ToastKind
  title: string
  body: string
}

interface ToastContextValue {
  toasts: Toast[]
  fire: (kind: ToastKind, title: string, body: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const GLYPH: Record<ToastKind, string> = { success: '✓', warning: '!', error: '✕' }
const COLOR_VAR: Record<ToastKind, string> = {
  success: 'var(--healthy)',
  warning: 'var(--checking)',
  error: 'var(--broken)',
}
const BORDER_VAR: Record<ToastKind, string> = {
  success: 'rgb(var(--healthy-rgb) / .35)',
  warning: 'rgb(var(--checking-rgb) / .40)',
  error: 'rgb(var(--broken-rgb) / .40)',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const fire = useCallback((kind: ToastKind, title: string, body: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, kind, title, body }])
    const timer = setTimeout(() => dismiss(id), 5200)
    timers.current.set(id, timer)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, fire, dismiss }}>
      {children}
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 70, display: 'grid', gap: 9, justifyItems: 'end' }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 11, minWidth: 290, maxWidth: 380,
              background: 'var(--surface)', border: `1px solid ${BORDER_VAR[t.kind]}`, borderRadius: 14,
              padding: '12px 14px', boxShadow: 'var(--shadow-toast)', animation: 'lp-toast .22s ease-out',
            }}
          >
            <span style={{ color: COLOR_VAR[t.kind], fontSize: 12, lineHeight: 1.5 }}>{GLYPH[t.kind]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{t.title}</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>{t.body}</div>
            </div>
            <span
              onClick={() => dismiss(t.id)}
              style={{ color: 'var(--faint)', fontSize: 12, cursor: 'pointer' }}
            >✕</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
