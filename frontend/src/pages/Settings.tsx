import { useState } from 'react'

export default function Settings() {
  const [blockLowConf, setBlockLowConf] = useState(true)
  const [neverTouchTrust, setNeverTouchTrust] = useState(true)
  const [autoApply, setAutoApply] = useState(false)

  const members = [
    { initials: 'DK', name: 'Dana Kimura', email: 'dana@acme.io', role: 'Admin · approver', gradient: true, twofa: true },
    { initials: 'MR', name: 'Marco Reyes', email: 'marco@acme.io', role: 'Engineer', gradient: false, twofa: true },
    { initials: 'JP', name: 'Jules Park', email: 'jules@acme.io', role: 'Read-only', gradient: false, twofa: false },
  ]

  return (
    <div style={{ padding: '26px 24px 48px', maxWidth: 980 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 5 }}>Settings</h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Workspace acme-platform · 7 members · plan Enterprise</p>

      <div style={{ display: 'grid', gap: 12 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>API keys &amp; model configuration</div>
          <div style={{ fontSize: 12.5, color: 'var(--subtle)', marginBottom: 14 }}>Keys are encrypted at rest and never written into evidence reports.</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { label: 'Anthropic API key', value: 'sk-ant-api03-••••••••••••••••••4f2a', action: 'Rotate' },
              { label: 'Default model', value: 'claude-opus-4.6', action: 'Change' },
              { label: 'Reasoning budget', value: '32k tokens / iteration', action: 'Edit' },
            ].map((row) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,150px) minmax(0,1fr) auto', gap: 12, alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--sunken)' }}>
                <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>{row.label}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.value}</span>
                <span style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>{row.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Sandbox connection</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            <div><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>Simulator endpoint</div><input className="input mono" defaultValue="sim-us-east-1.leastpriv.io" /></div>
            <div><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>Mirror refresh interval</div><input className="input mono" defaultValue="15 minutes" /></div>
            <div><div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>Traffic replay source</div><input className="input mono" defaultValue="cloudtrail + vpc-flow" /></div>
          </div>
          <div className="mono" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--healthy)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--healthy)' }} />connected · heartbeat 240ms · 3 mirrors active
          </div>
        </div>

        <div className="card card-pad">
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Safety thresholds &amp; guardrails</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>Block removals below 85% confidence</div><div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>Low-confidence candidates go to the approval queue instead.</div></div>
              <div className={`toggle ${blockLowConf ? 'on' : 'off'}`} onClick={() => setBlockLowConf((v) => !v)}><div className="toggle-knob" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-soft)' }}>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>Never touch trust policies or org SCPs</div><div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>Hard guardrail — cannot be disabled by run configuration.</div></div>
              <div className={`toggle ${neverTouchTrust ? 'on' : 'off'}`} onClick={() => setNeverTouchTrust((v) => !v)}><div className="toggle-knob" /></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>Auto-apply converged policies to live account</div><div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>Off — every export requires a named approver.</div></div>
              <div className={`toggle ${autoApply ? 'on' : 'off'}`} onClick={() => setAutoApply((v) => !v)}><div className="toggle-knob" /></div>
            </div>
          </div>
        </div>

        <div className="card" style={{ overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>Team members</span>
            <button className="btn btn-tint btn-sm">Invite</button>
          </div>
          <div className="table-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) 130px 80px', gap: 12, minWidth: 560 }}>
            <span>MEMBER</span><span>EMAIL</span><span>ROLE</span><span>2FA</span>
          </div>
          {members.map((m) => (
            <div key={m.email} className="table-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) 130px 80px', gap: 12, minWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: m.gradient ? 'linear-gradient(135deg, var(--accent), var(--diff))' : 'var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: m.gradient ? '#fff' : 'var(--ink-2)' }}>{m.initials}</div>
                <span style={{ fontSize: 12.5 }}>{m.name}</span>
              </div>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{m.email}</span>
              <span style={{ justifySelf: 'start', fontSize: 10.5, padding: '3px 8px', borderRadius: 100, border: `1px solid ${m.role.includes('Admin') ? 'rgb(var(--healthy-rgb) / .30)' : 'var(--border-strong)'}`, color: m.role.includes('Admin') ? 'var(--healthy)' : 'var(--muted)' }}>{m.role}</span>
              <span className="mono" style={{ fontSize: 11, color: m.twofa ? 'var(--healthy)' : 'var(--checking)' }}>{m.twofa ? 'on' : 'off'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
