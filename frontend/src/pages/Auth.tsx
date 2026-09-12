import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { TopBanner } from '../components/TopBanner'
import { useToast } from '../lib/toast'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const { fire } = useToast()
  const [params] = useSearchParams()
  const [authError, setAuthError] = useState(params.get('error') === '1')
  const isLogin = mode === 'login'

  function submit() {
    fire('success', 'Signed in', 'Workspace acme-platform · 4 environments synced')
    navigate('/app')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--canvas)' }}>
      <TopBanner right="Sign in with your work account" />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', minWidth: 0 }}>
          <Logo />

          <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', padding: '32px 0' }}>
            <h1 style={{ fontSize: 26, letterSpacing: '-0.025em', fontWeight: 600, marginBottom: 8 }}>
              {isLogin ? 'Sign in to LeastPriv' : 'Create your workspace'}
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 28 }}>
              {isLogin
                ? 'Read-only by default. Nothing is applied to your cloud without an approved run.'
                : 'Start with a sandbox mirror. Connect a live account whenever you\'re ready.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>G</span>Google
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>⌥</span>GitHub
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <div className="divider-h" style={{ flex: 1 }} />
              <span className="mono" style={{ fontSize: 10, color: 'var(--faint)', letterSpacing: '.1em' }}>OR</span>
              <div className="divider-h" style={{ flex: 1 }} />
            </div>

            {authError && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', border: '1px solid rgb(var(--broken-rgb) / .40)', background: 'rgb(var(--broken-rgb) / .08)', borderRadius: 10, padding: '11px 13px', marginBottom: 16 }}>
                <span style={{ color: 'var(--broken)', fontSize: 12, lineHeight: 1.4 }}>✕</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--broken)' }}>Invalid credentials</div>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>Email or password is incorrect. 2 attempts remaining before a 15-minute lockout.</div>
                </div>
              </div>
            )}

            {!isLogin && (
              <div style={{ marginBottom: 14 }}>
                <label className="field-label">Workspace name</label>
                <input className="input" defaultValue="acme-platform" />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label className="field-label">Work email</label>
              <input className="input" defaultValue="dana@acme.io" />
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="field-label" style={{ margin: 0 }}>Password</label>
                {isLogin && <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>Forgot password?</span>}
              </div>
              <input className="input mono" type="password" defaultValue="hunter2hunter2" />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={submit}>
              {isLogin ? 'Sign in' : 'Create workspace'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 12.5, color: 'var(--subtle)' }}>
              {isLogin ? (
                <span>No account? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/signup')}>Create one</span></span>
              ) : (
                <span>Already have one? <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate('/signin')}>Sign in</span></span>
              )}
              <span
                className="mono"
                style={{ fontSize: 10.5, color: 'var(--faint)', cursor: 'pointer', border: '1px dashed var(--border)', padding: '3px 6px', borderRadius: 8 }}
                onClick={() => setAuthError(true)}
              >demo: error state</span>
            </div>
          </div>

          <div className="mono" style={{ fontSize: 10.5, color: 'var(--faint)' }}>SOC 2 Type II · SSO/SAML on Enterprise · no write access without approval</div>
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
