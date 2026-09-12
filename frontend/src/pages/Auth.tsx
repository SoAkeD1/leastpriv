import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { TopBanner } from '../components/TopBanner'
import { useAuth } from '../lib/auth'
import { useToast } from '../lib/toast'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, signup } = useAuth()
  const { fire } = useToast()
  const isLogin = mode === 'login'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [workspace, setWorkspace] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname || '/app/dashboard'

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isLogin) {
        await login({ email, password })
      } else {
        await signup({ email, password, name, workspace: workspace || undefined })
      }
      fire('success', isLogin ? 'Signed in' : 'Workspace created', email)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
      <TopBanner right="Sign in with your work account" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', minWidth: 0 }}>
          <Logo />

          <form onSubmit={submit} style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '32px 0' }}>
            <h1 style={{ fontSize: 26, letterSpacing: '-0.025em', fontWeight: 600, marginBottom: 8 }}>
              {isLogin ? 'Sign in to LeastPriv' : 'Create your workspace'}
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 28 }}>
              {isLogin
                ? 'Read-only by default. Nothing is applied to your cloud without an approved run.'
                : 'Start with a sandbox mirror. Connect a live account whenever you\'re ready.'}
            </p>

            {error && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid rgb(var(--broken-rgb) / .40)', background: 'rgb(var(--broken-rgb) / .08)', borderRadius: 10, padding: '11px 13px', marginBottom: 16 }}>
                <span style={{ color: 'var(--broken)', fontSize: 12, lineHeight: 1.4 }}>✕</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--broken)' }}>{isLogin ? 'Sign-in failed' : 'Could not create account'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{error}</div>
                </div>
              </div>
            )}

            {!isLogin && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Your name</label>
                  <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Dana Kimura" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label className="field-label">Workspace name</label>
                  <input className="input" value={workspace} onChange={(e) => setWorkspace(e.target.value)} placeholder="acme-platform" />
                </div>
              </>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Work email</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dana@acme.io" autoComplete="email" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label className="field-label">Password</label>
              <input className="input mono" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isLogin ? 'current-password' : 'new-password'} />
              {!isLogin && <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 5 }}>At least 8 characters.</div>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} disabled={submitting}>
              {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create workspace'}
            </button>

            <div style={{ fontSize: 12.5, color: 'var(--subtle)' }}>
              {isLogin ? (
                <span>No account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/signup')}>Create one</span></span>
              ) : (
                <span>Already have one? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/signin')}>Sign in</span></span>
              )}
            </div>
          </form>

          <div className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>Passwords are hashed with bcrypt · sessions are JWT, 7-day expiry</div>
        </div>

        <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', borderLeft: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, minWidth: 0 }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize: '44px 44px', opacity: .55 }} />
          <div style={{ position: 'absolute', width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgb(var(--accent-rgb) / .10), transparent 65%)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 420, aspectRatio: '1' }}>
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 78, height: 78, border: '1px solid var(--healthy-border)', background: 'rgb(var(--healthy-rgb) / .08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--healthy)', textAlign: 'center', lineHeight: 1.3 }}>role<br />arn</div>
            <div style={{ position: 'absolute', inset: 0, border: '1px dashed var(--border)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: '19%', border: '1px dashed var(--border-soft)', borderRadius: '50%' }} />
            {[
              { pos: { left: '50%', top: -1, transform: 'translate(-50%,-50%)' }, color: 'var(--broken)' },
              { pos: { right: '8%', top: '18%' }, color: 'var(--diff)' },
              { pos: { right: -1, top: '50%', transform: 'translate(50%,-50%)' }, color: 'var(--healthy)' },
              { pos: { right: '8%', bottom: '18%' }, color: 'var(--accent)' },
              { pos: { left: '50%', bottom: -1, transform: 'translate(-50%,50%)' }, color: 'var(--healthy)' },
              { pos: { left: '8%', bottom: '18%' }, color: 'var(--checking)' },
              { pos: { left: -1, top: '50%', transform: 'translate(-50%,-50%)' }, color: 'var(--healthy)' },
              { pos: { left: '8%', top: '18%' }, color: 'var(--broken)', pulse: true },
            ].map((n, i) => (
              <div key={i} style={{ position: 'absolute', width: 13, height: 13, background: 'var(--surface)', border: `1px solid ${n.color}`, animation: n.pulse ? 'lp-pulse 2.4s ease-in-out infinite' : undefined, ...n.pos }} />
            ))}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid transparent', borderTopColor: 'rgb(var(--accent-rgb) / .55)', animation: 'lp-orbit 9s linear infinite' }} />
          </div>
          <div style={{ position: 'absolute', left: 48, bottom: 44, right: 48 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.9 }}>
              <div><span style={{ color: 'var(--broken)' }}>■</span> 31 permissions never exercised</div>
              <div><span style={{ color: 'var(--checking)' }}>■</span> 2 wildcard grants pending review</div>
              <div><span style={{ color: 'var(--healthy)' }}>■</span> 11 permissions verified in use</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
