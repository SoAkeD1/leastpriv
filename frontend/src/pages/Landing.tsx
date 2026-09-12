import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { TopBanner } from '../components/TopBanner'

const LOOP_STEPS = [
  { n: '01', color: 'var(--healthy)', title: 'Analyze', body: 'Reads attached policies, 90d CloudTrail access records, and the service dependency graph.' },
  { n: '02', color: 'var(--diff)', title: 'Propose', body: 'Drafts a revised policy — removals, scope narrowing, condition keys — with a rationale per line.' },
  { n: '03', color: 'var(--accent)', title: 'Simulate', body: 'Applies the draft in a sandboxed mirror of your cloud and replays real traffic patterns.' },
  { n: '04', color: 'var(--broken)', title: 'Detect breakage', body: 'Watches health per service. A 403 anywhere is a failed hypothesis, not a rollback.' },
  { n: '05', color: 'var(--checking)', title: 'Revise', body: 'Diagnoses the exact missing dependency, restores the narrowest grant that fixes it, loops.' },
]

const WHEEL_POS: CSSProperties[] = [
  { left: '50%', top: 0, transform: 'translate(-50%,0)' },
  { right: 0, top: '34%' },
  { right: '6%', bottom: '6%' },
  { left: '6%', bottom: '6%' },
  { left: 0, top: '34%' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--canvas)' }}>
      <TopBanner right="SOC 2 Type II · read-only by default" />

      <div className="navbar">
        <Logo withVersion />
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <div className="navlinks">
            <span>Product</span>
            <span>How it works</span>
            <span>Docs</span>
            <span>Pricing</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/signin')}>Sign in</button>
            <button className="btn btn-primary" onClick={() => navigate('/app')}>Launch Console</button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '96px 32px 80px', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 64, alignItems: 'center' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', background: 'var(--surface)', padding: '5px 10px', borderRadius: 100, fontSize: 12, color: 'var(--muted)', marginBottom: 26 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--healthy)', animation: 'lp-pulse 2s ease-in-out infinite' }} />
            Autonomous IAM remediation · closed loop
          </div>
          <h1 style={{ fontSize: 52, lineHeight: 1.06, letterSpacing: '-0.018em', fontWeight: 600, marginBottom: 20 }}>
            Least privilege,<br />proven — not guessed.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: 'var(--muted)', maxWidth: 520, marginBottom: 32 }}>
            LeastPriv strips every permission your services don't use, then proves the cut is safe by breaking it in a sandbox first. Simulate, detect, diagnose, revise — until minimum permissions ship with zero broken services.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 34 }}>
            <button className="btn btn-primary" onClick={() => navigate('/app')}>Launch Console</button>
            <button className="btn btn-secondary" onClick={() => navigate('/signin')}>Read the evidence spec</button>
          </div>
          <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap' }}>
            <div><div className="stat-figure" style={{ fontSize: 28 }}>24.1k</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>permissions removed</div></div>
            <div className="divider-v" />
            <div><div className="stat-figure" style={{ fontSize: 28, color: 'var(--healthy)' }}>0</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>production incidents</div></div>
            <div className="divider-v" />
            <div><div className="stat-figure" style={{ fontSize: 28 }}>3.2</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>avg iterations to converge</div></div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-float)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', background: 'var(--canvas)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--checking)', animation: 'lp-pulse 1.4s ease-in-out infinite' }} />
              run/8c31 · iteration 3
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--subtle)' }}>00:04:12</span>
          </div>
          <div style={{ padding: 14, display: 'grid', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,minmax(0,1fr))', gap: 6 }}>
              {[false, false, true, false, 'checking', false].map((v, i) => (
                <div key={i} style={{
                  height: 34,
                  border: v === true ? '1px solid var(--broken)' : v === 'checking' ? '1px solid var(--checking)' : '1px solid rgb(var(--healthy-rgb) / .35)',
                  background: v === true ? 'rgb(var(--broken-rgb) / .14)' : v === 'checking' ? 'rgb(var(--checking-rgb) / .12)' : 'rgb(var(--healthy-rgb) / .09)',
                  animation: v === true ? 'lp-flash 1.6s ease-in-out infinite' : undefined,
                }} />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 11.5, lineHeight: 1.75, color: 'var(--muted)', background: 'var(--sunken)', border: '1px solid var(--border-soft)', padding: 12, borderRadius: 10 }}>
              <div><span style={{ color: 'var(--accent)' }}>THOUGHT</span> checkout-api returned 403 after rev-2</div>
              <div><span style={{ color: 'var(--diff)' }}>TOOL</span> cloudtrail.query --action kms:Decrypt --90d</div>
              <div><span style={{ color: 'var(--muted)' }}>OBS</span> 1,204 calls · key arn:aws:kms:…:key/9f2a</div>
              <div><span style={{ color: 'var(--checking)' }}>REPLAN</span> restore kms:Decrypt scoped to 1 key<span style={{ color: 'var(--healthy)' }}>▍</span></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 3, background: 'var(--healthy)' }} />
              <div style={{ flex: 1, height: 3, background: 'var(--broken)' }} />
              <div style={{ flex: 1, height: 3, background: 'var(--checking)', animation: 'lp-pulse 1.2s ease-in-out infinite' }} />
              <div style={{ flex: 1, height: 3, background: 'var(--border)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Problem */}
      <div style={{ borderTop: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '76px 32px', display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: 64 }}>
          <div>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--broken)', marginBottom: 14 }}>THE PROBLEM</div>
            <h2 style={{ fontSize: 34, lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 600, marginBottom: 16 }}>One stolen key inherits everything you never revoked.</h2>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--muted)' }}>IAM policies only ever grow. An engineer adds a wildcard at 2am to unblock a deploy, and it stays for four years. Nobody removes permissions, because nobody can prove the removal is safe — so blast radius compounds silently until the day it doesn't.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14 }}>
            <div className="card card-pad">
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--broken)' }}>99.6%</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>of granted permissions go unused in a 90-day window</div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--checking)' }}>41</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>median services reachable from one leaked CI role</div>
            </div>
            <div className="card card-pad">
              <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em' }}>0</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>teams willing to hand-trim a policy on a Friday</div>
            </div>
            <div style={{ background: 'var(--sunken)', border: '1px dashed var(--border-strong)', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--subtle)', lineHeight: 1.6 }}>
                "Action": "s3:*"<br />"Resource": "*"<br /><span style={{ color: 'var(--broken)' }}>// added 2021-04-09, still live</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--accent)', marginBottom: 12 }}>HOW IT WORKS</div>
          <h2 style={{ margin: '0 auto 12px', fontSize: 34, lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 600, maxWidth: 640 }}>A loop, not a pipeline. It runs until the evidence says stop.</h2>
          <p style={{ margin: '0 auto', fontSize: 15, color: 'var(--muted)', maxWidth: 560, lineHeight: 1.6 }}>Every breakage feeds back into the next proposal. The agent exits only when permissions are minimal and all services are green.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 56, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 460, aspectRatio: '1', margin: '0 auto' }}>
            <div style={{ position: 'absolute', inset: '12%', border: '1px dashed var(--border)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: '12%', borderRadius: '50%', border: '1px solid transparent', borderTopColor: 'var(--accent)', animation: 'lp-orbit 6s linear infinite' }} />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%', borderRadius: '50%', background: 'var(--sunken)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Agent loop</div>
              <div className="mono" style={{ fontSize: 10, color: 'var(--subtle)', marginTop: 4 }}>max 8 iterations</div>
            </div>
            {LOOP_STEPS.map((s, i) => (
              <div key={s.n} style={{
                position: 'absolute', ...WHEEL_POS[i],
                background: 'var(--surface)', border: `1px solid ${s.color}`, color: 'var(--ink)',
                fontSize: 12, fontWeight: 500, padding: '7px 12px', borderRadius: 10, whiteSpace: 'nowrap',
              }}>
                <span style={{ color: s.color, fontFamily: 'var(--font-mono)', fontSize: 10, marginRight: 6 }}>{s.n}</span>{s.title}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {LOOP_STEPS.map((s) => (
              <div key={s.n} className="card" style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 14, padding: '16px 18px' }}>
                <div className="mono" style={{ fontSize: 11, color: s.color, paddingTop: 2 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.55 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why an agent */}
      <div style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--surface)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '76px 32px' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '.12em', color: 'var(--diff)', marginBottom: 12 }}>WHY AN AGENT, NOT A CHATBOT</div>
          <h2 style={{ fontSize: 34, lineHeight: 1.15, letterSpacing: '-0.025em', fontWeight: 600, maxWidth: 680, marginBottom: 36 }}>A one-shot suggestion is a guess. A loop with a sandbox is a proof.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--subtle)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>One-shot LLM suggestion</span>
              </div>
              <div style={{ padding: '6px 18px 16px' }}>
                {['Guesses which permissions are unused from policy text alone', 'Never observes the consequence of its own change', 'Fails silently in production, hours later, at 3am', 'Ships a suggestion; the human owns the risk'].map((t, i, arr) => (
                  <div key={t} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : undefined, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--broken)' }}>✕</span>{t}
                  </div>
                ))}
              </div>
            </div>
            <div className="card" style={{ overflow: 'hidden', borderColor: 'var(--healthy-border)', boxShadow: '0 0 0 1px rgb(var(--healthy-rgb) / .08)' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgb(var(--healthy-rgb) / .06)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--healthy)' }} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>LeastPriv agent loop</span>
              </div>
              <div style={{ padding: '6px 18px 16px' }}>
                {['Grounds every removal in 90 days of observed access', 'Breaks it in a sandbox first and watches what dies', 'Diagnoses the missing dependency and re-simulates', 'Ships a policy plus an evidence report per changed line'].map((t, i, arr) => (
                  <div key={t} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-soft)' : undefined, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--healthy)' }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border-soft)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '44px 32px', display: 'flex', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 300 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div className="logo-mark" style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>LeastPriv</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--subtle)', lineHeight: 1.6 }}>Autonomous least-privilege remediation with sandbox-verified evidence.</p>
          </div>
          <div style={{ display: 'flex', gap: 56, flexWrap: 'wrap', fontSize: 12.5 }}>
            <div style={{ display: 'grid', gap: 8 }}><div style={{ fontWeight: 600, marginBottom: 2 }}>Product</div><span style={{ color: 'var(--subtle)' }}>Console</span><span style={{ color: 'var(--subtle)' }}>Environments</span><span style={{ color: 'var(--subtle)' }}>Evidence reports</span></div>
            <div style={{ display: 'grid', gap: 8 }}><div style={{ fontWeight: 600, marginBottom: 2 }}>Developers</div><span style={{ color: 'var(--subtle)' }}>API reference</span><span style={{ color: 'var(--subtle)' }}>Terraform provider</span><span style={{ color: 'var(--subtle)' }}>Changelog</span></div>
            <div style={{ display: 'grid', gap: 8 }}><div style={{ fontWeight: 600, marginBottom: 2 }}>Company</div><span style={{ color: 'var(--subtle)' }}>Security</span><span style={{ color: 'var(--subtle)' }}>Trust center</span><span style={{ color: 'var(--subtle)' }}>Contact</span></div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border-soft)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>© 2026 LeastPriv Labs, Inc.</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>SOC 2 Type II · read-only by default</span>
          </div>
        </div>
      </div>
    </div>
  )
}
